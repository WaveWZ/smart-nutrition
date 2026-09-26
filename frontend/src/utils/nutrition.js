export const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly active' },
  { value: 'moderately_active', label: 'Moderately active' },
  { value: 'very_active', label: 'Very active' },
  { value: 'extra_active', label: 'Extra active' },
]

export const GOAL_OPTIONS = [
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'muscle_gain', label: 'Muscle gain' },
]

export const FOOD_CATEGORIES = [
  { value: 'protein', label: 'Protein' },
  { value: 'carbohydrate', label: 'Carbohydrate' },
  { value: 'fat', label: 'Fat' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'mixed', label: 'Mixed meal' },
]

export const MEAL_SLOTS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

export const MACRO_FIELDS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', digits: 0, color: 'var(--color-calorie)' },
  { key: 'proteinGrams', label: 'Protein', unit: 'g', digits: 0, color: 'var(--color-protein)' },
  { key: 'carbGrams', label: 'Carbs', unit: 'g', digits: 0, color: 'var(--color-carb)' },
  { key: 'fatGrams', label: 'Fat', unit: 'g', digits: 0, color: 'var(--color-fat)' },
]

export function emptyMacros() {
  return { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
}

export function emptyIntake(profileId, date) {
  const slot = () => emptyMacros()
  return {
    id: `${profileId}_${date}`,
    profileId,
    date,
    entries: [],
    totals: emptyMacros(),
    totalsBySlot: {
      breakfast: slot(),
      lunch: slot(),
      dinner: slot(),
      snack: slot(),
    },
  }
}

export function totalsSignature(totals) {
  if (!totals) return ''
  return [
    Math.round(totals.calories || 0),
    Math.round((totals.proteinGrams || 0) * 10),
    Math.round((totals.carbGrams || 0) * 10),
    Math.round((totals.fatGrams || 0) * 10),
  ].join(':')
}

export function remainingMacros(targets, consumed) {
  if (!targets) return null
  const current = consumed || emptyMacros()
  return {
    calories: Math.max(0, Math.round(targets.calories - (current.calories || 0))),
    proteinGrams: Math.max(0, round1(targets.proteinGrams - (current.proteinGrams || 0))),
    carbGrams: Math.max(0, round1(targets.carbGrams - (current.carbGrams || 0))),
    fatGrams: Math.max(0, round1(targets.fatGrams - (current.fatGrams || 0))),
  }
}

export function percentOfTarget(consumed, target) {
  if (!target) return 0
  return Math.round((consumed / target) * 100)
}

function round1(value) {
  return Math.round(value * 10) / 10
}

export function toIso(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  return value
}

export function normalizeIntake(record, profileId, date) {
  const fallback = emptyIntake(profileId, date)
  if (!record) return fallback
  return {
    ...fallback,
    ...record,
    entries: Array.isArray(record.entries) ? record.entries : [],
    totals: { ...fallback.totals, ...(record.totals || {}) },
    totalsBySlot: { ...fallback.totalsBySlot, ...(record.totalsBySlot || {}) },
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  }
}
