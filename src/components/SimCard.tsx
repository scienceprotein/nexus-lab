import { Link } from 'react-router'
import { ArrowRight, Clock, Play, Wrench } from 'lucide-react'
import type { SimulationMeta } from '@/types/simulation'
import { Badge } from '@/components/ui/badge'
import { SimThumbnail } from '@/components/SimThumbnail'

const DIFFICULTY_COLOR: Record<string, string> = {
  Introductory: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  Intermediate: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  Advanced: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
}

export function SimCard({ sim }: { sim: SimulationMeta }) {
  const inner = (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="relative">
        <SimThumbnail slug={sim.slug} />
        <div className="absolute left-2 top-2">
          {sim.interactive ? (
            <Badge variant="secondary" className="gap-1 border border-primary/30 bg-background/70 text-primary backdrop-blur-sm">
              <Play className="h-3 w-3" /> Interactive
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 border border-border bg-background/70 text-muted-foreground backdrop-blur-sm">
              <Wrench className="h-3 w-3" /> In development
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{sim.title}</h3>
          {sim.interactive && <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />}
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{sim.tagline}. {sim.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
          <Badge variant="outline" className="text-[10px] font-normal">{sim.domain}</Badge>
          <Badge variant="outline" className={`text-[10px] font-normal ${DIFFICULTY_COLOR[sim.difficulty]}`}>{sim.difficulty}</Badge>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> ~{sim.estimatedMinutes} min
          </span>
        </div>
      </div>
    </div>
  )

  if (!sim.interactive) {
    return <div className="opacity-75" aria-disabled="true" title="This experiment is in development">{inner}</div>
  }
  return <Link to={`/sim/${sim.slug}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">{inner}</Link>
}
