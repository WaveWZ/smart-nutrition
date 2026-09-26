import { doc, onSnapshot } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { getIntake, readApiError } from '../services/api'
import { getFirestoreDb, isFirestoreConfigured } from '../services/firebase'
import { normalizeIntake } from '../utils/nutrition'

export function useDailyIntake(profileId, date) {
  const [intake, setIntake] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [scope, setScope] = useState({ profileId, date })

  if (scope.profileId !== profileId || scope.date !== date) {
    setScope({ profileId, date })
    setIntake(null)
    setStatus('loading')
    setError(null)
  }

  const replaceIntake = useCallback((record) => {
    setIntake(normalizeIntake(record, profileId, date))
    setError(null)
  }, [profileId, date])

  useEffect(() => {
    let ignore = false
    let live = false

    getIntake(profileId, date)
      .then((record) => {
        if (ignore || live) return
        setIntake(normalizeIntake(record, profileId, date))
        if (!isFirestoreConfigured()) setStatus('ready')
      })
      .catch((requestError) => {
        if (ignore || live) return
        setError(readApiError(requestError))
        if (!isFirestoreConfigured()) setStatus('ready')
      })

    const database = getFirestoreDb()
    if (!database) {
      return () => {
        ignore = true
      }
    }

    const unsubscribe = onSnapshot(
      doc(database, 'dailyIntakes', `${profileId}_${date}`),
      (snapshot) => {
        live = true
        if (ignore) return
        const record = snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : null
        setIntake(normalizeIntake(record, profileId, date))
        setStatus('live')
        setError(null)
      },
      () => {
        if (ignore) return
        setError('The live intake listener could not read Firestore. The page is using the API response.')
        setStatus('ready')
      },
    )

    return () => {
      ignore = true
      unsubscribe()
    }
  }, [profileId, date])

  return { intake, status, error, replaceIntake }
}
