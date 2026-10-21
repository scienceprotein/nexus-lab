import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Plus, RotateCcw, Trash2, Waves } from 'lucide-react'
import { WAVE_SPEED, crossSection, fieldAt, makeSource, resetWaveIds, wavelengthOf, type WaveSource } from '@/engine/waves'
import { ParamControl } from '@/components/ParamControl'
import { SciChart } from '@/components/SciChart'
import { ControlSection, Readout, StatusPill, WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatNumber } from '@/lib/format'

const SOURCE_COLORS = ['#38BDF8', '#FBBF24', '#F472B6']
const MAX_SOURCES = 3
const WORLD = 220 // half-extent of the field in LU

function defaultSources(): WaveSource[] {
  resetWaveIds()
  return [makeSource({ x: -55, y: 0 }), makeSource({ x: 55, y: 0 })]
}

export function WavesWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offRef = useRef<HTMLCanvasElement | null>(null)
  const sourcesRef = useRef<WaveSource[]>(defaultSources())
  const timeRef = useRef(0)
  const runningRef = useRef(true)
  const dragRef = useRef<number | null>(null)
  const probeRef = useRef({ x: 0, y: -90 })
  const viewRef = useRef<string>('superposition')
  const sectionRowRef = useRef(-90)

  const [running, setRunning] = useState(true)
  const [sources, setSources] = useState<WaveSource[]>(sourcesRef.current)
  const [view, setView] = useState('superposition')
  const [probe, setProbe] = useState({ x: 0, y: -90 })
  const [sectionRow, setSectionRow] = useState(-90)
  const [probeValue, setProbeValue] = useState(0)
  const [time, setTime] = useState(0)
  const [sectionData, setSectionData] = useState<ReturnType<typeof crossSection> | null>(null)

  useEffect(() => {
    sourcesRef.current = sources
  }, [sources])
  useEffect(() => {
    runningRef.current = running
  }, [running])
  useEffect(() => {
    viewRef.current = view
  }, [view])
  useEffect(() => {
    probeRef.current = probe
  }, [probe])
  useEffect(() => {
    sectionRowRef.current = sectionRow
  }, [sectionRow])

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
      const h = Math.round(w * 0.6)
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (runningRef.current) timeRef.current += 1 / 30
      const t = timeRef.current
      const srcs = sourcesRef.current
      const mode = viewRef.current
      const viewSources =
        mode === 'superposition'
          ? srcs
          : srcs.map((s) => ({ ...s, enabled: s.enabled && String(s.id) === mode }))
      const maxAmp = Math.max(
        0.5,
        viewSources.filter((s) => s.enabled).reduce((sum, s) => sum + s.amplitude, 0),
      )

      // Low-res field render, upscaled smoothly
      const fw = Math.max(80, Math.round(w / 4))
      const fh = Math.max(48, Math.round(h / 4))
      if (!offRef.current) offRef.current = document.createElement('canvas')
      const off = offRef.current
      off.width = fw
      off.height = fh
      const octx = off.getContext('2d')
      if (octx) {
        const img = octx.createImageData(fw, fh)
        for (let py = 0; py < fh; py++) {
          const wy = ((py / (fh - 1)) * 2 - 1) * WORLD * (h / w)
          for (let px = 0; px < fw; px++) {
            const wx = ((px / (fw - 1)) * 2 - 1) * WORLD
            const v = fieldAt(viewSources, wx, wy, t) / maxAmp
            const i = (py * fw + px) * 4
            if (v >= 0) {
              img.data[i] = 11 + v * 45
              img.data[i + 1] = 16 + v * 120
              img.data[i + 2] = 32 + v * 220
            } else {
              img.data[i] = 11 - v * 120
              img.data[i + 1] = 16 - v * 60
              img.data[i + 2] = 32 - v * 10
            }
            img.data[i + 3] = 255
          }
        }
        octx.putImageData(img, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(off, 0, 0, w, h)
      }

      const toPx = (wx: number, wy: number) => ({
        px: ((wx / WORLD) * 0.5 + 0.5) * w,
        py: ((wy / (WORLD * (h / w))) * 0.5 + 0.5) * h,
      })

      // Cross-section row
      const rowY = sectionRowRef.current
      const { py: rowPy } = toPx(0, rowY)
      ctx.strokeStyle = '#FBBF2455'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, rowPy); ctx.lineTo(w, rowPy); ctx.stroke()
      ctx.setLineDash([])
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.fillStyle = '#FBBF24'
      ctx.textAlign = 'left'
      ctx.fillText('cross-section', 8, rowPy - 5)

      // Sources
      srcs.forEach((s, i) => {
        const { px, py } = toPx(s.x, s.y)
        const color = SOURCE_COLORS[i % SOURCE_COLORS.length]
        ctx.globalAlpha = s.enabled ? 1 : 0.3
        ctx.fillStyle = color
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#F3F6FC'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#A8B3C7'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`S${i + 1}`, px, py - 14)
      })

      // Probe
      const prb = probeRef.current
      const { px: probePx, py: probePy } = toPx(prb.x, prb.y)
      ctx.strokeStyle = '#34D399'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(probePx - 7, probePy); ctx.lineTo(probePx + 7, probePy)
      ctx.moveTo(probePx, probePy - 7); ctx.lineTo(probePx, probePy + 7)
      ctx.stroke()
      ctx.fillStyle = '#34D399'
      ctx.fillText('probe', probePx + 9, probePy - 4)

      // Throttled React updates
      frame++
      if (frame % 10 === 0) {
        setTime(t)
        setProbeValue(fieldAt(viewSources, prb.x, prb.y, t))
        setSectionData(crossSection(viewSources, rowY, -WORLD, WORLD, 240, t))
      }
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [])

  const canvasPoint = (e: React.PointerEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    return {
      x: (((e.clientX - rect.left) / w) * 2 - 1) * WORLD,
      y: (((e.clientY - rect.top) / h) * 2 - 1) * WORLD * (h / w),
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const p = canvasPoint(e)
    if (!p) return
    let best: WaveSource | null = null
    let bestD = 25
    for (const s of sourcesRef.current) {
      const dd = Math.hypot(s.x - p.x, s.y - p.y)
      if (dd < bestD) {
        best = s
        bestD = dd
      }
    }
    if (best) {
      dragRef.current = best.id
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } else {
      setProbe(p)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return
    const p = canvasPoint(e)
    if (!p) return
    setSources((prev) => prev.map((s) => (s.id === dragRef.current ? { ...s, x: p.x, y: p.y } : s)))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const updateSource = (id: number, patch: Partial<WaveSource>) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const reset = () => {
    sourcesRef.current = defaultSources()
    setSources(sourcesRef.current)
    timeRef.current = 0
    setTime(0)
    setView('superposition')
  }

  const visualization = (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0A0E1B]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="panel-title">Interference field — amplitude y(x, y, t)</div>
        <StatusPill running={running} />
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Wave interference field. Drag sources to move them. Click elsewhere to place the measurement probe."
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/60 px-4 py-2 text-[10px] text-muted-foreground">
        <span><span className="text-sky-300">bright</span> = positive displacement, <span className="text-red-400">red</span> = negative</span>
        <span className="flex items-center gap-1.5 text-emerald-400">+ probe</span>
        <span className="ml-auto readout">t = {formatNumber(time, 4)} TU · v = {WAVE_SPEED} LU/TU</span>
      </div>
    </div>
  )

  const chart = (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-3">
        <SciChart
          title={`Waveform along cross-section y = ${formatNumber(sectionRow, 3)} LU`}
          xLabel="x (LU)"
          yLabel="displacement y (arb.)"
          xData={sectionData?.xs ?? []}
          zeroLine
          series={[
            { label: 'Superposition', color: '#38BDF8', data: sectionData?.total ?? [] },
            ...(sectionData?.individual ?? []).map((d, i) => ({
              label: `S${i + 1}`,
              color: SOURCE_COLORS[(i + 1) % SOURCE_COLORS.length],
              data: d,
              dashed: true,
            })),
          ]}
        />
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="panel-title mb-3">Probe readout</div>
        <div className="space-y-2">
          <Readout label="Probe position" value={`(${formatNumber(probe.x, 3)}, ${formatNumber(probe.y, 3)})`} unit="LU" />
          <Readout label="Displacement y(probe)" value={formatNumber(probeValue, 5)} unit="arb." accent="#34D399" />
          <Readout
            label="Source separation"
            value={
              sources.length >= 2
                ? formatNumber(Math.hypot(sources[0].x - sources[1].x, sources[0].y - sources[1].y))
                : '—'
            }
            unit="LU"
          />
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Fringe spacing follows directly from the model: constructive interference occurs where the path
          difference Δr = nλ, destructive where Δr = (n + ½)λ. Move a source or change frequency to test it.
        </p>
        <ParamControl
          label="Cross-section row y"
          value={sectionRow}
          min={-140}
          max={140}
          step={1}
          unit="LU"
          tooltip="Horizontal line along which the waveform graph below is sampled."
          onChange={setSectionRow}
        />
      </div>
    </div>
  )

  const controls = (
    <div>
      <ControlSection title="Experiment">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={running ? 'secondary' : 'default'} onClick={() => setRunning((r) => !r)}>
            {running ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {running ? 'Pause' : 'Run'}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">Display mode</div>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger aria-label="Display mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="superposition">Superposition (Σ)</SelectItem>
              {sources.map((s, i) => (
                <SelectItem key={s.id} value={String(s.id)}>Source S{i + 1} only</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ControlSection>

      <ControlSection title={`Sources (${sources.length}/${MAX_SOURCES})`}>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={sources.length >= MAX_SOURCES}
          onClick={() =>
            setSources((prev) => [
              ...prev,
              makeSource({ x: (prev.length - 1) * 60 - 30, y: 70, frequency: 0.6 }),
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add source
        </Button>
        {sources.map((s, i) => (
          <div key={s.id} className="space-y-3 rounded-md border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                Source S{i + 1}
              </span>
              <div className="flex items-center gap-2">
                <Switch checked={s.enabled} onCheckedChange={(v) => updateSource(s.id, { enabled: v })} aria-label={`Enable source ${i + 1}`} />
                {sources.length > 1 && (
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setSources((prev) => prev.filter((x) => x.id !== s.id))}
                    aria-label={`Remove source ${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <ParamControl label="Amplitude A" value={s.amplitude} min={0} max={2} step={0.05} unit="arb." tooltip="Peak displacement produced by this source." onChange={(v) => updateSource(s.id, { amplitude: v })} />
            <ParamControl label="Frequency f" value={s.frequency} min={0.2} max={1.5} step={0.02} unit="cyc/TU" tooltip={`Wave speed is fixed at ${WAVE_SPEED} LU/TU, so wavelength λ = v/f adjusts automatically (currently ${formatNumber(wavelengthOf(s))} LU).`} onChange={(v) => updateSource(s.id, { frequency: v })} precision={2} />
            <ParamControl label="Phase φ" value={s.phase} min={-Math.PI} max={Math.PI} step={0.05} unit="rad" tooltip="Constant phase offset. A phase difference of π between identical sources flips constructive and destructive regions." onChange={(v) => updateSource(s.id, { phase: v })} precision={2} />
            <Readout label="Wavelength λ = v/f" value={formatNumber(wavelengthOf(s))} unit="LU" />
          </div>
        ))}
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground/70">
          <Waves className="mt-0.5 h-3 w-3 shrink-0" />
          Drag sources directly on the field. Click anywhere else to place the measurement probe.
        </p>
      </ControlSection>
    </div>
  )

  return <WorkspaceShell visualization={visualization} chart={chart} controls={controls} />
}
