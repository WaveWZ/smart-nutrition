import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PageMeta } from '../components/seo/PageMeta'
import { Button } from '../components/ui/Button'
import { fieldClass } from '../components/ui/fieldClass'
import { useAuth } from '../context/useAuth'
import { readAuthError } from '../utils/authError'

export default function SignupPage() {
  const { configured, profileError, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 6) {
      setError('Use at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await signUp(email.trim(), password)
    } catch (requestError) {
      setError(readAuthError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      lede="Email and password first. Biometrics come next."
      footer={(
        <p className="mt-6 text-sm text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Sign in</Link>
        </p>
      )}
    >
      <PageMeta
        title="Create an account"
        description="Create a Smart Nutrition Recommend account, then set the biometrics used for daily targets."
        path="/signup"
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
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
                minLength={6}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={fieldClass}
                minLength={6}
                required
              />
            </div>
            {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" disabled={submitting} aria-label="Create account">
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
      )}
    </AuthLayout>
  )
}
