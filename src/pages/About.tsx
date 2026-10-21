import { CheckCircle2, CircleDashed, FlaskConical, Scale, TriangleAlert } from 'lucide-react'

const TIERS = [
  {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    title: 'Established scientific principles',
    text: 'Models like Newtonian gravitation and linear wave superposition are textbook physics. Their equations are documented and their conservation laws are monitored live so you can verify the implementation numerically.',
  },
  {
    icon: FlaskConical,
    color: 'text-sky-400',
    title: 'Simplified educational models',
    text: 'Every experiment here is deliberately simplified: 2D instead of 3D, point masses instead of extended bodies, no damping, fixed wave speed. Simplifications are listed under each model\u2019s assumptions — never implied to be complete representations of reality.',
  },
  {
    icon: Scale,
    color: 'text-indigo-300',
    title: 'Numerical approximations',
    text: 'Continuous physics is approximated by discrete integration (velocity Verlet, RK4). Step sizes, stability bounds and softening parameters are exposed as controls, and known failure modes — like RK4 divergence at large steps — surface as explicit errors, not silent wrongness.',
  },
  {
    icon: TriangleAlert,
    color: 'text-amber-400',
    title: 'What we do not claim',
    text: 'No simulation on this platform has been independently validated against experimental data. Charts plot actual computed output only. Presets are illustrative configurations, not fitted astronomical or laboratory measurements.',
  },
]

const PRACTICES = [
  {
    title: 'Conservation monitoring',
    text: 'The orbital workspace plots total energy and angular momentum continuously. Drift in these quantities is numerical error made visible — the fastest honesty check a simulation can offer.',
  },
  {
    title: 'Documented parameter bounds',
    text: 'Controls enforce ranges in which the numerical method is known to behave (e.g. RK4 step bounds for the Lorenz system). Exceeding them produces an explicit instability warning, not a plausible-looking picture.',
  },
  {
    title: 'Units and conventions',
    text: 'Simulation units are defined per model (G = 1, dimensionless, or SI) with instructions for mapping to physical units. Axis labels always carry units.',
  },
  {
    title: 'Reproducibility',
    text: 'Reset restores the complete documented initial state. Export captures the actual time series the charts display, in CSV with named columns and units in the header.',
  },
  {
    title: 'Separation of model and view',
    text: 'Physics engines are pure TypeScript modules with no rendering code. The same equations drive the canvas, the charts and the readouts — they cannot disagree with each other.',
  },
]

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="panel-title mb-2">About &amp; methodology</div>
      <h1 className="text-3xl font-semibold tracking-tight">How NEXUS LAB approaches scientific software</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        The platform treats scientific credibility as a product feature: every experiment documents its
        equations, assumptions, numerical method and limitations, and conserved quantities are monitored
        so numerical accuracy is observable rather than asserted.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Epistemic tiers — what kind of truth are you looking at?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div key={t.title} className="rounded-lg border border-border bg-card p-5">
              <div className={`flex items-center gap-2 ${t.color}`}>
                <t.icon className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Engineering practices</h2>
        <div className="mt-6 space-y-3">
          {PRACTICES.map((p, i) => (
            <div key={p.title} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <span className="readout mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 text-[11px] text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <CircleDashed className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Current scope &amp; honest status</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
            Three flagship experiments are fully interactive: orbital mechanics, wave interference, and the Lorenz system.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
            Catalog entries marked “In development” are registered with planned models but are not yet runnable — they are not presented as functional.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
            Computation runs on the main thread; extremely demanding future models (large N-body, lattice Monte Carlo) are planned to move into Web Workers.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
            Configuration persistence and experiment sharing are scoped but not yet implemented; CSV export of diagnostics is available in the orbital workspace.
          </li>
        </ul>
      </section>
    </div>
  )
}
