/**
 * Orbital Mechanics engine — Newtonian N-body in 2D.
 *
 * Integrator: velocity Verlet (kick–drift–kick), 2nd-order symplectic.
 * Units: G = 1, simulation units (see registry documentation).
 * A softening length ε regularizes near-zero separations.
 */

export interface Body {
  id: number
  name: string
  mass: number // MU
  x: number // LU
  y: number
  vx: number // LU/TU
  vy: number
  ax: number
  ay: number
  color: string
  trail: { x: number; y: number }[]
}

export interface OrbitalParams {
  G: number
  dt: number // integration step (TU)
  softening: number
  trailLength: number
}

export interface OrbitalDiagnostics {
  time: number
  kinetic: number
  potential: number
  total: number
  angularMomentum: number
  comX: number
  comY: number
}

export const BODY_COLORS = ['#38BDF8', '#FBBF24', '#F87171', '#34D399', '#818CF8', '#F472B6']

let nextId = 1

export function makeBody(
  partial: Partial<Omit<Body, 'id' | 'ax' | 'ay' | 'trail'>> & { x: number; y: number },
): Body {
  return {
    id: nextId++,
    name: partial.name ?? `Body ${nextId - 1}`,
    mass: partial.mass ?? 1,
    x: partial.x,
    y: partial.y,
    vx: partial.vx ?? 0,
    vy: partial.vy ?? 0,
    ax: 0,
    ay: 0,
    color: partial.color ?? BODY_COLORS[(nextId - 2) % BODY_COLORS.length],
    trail: [],
  }
}

export function computeAccelerations(bodies: Body[], p: OrbitalParams): void {
  for (const b of bodies) {
    b.ax = 0
    b.ay = 0
  }
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const bi = bodies[i]
      const bj = bodies[j]
      const dx = bj.x - bi.x
      const dy = bj.y - bi.y
      const r2 = dx * dx + dy * dy + p.softening * p.softening
      const inv = 1 / (Math.sqrt(r2) * r2) // 1 / (r^2 + ε^2)^{3/2}
      const f = p.G * inv
      bi.ax += f * bj.mass * dx
      bi.ay += f * bj.mass * dy
      bj.ax -= f * bi.mass * dx
      bj.ay -= f * bi.mass * dy
    }
  }
}

/** One velocity-Verlet step. Assumes accelerations are current on entry. */
export function step(bodies: Body[], p: OrbitalParams): void {
  const h = p.dt
  for (const b of bodies) {
    // drift + half-kick form of velocity Verlet
    b.vx += 0.5 * h * b.ax
    b.vy += 0.5 * h * b.ay
    b.x += h * b.vx
    b.y += h * b.vy
  }
  computeAccelerations(bodies, p)
  for (const b of bodies) {
    b.vx += 0.5 * h * b.ax
    b.vy += 0.5 * h * b.ay
    b.trail.push({ x: b.x, y: b.y })
    if (b.trail.length > p.trailLength) b.trail.splice(0, b.trail.length - p.trailLength)
  }
}

export function diagnostics(bodies: Body[], p: OrbitalParams, time: number): OrbitalDiagnostics {
  let kinetic = 0
  let potential = 0
  let L = 0
  let M = 0
  let comX = 0
  let comY = 0
  for (const b of bodies) {
    kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy)
    L += b.mass * (b.x * b.vy - b.y * b.vx)
    M += b.mass
    comX += b.mass * b.x
    comY += b.mass * b.y
  }
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x
      const dy = bodies[j].y - bodies[i].y
      const r = Math.sqrt(dx * dx + dy * dy + p.softening * p.softening)
      potential -= (p.G * bodies[i].mass * bodies[j].mass) / r
    }
  }
  if (M > 0) {
    comX /= M
    comY /= M
  }
  return { time, kinetic, potential, total: kinetic + potential, angularMomentum: L, comX, comY }
}

export interface Preset {
  name: string
  description: string
  build: () => Body[]
}

export const ORBITAL_PRESETS: Preset[] = [
  {
    name: 'Circular orbit',
    description: 'A planet on a circular orbit around a heavy star (v = √(GM/r)).',
    build: () => {
      const star = makeBody({ name: 'Star', mass: 100, x: 0, y: 0, vx: 0, vy: 0, color: '#FBBF24' })
      const r = 120
      const v = Math.sqrt((1 * star.mass) / r)
      const planet = makeBody({ name: 'Planet', mass: 1, x: r, y: 0, vx: 0, vy: v, color: '#38BDF8' })
      return [star, planet]
    },
  },
  {
    name: 'Elliptical orbit',
    description: 'Sub-circular velocity produces a Kepler ellipse with the star at a focus.',
    build: () => {
      const star = makeBody({ name: 'Star', mass: 100, x: 0, y: 0, vx: 0, vy: 0, color: '#FBBF24' })
      const r = 120
      const v = 0.72 * Math.sqrt((1 * star.mass) / r)
      const planet = makeBody({ name: 'Planet', mass: 1, x: r, y: 0, vx: 0, vy: v, color: '#38BDF8' })
      return [star, planet]
    },
  },
  {
    name: 'Escape trajectory',
    description: 'Speed above escape velocity (v > √(2GM/r)): the planet never returns.',
    build: () => {
      const star = makeBody({ name: 'Star', mass: 100, x: 0, y: 0, vx: 0, vy: 0, color: '#FBBF24' })
      const r = 120
      const v = 1.5 * Math.sqrt((1 * star.mass) / r)
      const planet = makeBody({ name: 'Probe', mass: 0.5, x: r, y: 0, vx: 0, vy: v, color: '#F87171' })
      return [star, planet]
    },
  },
  {
    name: 'Binary system',
    description: 'Two comparable masses orbiting their common center of mass.',
    build: () => {
      const m1 = 40
      const m2 = 25
      const sep = 160
      const r1 = (sep * m2) / (m1 + m2)
      const r2 = (sep * m1) / (m1 + m2)
      const omega = Math.sqrt((1 * (m1 + m2)) / Math.pow(sep, 3))
      return [
        makeBody({ name: 'Primary', mass: m1, x: -r1, y: 0, vx: 0, vy: -omega * r1, color: '#FBBF24' }),
        makeBody({ name: 'Companion', mass: m2, x: r2, y: 0, vx: 0, vy: omega * r2, color: '#818CF8' }),
      ]
    },
  },
]

/** Deep-clone a body list (fresh ids and trails). */
export function cloneBodies(bodies: Body[]): Body[] {
  return bodies.map((b) =>
    makeBody({ name: b.name, mass: b.mass, x: b.x, y: b.y, vx: b.vx, vy: b.vy, color: b.color }),
  )
}

export function resetIds(): void {
  nextId = 1
}
