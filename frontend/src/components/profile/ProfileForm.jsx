import { useState } from 'react'
import { EMPTY_PROFILE_FORM } from '../../utils/profileForm'
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from '../../utils/nutrition'
import { Button } from '../ui/Button'
import { fieldClass } from '../ui/fieldClass'

function boundedNumber(value, { min, max, decimals }) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  const factor = 10 ** decimals
  const rounded = Math.round(number * factor) / factor
  if (Math.abs(rounded - number) > 1e-8) return null
  if (rounded < min || rounded > max) return null
  return rounded
}

export function ProfileForm({ initial, submitLabel, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_PROFILE_FORM, ...initial }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const age = boundedNumber(form.age, { min: 16, max: 90, decimals: 0 })
    const weightKg = boundedNumber(form.weightKg, { min: 35, max: 300, decimals: 1 })
    const heightCm = boundedNumber(form.heightCm, { min: 120, max: 230, decimals: 1 })
    const displayName = form.displayName.trim()

    if (!displayName || displayName.length > 80) {
      setError('Enter a name of up to 80 characters.')
      return
    }
    if (age == null) {
      setError('Age must be a whole number from 16 to 90.')
      return
    }
    if (!form.gender) {
      setError('Select sex. Targets use the Mifflin–St Jeor equation.')
      return
    }
    if (weightKg == null) {
      setError('Weight must be between 35 and 300 kg.')
      return
    }
    if (heightCm == null) {
      setError('Height must be between 120 and 230 cm.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onSubmit({
        displayName,
        age,
        gender: form.gender,
        weightKg,
        heightCm,
        activityLevel: form.activityLevel,
        goal: form.goal,
      })
    } catch (requestError) {
      setError(requestError?.message || 'The profile could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="display-name" className="text-sm font-medium text-ink">Name</label>
        <input
          id="display-name"
          value={form.displayName}
          onChange={(event) => updateField('displayName', event.target.value)}
          className={fieldClass}
          autoComplete="name"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="age" className="text-sm font-medium text-ink">Age</label>
        <input
          id="age"
          inputMode="numeric"
          value={form.age}
          onChange={(event) => updateField('age', event.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="gender" className="text-sm font-medium text-ink">Sex</label>
        <select
          id="gender"
          value={form.gender}
          onChange={(event) => updateField('gender', event.target.value)}
          className={fieldClass}
          required
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="weight" className="text-sm font-medium text-ink">Weight (kg)</label>
        <input
          id="weight"
          inputMode="decimal"
          value={form.weightKg}
          onChange={(event) => updateField('weightKg', event.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="height" className="text-sm font-medium text-ink">Height (cm)</label>
        <input
          id="height"
          inputMode="decimal"
          value={form.heightCm}
          onChange={(event) => updateField('heightCm', event.target.value)}
          className={fieldClass}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="activity" className="text-sm font-medium text-ink">Activity</label>
        <select
          id="activity"
          value={form.activityLevel}
          onChange={(event) => updateField('activityLevel', event.target.value)}
          className={fieldClass}
        >
          {ACTIVITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="goal" className="text-sm font-medium text-ink">Goal</label>
        <select
          id="goal"
          value={form.goal}
          onChange={(event) => updateField('goal', event.target.value)}
          className={fieldClass}
        >
          {GOAL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      {error ? <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <Button variant="primary" type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
