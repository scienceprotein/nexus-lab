export type Difficulty = 'Introductory' | 'Intermediate' | 'Advanced'

export interface ModelDoc {
  /** LaTeX strings for the governing equations */
  equations: string[]
  /** e.g. "Velocity Verlet (symplectic, 2nd order)" */
  numericalMethod: string
  /** System of units / conventions */
  units: string
  assumptions: string[]
  limitations: string[]
  references: { label: string; url?: string }[]
}

export interface SimulationMeta {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  domain: string
  difficulty: Difficulty
  /** Whether the experiment can be opened and run right now */
  interactive: boolean
  status: 'available' | 'in-development'
  estimatedMinutes: number
  prerequisites: string[]
  learningObjectives: string[]
  tags: string[]
  capabilities: string[]
  model: ModelDoc
  version: string
}
