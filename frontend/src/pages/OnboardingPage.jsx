import { ProfileForm } from '../components/profile/ProfileForm'
import { SignOutButton, SiteFooter, SiteHeader, SkipLink } from '../components/layout/SiteHeader'
import { PageMeta } from '../components/seo/PageMeta'
import { useAuth } from '../context/useAuth'
import { createProfile, readApiError } from '../services/api'

export default function OnboardingPage() {
  const { user, profileError, profileStatus, refreshProfile } = useAuth()

  async function handleSubmit(body) {
    try {
      await createProfile({ ...body, id: user.uid })
    } catch (error) {
      if (error?.response?.status !== 409) {
        throw new Error(readApiError(error), { cause: error })
      }
    }
    await refreshProfile()
  }

  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="Set your targets"
        description="Enter age, weight, and height so daily calorie and macro targets can be calculated."
        path="/onboarding"
      />
      <SkipLink />
      <SiteHeader>
        <SignOutButton />
      </SiteHeader>
      <main id="main" className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Your biometrics</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Age, weight, and height set the basal rate. Activity and goal turn that into today’s calorie, protein, carbohydrate, and fat targets.
        </p>
        {profileStatus === 'error' ? (
          <p role="alert" className="mt-6 rounded-xl border border-line bg-white p-4 text-sm text-danger">{profileError}</p>
        ) : (
          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <ProfileForm submitLabel="Create my plan" onSubmit={handleSubmit} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
