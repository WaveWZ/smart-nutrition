import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export function RouteFallback() {
  return (
    <div className="grid min-h-svh place-items-center bg-paper text-ink">
      <p className="text-sm text-muted">Loading…</p>
    </div>
  )
}

export function RequireAuth({ children, allowMissing = false }) {
  const { configured, authReady, user, profileStatus, profileError } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <div className="grid min-h-svh place-items-center bg-paper px-5 text-ink">
        <p role="alert" className="max-w-md text-sm text-muted">{profileError}</p>
      </div>
    )
  }
  if (!authReady || (user && profileStatus === 'loading')) return <RouteFallback />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!allowMissing && profileStatus === 'missing') {
    return <Navigate to="/onboarding" replace />
  }
  if (allowMissing && profileStatus === 'ready') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export function GuestRoute({ children }) {
  const { configured, authReady, user, profileStatus } = useAuth()

  if (configured && (!authReady || (user && profileStatus === 'loading'))) return <RouteFallback />
  if (!configured) return children
  if (user && profileStatus === 'missing') return <Navigate to="/onboarding" replace />
  if (user && (profileStatus === 'ready' || profileStatus === 'error')) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
