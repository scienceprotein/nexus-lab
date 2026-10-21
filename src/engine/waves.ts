/**
 * Wave Interference engine — coherent point sources in a 2D linear medium.
 *
 * y_i(r, t) = A_i cos(k·|r − r_i| − ωt + φ_i),  total = Σ y_i
 * Wave speed v = f·λ is fixed so frequency and wavelength stay consistent.
 */

export interface WaveSource {
  id: number
  x: number // LU
  y: number
  amplitude: number
  frequency: number // cycles / TU
  phase: number // radians
  enabled: boolean
}

export const WAVE_SPEED = 12 // LU / TU (fixed)

let waveId = 1

export function makeSource(partial: Partial<WaveSource> & { x: number; y: number }): WaveSource {
  return {
    id: waveId++,
    amplitude: 1,
    frequency: 0.6,
    phase: 0,
    enabled: true,
    ...partial,
  }
}

export function wavelengthOf(s: WaveSource): number {
  return WAVE_SPEED / s.frequency
}

/** Superposed field value at (x, y, t). */
export function fieldAt(sources: WaveSource[], x: number, y: number, t: number): number {
  let sum = 0
  for (const s of sources) {
    if (!s.enabled) continue
    const dx = x - s.x
    const dy = y - s.y
    const r = Math.sqrt(dx * dx + dy * dy)
    const k = (2 * Math.PI * s.frequency) / WAVE_SPEED
    const omega = 2 * Math.PI * s.frequency
    sum += s.amplitude * Math.cos(k * r - omega * t + s.phase)
  }
  return sum
}

export interface CrossSectionData {
  xs: number[]
  total: number[]
  individual: number[][]
}

/** Sample a horizontal cross-section row of the field. */
export function crossSection(
  sources: WaveSource[],
  yRow: number,
  x0: number,
  x1: number,
  samples: number,
  t: number,
): CrossSectionData {
  const xs: number[] = []
  const total: number[] = []
  const individual: number[][] = sources.map(() => [])
  for (let i = 0; i < samples; i++) {
    const x = x0 + ((x1 - x0) * i) / (samples - 1)
    xs.push(x)
    let sum = 0
    sources.forEach((s, si) => {
      const dx = x - s.x
      const dy = yRow - s.y
      const r = Math.sqrt(dx * dx + dy * dy)
      const k = (2 * Math.PI * s.frequency) / WAVE_SPEED
      const omega = 2 * Math.PI * s.frequency
      const v = s.enabled ? s.amplitude * Math.cos(k * r - omega * t + s.phase) : 0
      individual[si].push(v)
      sum += v
    })
    total.push(sum)
  }
  return { xs, total, individual }
}

export function resetWaveIds(): void {
  waveId = 1
}
