import { useEffect, useRef, useState, useCallback } from 'react'
import { niceTicks, formatNumber } from '@/lib/format'

export interface ChartSeries {
  label: string
  color: string
  /** y values sampled at the shared x grid */
  data: number[]
  dashed?: boolean
}

interface SciChartProps {
  title: string
  xLabel: string
  yLabel: string
  /** Shared x grid; if omitted, sample indices are used */
  xData?: number[]
  series: ChartSeries[]
  height?: number
  /** Show horizontal zero line */
  zeroLine?: boolean
  /** Optional fixed y-range */
  yRange?: [number, number]
  emptyHint?: string
}

const PAD = { top: 14, right: 16, bottom: 34, left: 56 }
const AXIS = '#3A4763'
const GRID = '#232E47'
const TEXT = '#A8B3C7'

/**
 * Precise canvas line chart for live simulation output: labeled axes with
 * units, nice ticks, legend, hover inspection. No decorative data.
 */
export function SciChart({
  title,
  xLabel,
  yLabel,
  xData,
  series,
  height = 180,
  zeroLine = false,
  yRange,
  emptyHint = 'Run the simulation to populate this chart',
}: SciChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ px: number; py: number } | null>(null)
  const [size, setSize] = useState({ w: 0, h: height })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w < 40) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size.w, size.h)

    const w = size.w - PAD.left - PAD.right
    const h = size.h - PAD.top - PAD.bottom
    const valid = series.filter((s) => s.data.length > 0)
    const n = Math.max(0, ...series.map((s) => s.data.length))

    // Axes
    ctx.strokeStyle = AXIS
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD.left, PAD.top)
    ctx.lineTo(PAD.left, PAD.top + h)
    ctx.lineTo(PAD.left + w, PAD.top + h)
    ctx.stroke()

    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillStyle = TEXT

    if (n < 2 || valid.length === 0) {
      ctx.textAlign = 'center'
      ctx.font = '11px Inter, sans-serif'
      ctx.fillText(emptyHint, PAD.left + w / 2, PAD.top + h / 2)
      return
    }

    const xs = xData && xData.length >= n ? xData.slice(0, n) : Array.from({ length: n }, (_, i) => i)
    const xMin = xs[0]
    const xMax = xs[n - 1]

    let yMin = Infinity
    let yMax = -Infinity
    for (const s of valid) {
      for (let i = 0; i < n; i++) {
        const v = s.data[i]
        if (!Number.isFinite(v)) continue
        if (v < yMin) yMin = v
        if (v > yMax) yMax = v
      }
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) return
    if (yRange) {
      yMin = yRange[0]
      yMax = yRange[1]
    } else if (yMin === yMax) {
      yMin -= 1
      yMax += 1
    } else {
      const pad = (yMax - yMin) * 0.08
      yMin -= pad
      yMax += pad
    }

    const X = (v: number) => PAD.left + ((v - xMin) / (xMax - xMin || 1)) * w
    const Y = (v: number) => PAD.top + h - ((v - yMin) / (yMax - yMin || 1)) * h

    // Grid + tick labels
    const yTicks = niceTicks(yMin, yMax, 4)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (const t of yTicks) {
      const py = Y(t)
      ctx.strokeStyle = GRID
      ctx.beginPath()
      ctx.moveTo(PAD.left, py)
      ctx.lineTo(PAD.left + w, py)
      ctx.stroke()
      ctx.fillStyle = TEXT
      ctx.fillText(formatNumber(t, 3), PAD.left - 8, py)
    }
    const xTicks = niceTicks(xMin, xMax, 6)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const t of xTicks) {
      const px = X(t)
      ctx.strokeStyle = GRID
      ctx.beginPath()
      ctx.moveTo(px, PAD.top)
      ctx.lineTo(px, PAD.top + h)
      ctx.stroke()
      ctx.fillStyle = TEXT
      ctx.fillText(formatNumber(t, 4), px, PAD.top + h + 6)
    }

    if (zeroLine && yMin < 0 && yMax > 0) {
      ctx.strokeStyle = AXIS
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD.left, Y(0))
      ctx.lineTo(PAD.left + w, Y(0))
      ctx.stroke()
    }

    // Series
    for (const s of valid) {
      ctx.strokeStyle = s.color
      ctx.lineWidth = 1.5
      ctx.setLineDash(s.dashed ? [5, 4] : [])
      ctx.beginPath()
      let started = false
      for (let i = 0; i < n; i++) {
        const v = s.data[i]
        if (!Number.isFinite(v)) {
          started = false
          continue
        }
        const px = X(xs[i])
        const py = Y(v)
        if (!started) {
          ctx.moveTo(px, py)
          started = true
        } else {
          ctx.lineTo(px, py)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Axis captions
    ctx.fillStyle = TEXT
    ctx.font = '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(xLabel, PAD.left + w / 2, size.h - 6)
    ctx.save()
    ctx.translate(12, PAD.top + h / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(yLabel, 0, 0)
    ctx.restore()

    // Legend
    let lx = PAD.left + 10
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = '10px Inter, sans-serif'
    for (const s of valid) {
      ctx.strokeStyle = s.color
      ctx.lineWidth = 2
      ctx.setLineDash(s.dashed ? [4, 3] : [])
      ctx.beginPath()
      ctx.moveTo(lx, PAD.top + 6)
      ctx.lineTo(lx + 14, PAD.top + 6)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = TEXT
      ctx.fillText(s.label, lx + 19, PAD.top + 6)
      lx += 19 + ctx.measureText(s.label).width + 14
    }

    // Hover inspection
    if (hover) {
      const fx = (hover.px - PAD.left) / w
      if (fx >= 0 && fx <= 1) {
        const idx = Math.round(fx * (n - 1))
        const px = X(xs[idx])
        ctx.strokeStyle = '#5B6B8C'
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(px, PAD.top)
        ctx.lineTo(px, PAD.top + h)
        ctx.stroke()
        ctx.setLineDash([])
        const lines = [`t = ${formatNumber(xs[idx], 5)}`]
        for (const s of valid) lines.push(`${s.label} = ${formatNumber(s.data[idx], 5)}`)
        ctx.font = '10px "JetBrains Mono", monospace'
        const tw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16
        const th = lines.length * 15 + 10
        let bx = px + 10
        if (bx + tw > size.w - 4) bx = px - tw - 10
        const by = PAD.top + 8
        ctx.fillStyle = 'rgba(17, 24, 39, 0.92)'
        ctx.strokeStyle = AXIS
        ctx.fillRect(bx, by, tw, th)
        ctx.strokeRect(bx, by, tw, th)
        ctx.fillStyle = '#F3F6FC'
        ctx.textAlign = 'left'
        lines.forEach((l, i) => ctx.fillText(l, bx + 8, by + 14 + i * 15))
      }
    }
  }, [size, series, xData, xLabel, yLabel, hover, zeroLine, yRange, emptyHint])

  useEffect(() => {
    draw()
  }, [draw])

  const onMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ px: e.clientX - rect.left, py: e.clientY - rect.top })
  }

  return (
    <div ref={wrapRef} className="w-full" role="img" aria-label={`${title}. X axis: ${xLabel}. Y axis: ${yLabel}.`}>
      <div className="panel-title mb-1 px-1">{title}</div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: size.h }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
    </div>
  )
}
