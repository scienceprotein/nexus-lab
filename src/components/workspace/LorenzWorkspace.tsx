import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Pause, Play, RotateCcw } from 'lucide-react'
import {
  DT_MAX,
  DT_MIN,
  LORENZ_CLASSIC,
  LORENZ_PRESETS,
  distance,
  isFiniteVec,
  rk4Step,
  type LorenzParams,
  type Vec3,
} from '@/engine/lorenz'
import { ParamControl } from '@/components/ParamControl'
import { SciChart } from '@/components/SciChart'
import { ControlSection, Readout, StatusPill, WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatNumber } from '@/lib/format'

const TRAIL_MAX = 4000
const TWIN_OFFSET = 1e-5

interface TrailPoint extends Vec3 {}

export function LorenzWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef<LorenzParams>({ ...LORENZ_CLASSIC })
  const stateRef = useRef<Vec3>({ x: 0.1, y: 0, z: 20 })
  const twinRef = useRef<Vec3>({ x: 0.1 + TWIN_OFFSET, y: 0, z: 20 })
  const trailRef = useRef<TrailPoint[]>([])
  const twinTrailRef = useRef<TrailPoint[]>([])
  const timeRef = useRef(0)
  const runningRef = useRef(true)
  const twinEnabledRef = useRef(true)
  const viewRef = useRef({ yaw: 0.6, pitch: 0.35, zoom: 1 })
  const histRef = useRef<{ t: number; x1: number; x2: number; sep: number }[]>([])
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const blewUpRef = useRef(false)

  const [running, setRunning] = useState(true)
  const [sigma, setSigma] = useState(LORENZ_CLASSIC.sigma)
  const [rho, setRho] = useState(LORENZ_CLASSIC.rho)
  const [beta, setBeta] = useState(LORENZ_CLASSIC.beta)
  const [dt, setDt] = useState(LORENZ_CLASSIC.dt)
  const [speed, setSpeed] = useState(8)
  const [twinEnabled, setTwinEnabled] = useState(true)
  const [ic, setIc] = useState<Vec3>({ x: 0.1, y: 0, z: 20 })
  const [state, setState] = useState<Vec3>(stateRef.current)
  const [separation, setSeparation] = useState(TWIN_OFFSET)
  const [history, setHistory] = useState<{ t: number; x1: number; x2: number; sep: number }[]>([])
  const [diverged, setDiverged] = useState(false)

  useEffect(() => {
    paramsRef.current = { sigma, rho, beta, dt }
  }, [sigma, rho, beta, dt])
  useEffect(() => {
    runningRef.current = running
  }, [running])
  useEffect(() => {
    twinEnabledRef.current = twinEnabled
  }, [twinEnabled])

  const reset = useCallback((initial: Vec3) => {
    stateRef.current = { ...initial }
    twinRef.current = { x: initial.x + TWIN_OFFSET, y: initial.y, z: initial.z }
    trailRef.current = []
    twinTrailRef.current = []
    histRef.current = []
    timeRef.current = 0
    blewUpRef.current = false
    setDiverged(false)
    setHistory([])
    setState({ ...initial })
    setSeparation(TWIN_OFFSET)
  }, [])

  // Initial
  useEffect(() => {
    reset(ic)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyPreset = (i: number) => {
    const p = LORENZ_PRESETS[i]
    setSigma(p.params.sigma)
    setRho(p.params.rho)
    setBeta(p.params.beta)
    reset(ic)
  }

  // Render loop
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
      const h = Math.round(Math.min(w * 0.72, 560))
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Advance
      if (runningRef.current && !blewUpRef.current) {
        for (let i = 0; i < speed; i++) {
          stateRef.current = rk4Step(stateRef.current, paramsRef.current)
          if (twinEnabledRef.current) twinRef.current = rk4Step(twinRef.current, paramsRef.current)
          timeRef.current += paramsRef.current.dt
          trailRef.current.push({ ...stateRef.current })
          if (twinEnabledRef.current) twinTrailRef.current.push({ ...twinRef.current })
        }
        if (trailRef.current.length > TRAIL_MAX) trailRef.current.splice(0, trailRef.current.length - TRAIL_MAX)
        if (twinTrailRef.current.length > TRAIL_MAX) twinTrailRef.current.splice(0, twinTrailRef.current.length - TRAIL_MAX)
        if (!isFiniteVec(stateRef.current) || Math.abs(stateRef.current.x) > 1e6) {
          blewUpRef.current = true
          setDiverged(true)
          setRunning(false)
        }
        const sep = twinEnabledRef.current ? distance(stateRef.current, twinRef.current) : 0
        histRef.current.push({ t: timeRef.current, x1: stateRef.current.x, x2: twinRef.current.x, sep })
        if (histRef.current.length > 800) histRef.current.splice(0, histRef.current.length - 800)
      }

      // 3D projection
      const { yaw, pitch, zoom } = viewRef.current
      const cy_ = Math.cos(yaw)
      const sy_ = Math.sin(yaw)
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)
      const scale = (Math.min(w, h) / 65) * zoom
      const cx = w / 2
      const cyy = h / 2
      const project = (v: Vec3) => {
        // center the attractor roughly at z=25
        const x0 = v.x
        const y0 = v.y
        const z0 = v.z - 25
        const x1 = x0 * cy_ - y0 * sy_
        const y1 = x0 * sy_ + y0 * cy_
        const y2 = y1 * cp - z0 * sp
        const z2 = y1 * sp + z0 * cp
        const persp = 300 / (300 + z2 * scale * 0.5)
        return { px: cx + x1 * scale * persp, py: cyy - y2 * scale * persp }
      }

      // Trails with depth fade
      const drawTrail = (trail: TrailPoint[], color: string) => {
        if (trail.length < 2) return
        const stride = Math.max(1, Math.floor(trail.length / 1200))
        ctx.lineWidth = 1.1
        let prev = project(trail[0])
        const n = trail.length
        for (let i = stride; i < n; i += stride) {
          const cur = project(trail[i])
          const age = i / n
          ctx.strokeStyle = color + Math.round(20 + age * 180).toString(16).padStart(2, '0')
          ctx.beginPath()
          ctx.moveTo(prev.px, prev.py)
          ctx.lineTo(cur.px, cur.py)
          ctx.stroke()
          prev = cur
        }
      }
      drawTrail(trailRef.current, '#818CF8')
      if (twinEnabledRef.current) drawTrail(twinTrailRef.current, '#F87171')

      // Current points
      const head = project(stateRef.current)
      ctx.fillStyle = '#C7D2FE'
      ctx.beginPath(); ctx.arc(head.px, head.py, 3.5, 0, Math.PI * 2); ctx.fill()
      if (twinEnabledRef.current) {
        const thead = project(twinRef.current)
        ctx.fillStyle = '#FCA5A5'
        ctx.beginPath(); ctx.arc(thead.px, thead.py, 3.5, 0, Math.PI * 2); ctx.fill()
        // separation line when visible
        const dd = Math.hypot(head.px - thead.px, head.py - thead.py)
        if (dd > 8) {
          ctx.strokeStyle = '#FBBF24'
          ctx.setLineDash([3, 3])
          ctx.beginPath(); ctx.moveTo(head.px, head.py); ctx.lineTo(thead.px, thead.py); ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Axes legend
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillStyle = '#A8B3C7'
      ctx.textAlign = 'left'
      ctx.fillText(`yaw ${viewRef.current.yaw.toFixed(2)} · pitch ${viewRef.current.pitch.toFixed(2)} · zoom ${viewRef.current.zoom.toFixed(2)}`, 12, h - 12)

      frame++
      if (frame % 10 === 0) {
        setState({ ...stateRef.current })
        setSeparation(twinEnabledRef.current ? distance(stateRef.current, twinRef.current) : 0)
        setHistory([...histRef.current])
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [speed])

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    viewRef.current.yaw += dx * 0.008
    viewRef.current.pitch = Math.min(1.4, Math.max(-1.4, viewRef.current.pitch + dy * 0.008))
  }
  const onPointerUp = () => {
    dragRef.current = null
  }
  const onWheel = (e: React.WheelEvent) => {
    viewRef.current.zoom = Math.min(4, Math.max(0.3, viewRef.current.zoom * (e.deltaY > 0 ? 0.92 : 1.08)))
  }

  const visualization = (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0A0E1B]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="panel-title">Phase space — 3D trajectory (drag to rotate, scroll to zoom)</div>
        <StatusPill running={running} label={diverged ? 'Integration diverged' : undefined} />
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          aria-label="Lorenz attractor 3D trajectory. Drag to rotate the view."
        />
        {diverged && (
          <div className="absolute inset-x-4 top-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive" role="alert">
            Integration diverged — the state left the numerically stable region. This is a numerical
            instability, not physics. Reduce the time step dt or move parameters back toward documented
            ranges, then reset.
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-indigo-300" /> trajectory A</span>
        {twinEnabled && (
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-300" /> twin B (offset 1e-5)</span>
        )}
        <span className="ml-auto readout">t = {formatNumber(timeRef.current, 5)}</span>
      </div>
    </div>
  )

  const chart = (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-3">
        <SciChart
          title="State variable x(t) — twin trajectories"
          xLabel="time (dimensionless)"
          yLabel="x"
          xData={history.map((h) => h.t)}
          zeroLine
          series={[
            { label: 'A', color: '#818CF8', data: history.map((h) => h.x1) },
            ...(twinEnabled ? [{ label: 'B (twin)', color: '#F87171', data: history.map((h) => h.x2) }] : []),
          ]}
        />
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <SciChart
          title="Twin separation |B − A| (log view in readout)"
          xLabel="time (dimensionless)"
          yLabel="separation"
          xData={history.map((h) => h.t)}
          series={[{ label: 'separation', color: '#FBBF24', data: history.map((h) => h.sep) }]}
          emptyHint="Enable the twin trajectory to measure divergence"
        />
      </div>
    </div>
  )

  const controls = (
    <div>
      <ControlSection title="Experiment">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={running ? 'secondary' : 'default'} onClick={() => setRunning((r) => !r)} disabled={diverged}>
            {running ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {running ? 'Pause' : 'Run'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { reset(ic); setDiverged(false) }}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LORENZ_PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => applyPreset(i)}
              title={`${p.description} — ${p.note}`}
              className="rounded-md border border-border bg-background/50 px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {p.name}
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Copy className="h-3 w-3" /> Twin trajectory (Δ = 1e-5)</span>
          <Switch checked={twinEnabled} onCheckedChange={setTwinEnabled} aria-label="Enable twin trajectory" />
        </label>
      </ControlSection>

      <ControlSection title="Model parameters">
        <ParamControl label="σ (Prandtl)" value={sigma} min={1} max={30} step={0.1} unit="" tooltip="Prandtl number: ratio of viscous to thermal diffusion in the original convection model." onChange={setSigma} precision={1} />
        <ParamControl label="ρ (Rayleigh)" value={rho} min={1} max={120} step={0.5} unit="" tooltip="Normalized Rayleigh number. ρ < 1: origin stable. ρ ≈ 24.7: convection fixed points lose stability. ρ = 28: classic chaos." onChange={setRho} precision={1} />
        <ParamControl label="β (geometry)" value={beta} min={0.5} max={6} step={0.01} unit="" tooltip="Geometric factor from the convection cell aspect ratio. Classic value 8/3 ≈ 2.667." onChange={setBeta} precision={2} />
      </ControlSection>

      <ControlSection title="Initial conditions">
        <ParamControl label="x₀" value={ic.x} min={-20} max={20} step={0.1} onChange={(v) => setIc((s) => ({ ...s, x: v }))} precision={1} />
        <ParamControl label="y₀" value={ic.y} min={-20} max={20} step={0.1} onChange={(v) => setIc((s) => ({ ...s, y: v }))} precision={1} />
        <ParamControl label="z₀" value={ic.z} min={0} max={60} step={0.5} onChange={(v) => setIc((s) => ({ ...s, z: v }))} precision={1} />
        <p className="text-[10px] text-muted-foreground/70">Applies on Reset. Twin B starts at x₀ + 1e-5.</p>
      </ControlSection>

      <ControlSection title="Numerical settings">
        <ParamControl label="Steps per frame" value={speed} min={1} max={40} step={1} unit="steps" tooltip="Animation speed only — does not affect model accuracy." onChange={(v) => setSpeed(Math.round(v))} />
        <ParamControl label="Time step h" value={dt} min={DT_MIN} max={DT_MAX} step={0.001} unit="" tooltip={`RK4 fixed step, documented stable range ${DT_MIN}–${DT_MAX}. Larger steps visibly distort the attractor; very large steps diverge (the workspace will say so).`} onChange={setDt} precision={3} />
      </ControlSection>

      <ControlSection title="Live state">
        <div className="space-y-1.5">
          <Readout label="x" value={formatNumber(state.x, 5)} accent="#818CF8" />
          <Readout label="y" value={formatNumber(state.y, 5)} accent="#818CF8" />
          <Readout label="z" value={formatNumber(state.z, 5)} accent="#818CF8" />
          {twinEnabled && (
            <>
              <Readout label="|B − A|" value={formatNumber(separation, 4)} accent="#FBBF24" />
              <Readout label="log₁₀ separation" value={separation > 0 ? formatNumber(Math.log10(separation), 4) : '—'} />
            </>
          )}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          The twin starts 1e-5 away. On the chaotic attractor the separation grows roughly exponentially
          (largest Lyapunov exponent λ ≈ 0.9) until it saturates at the attractor size — sensitive
          dependence made visible.
        </p>
      </ControlSection>
    </div>
  )

  return <WorkspaceShell visualization={visualization} chart={chart} controls={controls} />
}
