import { useCallback, useEffect, useRef, useState } from 'react'
import { getProfile, getRecommendations, readApiError } from '../services/api'
import { localDateISO } from '../utils/dates'
import { remainingMacros, totalsSignature } from '../utils/nutrition'
import { useDailyIntake } from './useDailyIntake'

export function useNutritionDay(profileId) {
  const [date] = useState(() => localDateISO())
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [plan, setPlan] = useState(null)
  const [planError, setPlanError] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const fetchKey = `${profileId}:${date}:${reloadKey}`
  const [trackedFetch, setTrackedFetch] = useState(fetchKey)
  const requestId = useRef(0)
  const syncedSignature = useRef('')
  const intakeState = useDailyIntake(profileId, date)

  if (trackedFetch !== fetchKey) {
    setTrackedFetch(fetchKey)
    setPlanLoading(true)
  }

  const loadProfile = useCallback(() => {
    return getProfile(profileId)
      .then((record) => {
        setProfile(record)
        setProfileError(null)
        return record
      })
      .catch((error) => {
        setProfileError(readApiError(error))
        throw error
      })
  }, [profileId])

  useEffect(() => {
    let ignore = false
    loadProfile().catch(() => {
      if (ignore) return
    })
    return () => {
      ignore = true
    }
  }, [loadProfile])

  useEffect(() => {
    const id = requestId.current + 1
    requestId.current = id

    getRecommendations(profileId, date)
      .then((record) => {
        if (requestId.current !== id) return
        setPlan(record)
        setPlanError(null)
        syncedSignature.current = totalsSignature(record.consumed)
      })
      .catch((error) => {
        if (requestId.current !== id) return
        setPlanError(readApiError(error))
      })
      .finally(() => {
        if (requestId.current === id) setPlanLoading(false)
      })
  }, [profileId, date, reloadKey])

  const liveSignature = totalsSignature(intakeState.intake?.totals)

  useEffect(() => {
    if (!intakeState.intake || !plan) return
    if (!liveSignature || liveSignature === totalsSignature(plan.consumed)) return
    if (syncedSignature.current === liveSignature) return

    syncedSignature.current = liveSignature
    const id = requestId.current + 1
    requestId.current = id

    getRecommendations(profileId, date)
      .then((record) => {
        if (requestId.current !== id) return
        setPlan(record)
        setPlanError(null)
      })
      .catch((error) => {
        if (requestId.current !== id) return
        setPlanError(readApiError(error))
        syncedSignature.current = ''
      })
  }, [liveSignature, intakeState.intake, plan, profileId, date])

  const targets = profile?.targets || plan?.targets || null
  const consumed = intakeState.intake?.totals || plan?.consumed || null

  return {
    date,
    profile,
    profileError,
    plan,
    planError,
    planLoading,
    intake: intakeState.intake,
    intakeStatus: intakeState.status,
    intakeError: intakeState.error,
    targets,
    consumed,
    remaining: remainingMacros(targets, consumed),
    replaceIntake: intakeState.replaceIntake,
    reloadProfile: loadProfile,
    reloadPlan: () => setReloadKey((value) => value + 1),
  }
}
