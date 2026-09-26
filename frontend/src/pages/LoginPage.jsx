import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PageMeta } from '../components/seo/PageMeta'
import { Button } from '../components/ui/Button'
import { fieldClass } from '../components/ui/fieldClass'
import { useAuth } from '../context/useAuth'
import { readAuthError } from '../utils/authError'

export default function LoginPage() {
  const { configured, profileError, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(email.trim(), password)
    } catch (requestError) {
      setError(readAuthError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      lede="Open the plan tied to your account."
      footer={(
        <p className="mt-6 text-sm text-muted">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-accent underline-offset-4 hover:underline">Create an account</Link>
        </p>
      )}
    >
      <PageMeta
        title="Sign in"
        description="Sign in to Smart Nutrition Recommend to open today’s macro plan."
        path="/login"
      />
      {!configured ? (
        <p role="alert" className="mt-6 rounded-2xl border border-line bg-white p-4 text-sm text-muted">{profileError}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
                required
              />
            </div>
            {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={submitting} aria-label="Sign in">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
      )}
    </AuthLayout>
  )
}
