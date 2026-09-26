import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { Button } from '../ui/Button'

export function BrandMark({ className = 'bg-accent text-accent-foreground' }) {
  return (
    <span className={`grid size-8 place-items-center rounded-lg ${className}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" className="size-5" fill="none">
        <path d="M16 6c.5 5 2.6 8 8 10-5.4 1.8-7.5 4.8-8 10-.5-5.2-2.6-8.2-8-10 5.4-2 7.5-5 8-10Z" fill="currentColor" />
      </svg>
    </span>
  )
}

export function BrandLink({ to = '/', tone = 'dark' }) {
  const light = tone === 'light'
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
      <BrandMark className={light ? 'bg-white/15 text-white' : 'bg-accent text-accent-foreground'} />
      Smart Nutrition
    </Link>
  )
}

export function SiteHeader({ children, tone = 'light', home = '/' }) {
  const dark = tone === 'dark'
  return (
    <header className={dark ? 'absolute inset-x-0 top-0 z-40' : 'sticky top-0 z-40 border-b border-line/80 bg-paper/80 backdrop-blur-md'}>
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <BrandLink to={home} tone={dark ? 'light' : 'dark'} />
        <div className="flex items-center gap-1 overflow-x-auto sm:gap-2">{children}</div>
      </nav>
    </header>
  )
}

const APP_LINKS = [
  { to: '/dashboard', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/week', label: 'Week' },
  { to: '/profile', label: 'Profile' },
]

export function AppHeader() {
  const { pathname } = useLocation()
  return (
    <SiteHeader home="/dashboard">
      {APP_LINKS.map((link) => {
        const current = pathname === link.to
        return (
          <Link
            key={link.to}
            to={link.to}
            aria-current={current ? 'page' : undefined}
            className={`px-2 py-2 text-sm sm:px-3 ${current ? 'font-semibold text-ink' : 'font-medium text-muted hover:text-ink'}`}
          >
            {link.label}
          </Link>
        )
      })}
      <SignOutButton />
    </SiteHeader>
  )
}

export function SignOutButton() {
  const { signOutUser } = useAuth()
  return (
    <Button variant="quiet" aria-label="Sign out" onClick={() => signOutUser()}>
      Sign out
    </Button>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BrandLink />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Daily targets from Mifflin–St Jeor, then meals ranked to the macros still open.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <a href="/#how-it-works" className="text-muted hover:text-ink">How it works</a>
          <a href="/#features" className="text-muted hover:text-ink">Features</a>
          <a href="/#day" className="text-muted hover:text-ink">The day</a>
          <Link to="/login" className="text-muted hover:text-ink">Sign in</Link>
        </nav>
      </div>
    </footer>
  )
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-sm"
    >
      Skip to content
    </a>
  )
}
