import type { ComponentType } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ArrowLeft, BookOpen, Clock, FlaskConical, GraduationCap, ShieldAlert } from 'lucide-react'
import { getSimulation } from '@/data/registry'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MathBlock } from '@/components/Math'
import { OrbitalWorkspace } from '@/components/workspace/OrbitalWorkspace'
import { WavesWorkspace } from '@/components/workspace/WavesWorkspace'
import { LorenzWorkspace } from '@/components/workspace/LorenzWorkspace'
import { NeuralWorkspace } from '@/components/workspace/NeuralWorkspace'

const WORKSPACES: Record<string, ComponentType> = {
  'neural-network': NeuralWorkspace,
  'orbital-mechanics': OrbitalWorkspace,
  'wave-interference': WavesWorkspace,
  'lorenz-attractor': LorenzWorkspace,
}

export default function Workspace() {
  const { slug } = useParams<{ slug: string }>()
  const sim = slug ? getSimulation(slug) : undefined

  if (!sim || !sim.interactive) {
    return <Navigate to="/explore" replace />
  }

  const SimView = WORKSPACES[sim.slug]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to explorer
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{sim.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sim.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{sim.domain}</Badge>
            <Badge variant="outline">{sim.difficulty}</Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> ~{sim.estimatedMinutes} min
            </Badge>
            <Badge variant="outline" className="readout gap-1">v{sim.version}</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="experiment">
        <TabsList className="mb-5">
          <TabsTrigger value="experiment" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Experiment
          </TabsTrigger>
          <TabsTrigger value="model" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Model &amp; equations
          </TabsTrigger>
          <TabsTrigger value="objectives" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Learning goals
          </TabsTrigger>
          <TabsTrigger value="limits" className="gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Limits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experiment">
          <SimView />
        </TabsContent>

        <TabsContent value="model">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="panel-title mb-4">Governing equations</div>
              <div className="space-y-2">
                {sim.model.equations.map((eq, i) => (
                  <MathBlock key={i} tex={eq} className="rounded-md border border-border/60 bg-background/60 px-4 py-3" />
                ))}
              </div>
              <div className="panel-title mb-2 mt-6">Numerical method</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{sim.model.numericalMethod}</p>
              <div className="panel-title mb-2 mt-6">Units &amp; conventions</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{sim.model.units}</p>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="panel-title mb-3">Assumptions</div>
                <ul className="space-y-2">
                  {sim.model.assumptions.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="panel-title mb-3">References</div>
                <ul className="space-y-2">
                  {sim.model.references.map((r) => (
                    <li key={r.label} className="text-sm text-muted-foreground">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {r.label}
                        </a>
                      ) : (
                        r.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="objectives">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="panel-title mb-3">Learning objectives</div>
              <ol className="space-y-3">
                {sim.learningObjectives.map((o, i) => (
                  <li key={o} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="readout mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 text-[10px] text-primary">
                      {i + 1}
                    </span>
                    {o}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="panel-title mb-3">Prerequisites &amp; capabilities</div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {sim.prerequisites.map((p) => (
                  <Badge key={p} variant="secondary" className="font-normal">{p}</Badge>
                ))}
              </div>
              <ul className="space-y-1.5">
                {sim.capabilities.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="limits">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-6">
            <div className="panel-title mb-3 flex items-center gap-2 text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5" /> Known limitations &amp; failure modes
            </div>
            <ul className="space-y-2">
              {sim.model.limitations.map((l) => (
                <li key={l} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-amber-400/20 pt-4 text-xs leading-relaxed text-muted-foreground">
              This is an educational model intended for the documented parameter ranges. It has not been
              independently validated against experimental data. Conserved-quantity monitors (where shown)
              are the fastest way to judge numerical trustworthiness yourself.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
