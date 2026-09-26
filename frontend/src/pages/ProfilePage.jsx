import { ProfileForm } from '../components/profile/ProfileForm'
import { profileToForm } from '../utils/profileForm'
import { AppHeader, SiteFooter, SkipLink } from '../components/layout/SiteHeader'
import { PageMeta } from '../components/seo/PageMeta'
import { useAuth } from '../context/useAuth'
import { readApiError, updateProfile } from '../services/api'

export default function ProfilePage() {
  const { user, profile, profileError, profileStatus, refreshProfile } = useAuth()

  async function handleSubmit(body) {
    try {
      await updateProfile(user.uid, body)
      await refreshProfile()
    } catch (error) {
      throw new Error(readApiError(error), { cause: error })
    }
  }

  return (
    <div className="min-h-svh bg-paper text-ink">
      <PageMeta
        title="Profile"
        description="Update the biometrics that recalculate daily calorie and macro targets."
        path="/profile"
      />
      <SkipLink />
      <AppHeader />
      <main id="main" className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-sm text-muted">{user?.email}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted">Saving recalculates BMR, TDEE, and the macro targets for today.</p>
        {profileStatus === 'error' ? (
          <p role="alert" className="mt-6 text-sm text-danger">{profileError}</p>
        ) : null}
        {profile ? (
          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <ProfileForm
              key={profile.updatedAt || profile.id}
              initial={profileToForm(profile)}
              submitLabel="Update targets"
              onSubmit={handleSubmit}
            />
          </div>
        ) : profileStatus !== 'error' ? (
          <p className="mt-8 text-sm text-muted">Loading profile…</p>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
