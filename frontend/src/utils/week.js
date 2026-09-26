export function percentOf(value, target) {
  if (!target) return 0
  return Math.round((Number(value) / target) * 100)
}

export function dayStanding({ calories, logged, isToday, target }) {
  if (!logged) return isToday ? 'open' : 'empty'
  if (!target) return 'logged'
  const ratio = calories / target
  if (ratio > 1.1) return 'over'
  if (ratio >= 0.9) return 'on'
  return isToday ? 'open' : 'under'
}

export const STANDING_LABEL = {
  empty: 'Not logged',
  open: 'Still open',
  under: 'Under target',
  on: 'On target',
  over: 'Over target',
  logged: 'Logged',
}
