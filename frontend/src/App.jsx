import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GuestRoute, RequireAuth, RouteFallback } from './components/auth/RouteGate'
import { AuthProvider } from './context/AuthProvider'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const WeekPage = lazy(() => import('./pages/WeekPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function Lazy({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route
            path="/onboarding"
            element={(
              <RequireAuth allowMissing>
                <Lazy><OnboardingPage /></Lazy>
              </RequireAuth>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <RequireAuth>
                <Lazy><DashboardPage /></Lazy>
              </RequireAuth>
            )}
          />
          <Route
            path="/history"
            element={(
              <RequireAuth>
                <Lazy><HistoryPage /></Lazy>
              </RequireAuth>
            )}
          />
          <Route
            path="/week"
            element={(
              <RequireAuth>
                <Lazy><WeekPage /></Lazy>
              </RequireAuth>
            )}
          />
          <Route
            path="/profile"
            element={(
              <RequireAuth>
                <Lazy><ProfilePage /></Lazy>
              </RequireAuth>
            )}
          />
          <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
