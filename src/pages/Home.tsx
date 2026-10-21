import { Link } from 'react-router'
import { ArrowRight, BookOpen, Compass, FlaskConical, Gauge, LineChart, MonitorPlay, ShieldCheck, SlidersHorizontal, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroSimulation } from '@/components/HeroSimulation'
import { SimCard } from '@/components/SimCard'
import { SIMULATIONS } from '@/data/registry'

const WORKFLOW = [
  { icon: Compass, title: 'Explore a system', text: 'Browse the simulation library by domain, difficulty and phenomenon.' },
  { icon: SlidersHorizontal, title: 'Change its parameters', text: 'Every control maps to a real model variable with units, ranges and validation.' },
  { icon: MonitorPlay, title: 'Observe its behavior', text: 'Live visualizations and numerical readouts stay consistent with the model state.' },
  { icon: BookOpen, title: 'Understand why', text: 'Governing equations, assumptions and limitations are documented beside each experiment.' },
]

const CAPABILITIES = [
  { icon: FlaskConical, title: 'Real numerical models', text: 'Newtonian N-body integration, coherent wave superposition, and RK4 chaotic dynamics — computed live in your browser.' },
  { icon: LineChart, title: 'Quantitative analysis', text: 'Time-series charts with labeled axes, units, hover inspection and CSV export of simulation output.' },
  { icon: Gauge, title: 'Numerical transparency', text: 'Integration methods, step sizes, softening parameters and stability bounds are exposed and documented.' },
  { icon: ShieldCheck, title: 'Scientific honesty', text: 'Simplified educational models are labeled as such. Conserved quantities are monitored so you can judge accuracy yourself.' },
]

export default function Home() {
  const featured = SIMULATIONS.filter((s) => s.interactive)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="grid-lines absolute inset-0" />
        <div className="absolute inset-0 opacity-90">
          <HeroSimulation />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start px-4 pb-24 pt-24 sm:px-6 sm:pt-32">
          <div className="pointer-events-none max-w-2xl">
            <div className="panel-title mb-4 flex items-center gap-2 text-primary">
              <span className="h-px w-8 bg-primary/60" />
              Interactive scientific simulation platform
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              Explore a system. Change its parameters.{' '}
              <span className="text-primary">Understand why.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              NEXUS LAB is a digital laboratory where physical systems run live in your browser.
              The orbital simulation behind this text is integrating Newtonian gravity right now —
              open the lab and change the initial conditions yourself.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/explore">
                  Explore Simulations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/sim/orbital-mechanics">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Open Scientific Lab
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="panel-title mb-2">How experiments work</div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">From question to quantitative answer</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((w, i) => (
            <div key={w.title} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                  <w.icon size={18} />
                </div>
                <span className="readout text-xs text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured simulations */}
      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="panel-title mb-2">Flagship experiments</div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fully interactive, fully documented</h2>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/explore">
                Full library <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((sim) => (
              <SimCard key={sim.id} sim={sim} />
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="panel-title mb-2">Platform capabilities</div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Built like a scientific instrument</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
                <c.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology teaser */}
      <section className="border-t border-border/70 bg-card/30">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="panel-title mb-2 flex items-center gap-2">
              <Workflow className="h-3.5 w-3.5" /> Scientific methodology
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">A model is only useful if you know its limits</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every experiment on this platform ships with its governing equations, unit conventions,
              simplifying assumptions, numerical method and known failure modes. Conserved quantities are
              plotted so numerical error is visible, not hidden. Simplified educational models are
              explicitly labeled — never presented as complete representations of reality.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/about">
                Read the methodology <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 lg:w-96">
            <div className="panel-title mb-4">Model transparency checklist</div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {[
                'Governing equations with defined variables',
                'Units and parameter conventions',
                'Numerical method and step-size bounds',
                'Simplifying assumptions, stated explicitly',
                'Conserved-quantity monitoring',
                'Known limitations and failure modes',
                'Primary references for every model',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
