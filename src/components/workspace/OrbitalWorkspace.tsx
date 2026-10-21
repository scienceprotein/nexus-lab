import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Pause, Play, Plus, RotateCcw, StepForward, Trash2 } from 'lucide-react'
import {
  BODY_COLORS,
  ORBITAL_PRESETS,
  cloneBodies,
  computeAccelerations,
  diagnostics,
  makeBody,
  resetIds,
  step,
  type Body,
  type OrbitalDiagnostics,
  type OrbitalParams,
} from '@/engine/orbital'
import { ParamControl } from '@/components/ParamControl'
import { SciChart } from '@/components/SciChart'
import { ControlSection, Readout, StatusPill, WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatNumber, formatSigned, downloadCSV } from '@/lib/format'

interface HistPoint {
  t: number
  ke: number
  pe: number
  te: number
  L: number
}

const MAX_HISTORY = 700

export function OrbitalWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bodiesRef = useRef<Body[]>([])
  const initialRef = useRef<Body[]>([])
  const paramsRef = useRef<OrbitalParams>({ G: 1, dt: 0.4, softening: 2, trailLength: 500 })
  const timeRef = useRef(0)
  const historyRef = useRef<HistPoint[]>([])
  const runningRef = useRef(true)
  const dragRef = useRef<number | null>(null)

  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(3)
  const [dt, setDt] = useState(0.4)
  const [gravity, setGravity] = useState(1)
  const [softening, setSoftening] = useState(2)
  const [showTrails, setShowTrails] = useState(true)
  const [showVectors, setShowVectors] = useState(true)
  const [showCOM, setShowCOM] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [diag, setDiag] = useState<OrbitalDiagnostics | null>(null)
  const [history, setHistory] = useState<HistPoint[]>([])
  const [bodiesVersion, setBodiesVersion] = useState(0)

  // Keep refs in sync with UI state
  useEffect(() => {
    paramsRef.current.dt = dt
    paramsRef.current.G = gravity
    paramsRef.current.softening = softening
    // Recompute accelerations when model parameters change
    computeAccelerations(bodiesRef.current, paramsRef.current)
  }, [dt, gravity, softening])
  useEffect(() => {
    runningRef.current = running
  }, [running])

  const loadPreset = useCallback((index: number) => {
    resetIds()
    const bodies = ORBITAL_PRESETS[index].build()
    computeAccelerations(bodies, paramsRef.current)
    bodiesRef.current = bodies
    initialRef.current = cloneBodies(bodies)
    timeRef.current = 0
    historyRef.current = []
    setHistory([])
    setSelectedId(null)
    setDiag(diagnostics(bodies, paramsRef.current, 0))
    setBodiesVersion((v) => v + 1)
  }, [])

  // Initial load
  useEffect(() => {
    loadPreset(0)
  }, [loadPreset])

  const reset = useCallback(() => {
    const bodies = cloneBodies(initialRef.current)
    computeAccelerations(bodies, paramsRef.current)
    bodiesRef.current = bodies
    timeRef.current = 0
    historyRef.current = []
    setHistory([])
    setDiag(diagnostics(bodies, paramsRef.current, 0))
    setBodiesVersion((v) => v + 1)
  }, [])

  const stepOnce = useCallback(() => {
    step(bodiesRef.current, paramsRef.current)
    timeRef.current += paramsRef.current.dt
    setRunning(false)
  }, [])

  // Main loop
  useEffect(() => {
    let raf = 0
    let frame = 0
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const render = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = parent.clientWidth
      const h = Math.round(w * 0.62)
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const bodies = bodiesRef.current

      // Advance simulation
      if (runningRef.current) {
        for (let i = 0; i < speed; i++) {
          step(bodies, paramsRef.current)
          timeRef.current += paramsRef.current.dt
        }
        const d = diagnostics(bodies, paramsRef.current, timeRef.current)
        const hist = historyRef.current
        const last = hist[hist.length - 1]
        if (!last || d.time - last.t >= paramsRef.current.dt * Math.max(speed, 2)) {
          hist.push({ t: d.time, ke: d.kinetic, pe: d.potential, te: d.total, L: d.angularMomentum })
          if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY)
        }
      }

      // Auto-fit view to content
      let extent = 60
      for (const b of bodies) {
        extent = Math.max(extent, Math.abs(b.x), Math.abs(b.y))
        for (const p of b.trail) extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y))
      }
      extent *= 1.15
      const scale = Math.min(w, h) / (2 * extent)
      const cx = w / 2
      const cy = h / 2

      // Grid
      ctx.strokeStyle = '#1A2338'
      ctx.lineWidth = 1
      const gridStep = 40
      for (let gx = cx % gridStep; gx < w; gx += gridStep) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
      }
      for (let gy = cy % gridStep; gy < h; gy += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
      }

      const d = diagnostics(bodies, paramsRef.current, timeRef.current)

      // Center of mass
      if (showCOM && bodies.length > 0) {
        const px = cx + d.comX * scale
        const py = cy + d.comY * scale
        ctx.strokeStyle = '#FBBF24'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py)
        ctx.moveTo(px, py - 7); ctx.lineTo(px, py + 7)
        ctx.stroke()
        ctx.font = '9px "JetBrains Mono", monospace'
        ctx.fillStyle = '#FBBF24'
        ctx.textAlign = 'left'
        ctx.fillText('COM', px + 9, py - 4)
      }

      // Trails
      if (showTrails) {
        for (const b of bodies) {
          if (b.trail.length < 2) continue
          ctx.strokeStyle = b.color + '44'
          ctx.lineWidth = 1
          ctx.beginPath()
          b.trail.forEach((p, i) => {
            const px = cx + p.x * scale
            const py = cy + p.y * scale
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          })
          ctx.stroke()
        }
      }

      // Bodies + vectors
      for (const b of bodies) {
        const px = cx + b.x * scale
        const py = cy + b.y * scale
        const r = Math.max(3.5, Math.cbrt(b.mass) * 2.2)
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 2.4)
        grad.addColorStop(0, b.color + '66')
        grad.addColorStop(1, b.color + '00')
        ctx.fillStyle = grad
        ctx.beginPath(); ctx.arc(px, py, r * 2.4, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = b.color
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill()
        if (b.id === selectedId) {
          ctx.strokeStyle = '#F3F6FC'
          ctx.lineWidth = 1.2
          ctx.setLineDash([3, 3])
          ctx.beginPath(); ctx.arc(px, py, r + 5, 0, Math.PI * 2); ctx.stroke()
          ctx.setLineDash([])
        }
        if (showVectors) {
          const vs = 14 / Math.max(0.4, Math.hypot(b.vx, b.vy))
          const vx = px + b.vx * vs * Math.min(3, scale * 4)
          const vy = py + b.vy * vs * Math.min(3, scale * 4)
          ctx.strokeStyle = '#34D399'
          ctx.lineWidth = 1.2
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(vx, vy); ctx.stroke()
          const ang = Math.atan2(vy - py, vx - px)
          ctx.beginPath()
          ctx.moveTo(vx, vy)
          ctx.lineTo(vx - 5 * Math.cos(ang - 0.4), vy - 5 * Math.sin(ang - 0.4))
          ctx.moveTo(vx, vy)
          ctx.lineTo(vx - 5 * Math.cos(ang + 0.4), vy - 5 * Math.sin(ang + 0.4))
          ctx.stroke()
        }
        ctx.font = '10px Inter, sans-serif'
        ctx.fillStyle = '#A8B3C7'
        ctx.textAlign = 'center'
        ctx.fillText(b.name, px, py - r - 6)
      }

      // Scale bar
      const barLU = extent / 4
      const barPx = barLU * scale
      ctx.strokeStyle = '#3A4763'
      ctx.beginPath(); ctx.moveTo(16, h - 14); ctx.lineTo(16 + barPx, h - 14); ctx.stroke()
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = '#A8B3C7'
      ctx.textAlign = 'left'
      ctx.fillText(`${formatNumber(barLU)} LU`, 16 + barPx + 6, h - 11)

      // Throttled React updates
      frame++
      if (frame % 8 === 0) {
        setDiag(d)
        setHistory([...historyRef.current])
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [speed, showTrails, showVectors, showCOM, selectedId])

  // Canvas pointer interactions: click to select, drag to reposition
  const canvasPoint = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    let extent = 60
    for (const b of bodiesRef.current) {
      extent = Math.max(extent, Math.abs(b.x), Math.abs(b.y))
      for (const p of b.trail) extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y))
    }
    extent *= 1.15
    const scale = Math.min(w, h) / (2 * extent)
    return {
      x: (e.clientX - rect.left - w / 2) / scale,
      y: (e.clientY - rect.top - h / 2) / scale,
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const p = canvasPoint(e)
    if (!p) return
    let best: Body | null = null
    let bestD = 30
    for (const b of bodiesRef.current) {
      const dd = Math.hypot(b.x - p.x, b.y - p.y)
      if (dd < bestD) {
        best = b
        bestD = dd
      }
    }
    if (best) {
      setSelectedId(best.id)
      dragRef.current = best.id
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } else {
      setSelectedId(null)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return
    const p = canvasPoint(e)
    if (!p) return
    const b = bodiesRef.current.find((bb) => bb.id === dragRef.current)
    if (b) {
      b.x = p.x
      b.y = p.y
      b.trail = []
      computeAccelerations(bodiesRef.current, paramsRef.current)
      setBodiesVersion((v) => v + 1)
    }
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const selected = bodiesRef.current.find((b) => b.id === selectedId) ?? null

  const updateSelected = (patch: Partial<Body>) => {
    const b = bodiesRef.current.find((bb) => bb.id === selectedId)
    if (!b) return
    Object.assign(b, patch)
    b.trail = []
    computeAccelerations(bodiesRef.current, paramsRef.current)
    setBodiesVersion((v) => v + 1)
  }

  const addBody = () => {
    const bodies = bodiesRef.current
    const d = diagnostics(bodies, paramsRef.current, timeRef.current)
    const totalMass = bodies.reduce((s, b) => s + b.mass, 0)
    let maxR = 100
    for (const b of bodies) maxR = Math.max(maxR, Math.hypot(b.x - d.comX, b.y - d.comY))
    const r = maxR * 1.5
    const v = Math.sqrt((paramsRef.current.G * Math.max(totalMass, 1)) / r)
    const nb = makeBody({
      name: `Body ${bodies.length + 1}`,
      mass: 1,
      x: d.comX + r,
      y: d.comY,
      vx: 0,
      vy: v,
      color: BODY_COLORS[bodies.length % BODY_COLORS.length],
    })
    computeAccelerations([...bodies, nb], paramsRef.current)
    bodiesRef.current = [...bodies, nb]
    initialRef.current = cloneBodies(bodiesRef.current)
    setSelectedId(nb.id)
    setBodiesVersion((v) => v + 1)
  }

  const removeSelected = () => {
    if (selectedId === null) return
    bodiesRef.current = bodiesRef.current.filter((b) => b.id !== selectedId)
    computeAccelerations(bodiesRef.current, paramsRef.current)
    initialRef.current = cloneBodies(bodiesRef.current)
    setSelectedId(null)
    setBodiesVersion((v) => v + 1)
  }

  const exportCSV = () => {
    downloadCSV(
      'orbital-diagnostics.csv',
      ['time_TU', 'kinetic_energy', 'potential_energy', 'total_energy', 'angular_momentum'],
      historyRef.current.map((h) => [h.t.toFixed(4), h.ke.toPrecision(8), h.pe.toPrecision(8), h.te.toPrecision(8), h.L.toPrecision(8)]),
    )
  }

  void bodiesVersion

  const visualization = (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0A0E1B]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="panel-title">System view — 2D projection</div>
        <StatusPill running={running} />
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Orbital system visualization. Click a body to select it, drag to reposition."
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 bg-emerald-400" /> velocity vector</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-current opacity-60" /> trajectory trail</span>
        <span className="flex items-center gap-1.5 text-amber-400">+ center of mass</span>
        <span className="ml-auto readout">t = {formatNumber(diag?.time ?? 0, 5)} TU</span>
      </div>
    </div>
  )

  const chart = (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-3">
        <SciChart
          title="Energy conservation check"
          xLabel="time (TU)"
          yLabel="energy (sim units)"
          xData={history.map((h) => h.t)}
          zeroLine
          series={[
            { label: 'Kinetic', color: '#38BDF8', data: history.map((h) => h.ke) },
            { label: 'Potential', color: '#F87171', data: history.map((h) => h.pe) },
            { label: 'Total', color: '#FBBF24', data: history.map((h) => h.te) },
          ]}
        />
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <SciChart
          title="Angular momentum conservation"
          xLabel="time (TU)"
          yLabel="L (sim units)"
          xData={history.map((h) => h.t)}
          series={[{ label: 'L_total', color: '#34D399', data: history.map((h) => h.L) }]}
        />
      </div>
    </div>
  )

  const controls = (
    <div>
      <ControlSection title="Experiment">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={running ? 'secondary' : 'default'} onClick={() => setRunning((r) => !r)} aria-label={running ? 'Pause' : 'Run'}>
            {running ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {running ? 'Pause' : 'Run'}
          </Button>
          <Button size="sm" variant="outline" onClick={stepOnce} aria-label="Single step">
            <StepForward className="mr-1.5 h-3.5 w-3.5" /> Step
          </Button>
          <Button size="sm" variant="outline" onClick={reset} aria-label="Reset to initial conditions">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ORBITAL_PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => loadPreset(i)}
              title={p.description}
              className="rounded-md border border-border bg-background/50 px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {p.name}
            </button>
          ))}
        </div>
      </ControlSection>

      <ControlSection title="Numerical settings">
        <ParamControl label="Steps per frame" value={speed} min={1} max={20} step={1} unit="steps" tooltip="Animation speed: how many integration steps run per rendered frame. Does not change model accuracy." onChange={(v) => setSpeed(Math.round(v))} />
        <ParamControl label="Time step dt" value={dt} min={0.05} max={1.5} step={0.05} unit="TU" tooltip="Integration step of the velocity-Verlet solver. Smaller dt = more accurate but slower. Watch the Total energy line: visible drift means dt is too large." onChange={setDt} />
        <ParamControl label="Gravitational G" value={gravity} min={0.1} max={4} step={0.1} unit="sim" tooltip="Gravitational parameter in simulation units. Changing G rescales all orbital speeds and periods." onChange={setGravity} />
        <ParamControl label="Softening ε" value={softening} min={0} max={10} step={0.5} unit="LU" tooltip="Prevents infinite acceleration at zero separation. ε > 0 slightly weakens gravity at very close range — a documented approximation." onChange={setSoftening} />
      </ControlSection>

      <ControlSection title="Display">
        {[
          ['Trajectory trails', showTrails, setShowTrails],
          ['Velocity vectors', showVectors, setShowVectors],
          ['Center of mass', showCOM, setShowCOM],
        ].map(([label, value, setter]) => (
          <label key={label as string} className="flex items-center justify-between text-xs text-muted-foreground">
            {label as string}
            <Switch checked={value as boolean} onCheckedChange={setter as (v: boolean) => void} aria-label={label as string} />
          </label>
        ))}
      </ControlSection>

      <ControlSection title={`Bodies (${bodiesRef.current.length})`}>
        <div className="space-y-1">
          {bodiesRef.current.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id === selectedId ? null : b.id)}
              className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                b.id === selectedId ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/30'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
              <span className="flex-1">{b.name}</span>
              <span className="readout text-[10px] text-muted-foreground">m={formatNumber(b.mass)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={addBody}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add orbiting body
          </Button>
          <Button size="sm" variant="outline" onClick={removeSelected} disabled={selectedId === null} aria-label="Remove selected body">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {selected && (
          <div className="space-y-3 rounded-md border border-border bg-background/50 p-3">
            <div className="text-[11px] font-medium" style={{ color: selected.color }}>Editing: {selected.name}</div>
            <ParamControl label="Mass" value={selected.mass} min={0.1} max={200} step={0.1} unit="MU" tooltip="Mass of the selected body in simulation mass units." onChange={(v) => updateSelected({ mass: v })} />
            <ParamControl label="Position x" value={selected.x} min={-400} max={400} step={1} unit="LU" onChange={(v) => updateSelected({ x: v })} />
            <ParamControl label="Position y" value={selected.y} min={-400} max={400} step={1} unit="LU" onChange={(v) => updateSelected({ y: v })} />
            <ParamControl label="Velocity vx" value={selected.vx} min={-3} max={3} step={0.01} unit="LU/TU" onChange={(v) => updateSelected({ vx: v })} precision={2} />
            <ParamControl label="Velocity vy" value={selected.vy} min={-3} max={3} step={0.01} unit="LU/TU" onChange={(v) => updateSelected({ vy: v })} precision={2} />
            <div className="space-y-1 border-t border-border/60 pt-2">
              <Readout label="|v|" value={formatNumber(Math.hypot(selected.vx, selected.vy))} unit="LU/TU" />
              <Readout label="|a|" value={formatNumber(Math.hypot(selected.ax, selected.ay))} unit="LU/TU²" />
            </div>
          </div>
        )}
      </ControlSection>

      <ControlSection title="Live diagnostics">
        <div className="space-y-1.5">
          <Readout label="Kinetic energy" value={formatNumber(diag?.kinetic ?? 0)} accent="#38BDF8" />
          <Readout label="Potential energy" value={formatSigned(diag?.potential ?? 0)} accent="#F87171" />
          <Readout label="Total energy" value={formatSigned(diag?.total ?? 0)} accent="#FBBF24" />
          <Readout label="Angular momentum" value={formatSigned(diag?.angularMomentum ?? 0)} accent="#34D399" />
          <Readout label="COM position" value={`(${formatNumber(diag?.comX ?? 0, 3)}, ${formatNumber(diag?.comY ?? 0, 3)})`} unit="LU" />
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          A symplectic integrator keeps total energy and angular momentum bounded. Visible secular drift in
          “Total energy” indicates the time step is too large — reduce dt.
        </p>
        <Button size="sm" variant="outline" className="w-full" onClick={exportCSV} disabled={history.length < 2}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export diagnostics (CSV)
        </Button>
      </ControlSection>
    </div>
  )

  return <WorkspaceShell visualization={visualization} chart={chart} controls={controls} />
}
