import { Link } from 'react-router'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { SIMULATIONS } from '@/data/registry'
import { MathBlock } from '@/components/Math'

/**
 * Documentation is generated from the same registry that drives the explorer,
 * so model docs never drift out of sync with the implementation metadata.
 */
export default function Docs() {
  const documented = SIMULATIONS.filter((s) => s.status === 'available')

  return (
    <div className="reading-surface">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">
          <BookOpen className="h-3.5 w-3.5" /> Documentation
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Scientific model documentation</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          Each experiment documents its governing equations, variables, units, assumptions, numerical
          method and known limitations. This page is generated from the central simulation registry —
          the same source of truth that drives the explorer and the workspaces.
        </p>

        <div className="mt-10 space-y-12">
          {documented.map((sim, i) => (
            <article key={sim.id} className="border-t border-slate-200 pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {i + 1}. {sim.title}
                </h2>
                <Link
                  to={`/sim/${sim.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
                >
                  Open experiment <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{sim.description}</p>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Governing equations</h3>
              <div className="mt-2 space-y-1 text-slate-800">
                {sim.model.equations.map((eq, j) => (
                  <MathBlock key={j} tex={eq} />
                ))}
              </div>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Numerical method</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{sim.model.numericalMethod}</p>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Units &amp; conventions</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{sim.model.units}</p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Assumptions</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-slate-600">
                    {sim.model.assumptions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Known limitations</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-slate-600">
                    {sim.model.limitations.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">References</h3>
              <ul className="mt-2 space-y-1 text-[15px] text-slate-600">
                {sim.model.references.map((r) => (
                  <li key={r.label}>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                        {r.label}
                      </a>
                    ) : (
                      r.label
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Extending the platform</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            New experiments are added by (1) writing a pure numerical engine in{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-800">src/engine/</code>, (2) registering
            metadata in <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-800">src/data/registry.ts</code>,
            and (3) mounting a workspace component through the shared{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-800">WorkspaceShell</code>. The explorer,
            cards and this documentation page then update automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
