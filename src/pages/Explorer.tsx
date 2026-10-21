import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { SIMULATIONS, DOMAINS } from '@/data/registry'
import { SimCard } from '@/components/SimCard'

type SortKey = 'name' | 'difficulty' | 'time'

const DIFF_ORDER = { Introductory: 0, Intermediate: 1, Advanced: 2 }

export default function Explorer() {
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('name')

  const results = useMemo(() => {
    const list = SIMULATIONS.filter((s) => {
      if (domain && s.domain !== domain) return false
      if (difficulty !== 'all' && s.difficulty !== difficulty) return false
      if (query) {
        const q = query.toLowerCase()
        const hay = [s.title, s.tagline, s.description, s.domain, ...s.tags].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    const sorted = [...list].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title)
      if (sort === 'difficulty') return DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]
      return a.estimatedMinutes - b.estimatedMinutes
    })
    // available labs first
    return sorted.sort((a, b) => (a.status === b.status ? 0 : a.status === 'available' ? -1 : 1))
  }, [query, domain, difficulty, sort])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Simulation Explorer</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find and explore interactive simulations across different scientific domains
      </p>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search simulations…"
          className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <div className="panel-title mb-2">Domains</div>
          <div className="flex flex-wrap gap-1 lg:flex-col lg:gap-0.5">
            <button
              onClick={() => setDomain(null)}
              className={`rounded-md px-3 py-1.5 text-left text-[13px] transition-colors ${
                domain === null
                  ? 'bg-primary/15 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              All Simulations
            </button>
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d === domain ? null : d)}
                className={`rounded-md px-3 py-1.5 text-left text-[13px] transition-colors ${
                  domain === d
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-md border border-input bg-card px-2 py-1.5 outline-none focus:border-primary/60"
              >
                <option value="all">All</option>
                <option>Introductory</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-input bg-card px-2 py-1.5 outline-none focus:border-primary/60"
              >
                <option value="name">Name</option>
                <option value="difficulty">Difficulty</option>
                <option value="time">Duration</option>
              </select>
            </div>
            <span className="readout ml-auto text-muted-foreground">
              {results.length} result{results.length === 1 ? '' : 's'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-border py-20 text-sm text-muted-foreground">
              Nothing found — try another query or clear the filters
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((sim) => (
                <SimCard key={sim.id} sim={sim} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
