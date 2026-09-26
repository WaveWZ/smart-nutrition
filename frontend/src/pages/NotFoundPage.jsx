import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader, SkipLink } from '../components/layout/SiteHeader'
import { PageMeta } from '../components/seo/PageMeta'

export default function NotFoundPage() {
  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="Page not found"
        description="That page is not part of Smart Nutrition Recommend."
        path="/404"
      />
      <SkipLink />
      <SiteHeader>
        <Link to="/login" className="px-3 py-2 text-sm font-medium text-ink">Sign in</Link>
      </SiteHeader>
      <main id="main" className="mx-auto max-w-6xl px-5 py-24">
        <h1 className="text-4xl font-semibold tracking-tight">This page does not exist.</h1>
        <p className="mt-4 max-w-md text-muted">The address does not match a screen in the app.</p>
        <Link to="/" className="mt-8 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground">
          Back to the start
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
