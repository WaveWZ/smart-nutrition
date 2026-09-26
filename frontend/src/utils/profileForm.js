export const EMPTY_PROFILE_FORM = {
  displayName: '',
  age: '',
  gender: '',
  weightKg: '',
  heightCm: '',
  activityLevel: 'moderately_active',
  goal: 'maintenance',
}

export function profileToForm(profile) {
  if (!profile) return EMPTY_PROFILE_FORM
  return {
    displayName: profile.displayName || '',
    age: String(profile.age ?? ''),
    gender: profile.gender || '',
    weightKg: String(profile.weightKg ?? ''),
    heightCm: String(profile.heightCm ?? ''),
    activityLevel: profile.activityLevel || 'moderately_active',
    goal: profile.goal || 'maintenance',
  }
}
