import { Link } from 'react-router'
import { Atom, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Atom className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-wide">NEXUS LAB</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            An interactive digital laboratory for exploring physical systems, mathematical models and
            computational experiments. Every simulation documents its equations, assumptions and limits.
          </p>
        </div>
        <div>
          <div className="panel-title mb-3">Platform</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground transition-colors" to="/explore">Simulation explorer</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/docs">Documentation</Link></li>
            <li><Link className="hover:text-foreground transition-colors" to="/about">Scientific methodology</Link></li>
          </ul>
        </div>
        <div>
          <div className="panel-title mb-3">Resources</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                href="https://github.com/topics/online-simulations"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-3.5 w-3.5" />
                Ecosystem inspiration
              </a>
            </li>
            <li>
              <a className="hover:text-foreground transition-colors" href="https://openstax.org/subjects/science" target="_blank" rel="noreferrer">
                OpenStax physics references
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-muted-foreground/70 sm:px-6">
          <span>NEXUS LAB — educational scientific software</span>
          <span className="readout">v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
