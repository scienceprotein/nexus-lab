import type { ReactNode } from 'react'

export function WorkspaceShell({
  visualization,
  chart,
  controls,
}: {
  visualization: ReactNode
  chart: ReactNode
  controls: ReactNode
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {visualization}
        {chart}
      </div>
      <aside className="min-w-0">
        <div className="rounded-lg border border-border bg-card lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto">
          {controls}
        </div>
      </aside>
    </div>
  )
}

export function ControlSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-border/60 p-4 last:border-b-0">
      <div className="panel-title mb-3">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function Readout({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="readout text-xs" style={accent ? { color: accent } : undefined}>
        {value}
        {unit && <span className="ml-1 text-muted-foreground/70">{unit}</span>}
      </span>
    </div>
  )
}

export function StatusPill({ running, label }: { running: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${
        running ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400' : 'border-amber-400/40 bg-amber-400/10 text-amber-400'
      }`}
      role="status"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${running ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'}`} />
      {label ?? (running ? 'Running' : 'Paused')}
    </span>
  )
}
