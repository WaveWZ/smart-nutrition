import { BrandLink, SkipLink } from '../layout/SiteHeader'

export function AuthLayout({ title, lede, children, footer }) {
  return (
    <div className="min-h-svh bg-paper text-ink lg:grid lg:grid-cols-2">
      <SkipLink />
      <aside className="relative hidden overflow-hidden bg-forest text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(46,160,120,0.4),transparent_55%)]" aria-hidden="true" />
        <BrandLink to="/" tone="light" />
        <div className="relative max-w-sm">
          <p className="text-3xl font-semibold tracking-tight">Meals ranked to the macros still open.</p>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Targets come from your biometrics. Every serving updates the day, and the next suggestion follows what is left.
          </p>
        </div>
      </aside>
      <div className="flex min-h-svh flex-col">
        <header className="flex h-16 items-center px-5 lg:hidden">
          <BrandLink />
        </header>
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{lede}</p>
          {children}
          {footer}
        </main>
      </div>
    </div>
  )
}
