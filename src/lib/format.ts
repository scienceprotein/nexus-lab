/** Numeric formatting helpers for scientific readouts. */

export function formatNumber(v: number, sigFigs = 4): string {
  if (!Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e5 || abs < 1e-3) {
    return v.toExponential(sigFigs - 1).replace('e+', 'e')
  }
  return Number(v.toPrecision(sigFigs)).toString()
}

export function formatSigned(v: number, sigFigs = 4): string {
  const s = formatNumber(Math.abs(v), sigFigs)
  return v < 0 ? `\u2212${s}` : s
}

/** Nice tick step (1/2/5 × 10^n) covering `range` with ~`target` ticks. */
export function niceStep(range: number, target = 5): number {
  if (range <= 0 || !Number.isFinite(range)) return 1
  const raw = range / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1
  return step * mag
}

export function niceTicks(min: number, max: number, target = 5): number[] {
  const step = niceStep(max - min, target)
  const lo = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= max + 1e-12; v += step) {
    ticks.push(Number(v.toPrecision(12)))
  }
  return ticks
}

export function downloadCSV(filename: string, header: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
