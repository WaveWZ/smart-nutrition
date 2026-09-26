import { Helmet } from 'react-helmet-async'

export function PageMeta({ title, description, path }) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const url = `${origin}${path}`
  const fullTitle = title ? `${title} · Smart Nutrition Recommend` : 'Smart Nutrition Recommend'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
