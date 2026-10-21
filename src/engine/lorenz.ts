/**
 * Lorenz (1963) chaotic system, integrated with classic RK4.
 *
 *   ẋ = σ(y − x)
 *   ẏ = x(ρ − z) − y
 *   ż = xy − βz
 */

export interface LorenzParams {
  sigma: number
  rho: number
  beta: number
  dt: number // integration step
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

export const LORENZ_CLASSIC: LorenzParams = { sigma: 10, rho: 28, beta: 8 / 3, dt: 0.008 }

/** Documented stability bounds for fixed-step RK4 on this system. */
export const DT_MIN = 0.001
export const DT_MAX = 0.02

export function deriv(s: Vec3, p: LorenzParams): Vec3 {
  return {
    x: p.sigma * (s.y - s.x),
    y: s.x * (p.rho - s.z) - s.y,
    z: s.x * s.y - p.beta * s.z,
  }
}

/** One classic RK4 step. Returns a new state object. */
export function rk4Step(s: Vec3, p: LorenzParams): Vec3 {
  const h = p.dt
  const k1 = deriv(s, p)
  const k2 = deriv({ x: s.x + (h / 2) * k1.x, y: s.y + (h / 2) * k1.y, z: s.z + (h / 2) * k1.z }, p)
  const k3 = deriv({ x: s.x + (h / 2) * k2.x, y: s.y + (h / 2) * k2.y, z: s.z + (h / 2) * k2.z }, p)
  const k4 = deriv({ x: s.x + h * k3.x, y: s.y + h * k3.y, z: s.z + h * k3.z }, p)
  return {
    x: s.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: s.y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: s.z + (h / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  }
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function isFiniteVec(s: Vec3): boolean {
  return Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.z)
}

export interface LorenzPreset {
  name: string
  description: string
  params: Omit<LorenzParams, 'dt'>
  note: string
}

export const LORENZ_PRESETS: LorenzPreset[] = [
  {
    name: 'Classic butterfly',
    description: 'σ = 10, ρ = 28, β = 8/3',
    params: { sigma: 10, rho: 28, beta: 8 / 3 },
    note: 'Lorenz\u2019s original 1963 chaotic regime.',
  },
  {
    name: 'Stable fixed point',
    description: 'σ = 10, ρ = 10, β = 8/3',
    params: { sigma: 10, rho: 10, beta: 8 / 3 },
    note: 'ρ < 13.9: trajectories spiral into a stable equilibrium.',
  },
  {
    name: 'High Rayleigh chaos',
    description: 'σ = 10, ρ = 45, β = 8/3',
    params: { sigma: 10, rho: 45, beta: 8 / 3 },
    note: 'Stronger forcing — faster lobe switching, larger attractor.',
  },
  {
    name: 'Periodic window',
    description: 'σ = 10, ρ = 99.65, β = 8/3',
    params: { sigma: 10, rho: 99.65, beta: 8 / 3 },
    note: 'Near ρ ≈ 99.65 the system passes through periodic windows.',
  },
]
