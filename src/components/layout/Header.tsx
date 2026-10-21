import { Link, NavLink, useLocation } from 'react-router'
import { Atom, BookOpen, Compass, FlaskConical, Info, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const NAV = [
  { to: '/explore', label: 'Simulations', icon: Compass },
  { to: '/docs', label: 'Documentation', icon: BookOpen },
  { to: '/about', label: 'Methodology', icon: Info },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <Atom className="h-4.5 w-4.5" size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">NEXUS LAB</div>
            <div className="text-[10px] text-muted-foreground hidden sm:block">Interactive scientific simulations</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive || (to === '/explore' && location.pathname.startsWith('/sim'))
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <Button asChild size="sm" className="ml-3">
            <Link to="/explore">
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
              Open Lab
            </Link>
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile navigation">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <Button asChild className="mt-4" onClick={() => setOpen(false)}>
                <Link to="/explore">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Open Lab
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
