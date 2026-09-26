import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getProfile, readApiError } from '../services/api'
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!configured)
  const [profile, setProfile] = useState(null)
  const [profileStatus, setProfileStatus] = useState(configured ? 'idle' : 'error')
  const [profileError, setProfileError] = useState(
    configured ? null : 'Firebase is not configured. Add the web app keys to frontend/.env and restart Vite.',
  )
  const requestId = useRef(0)

  const applyProfileResult = useCallback(async (uid, id) => {
    try {
      const record = await getProfile(uid)
      if (requestId.current !== id) return null
      setProfile(record)
      setProfileStatus('ready')
      setProfileError(null)
      return record
    } catch (error) {
      if (requestId.current !== id) return null
      if (error?.response?.status === 404) {
        setProfile(null)
        setProfileStatus('missing')
        setProfileError(null)
        return null
      }
      setProfileError(readApiError(error))
      setProfileStatus('error')
      return null
    }
  }, [])

  useEffect(() => {
    if (!configured) return undefined
    const auth = getFirebaseAuth()
    if (!auth) return undefined

    return onAuthStateChanged(auth, (nextUser) => {
      const id = requestId.current + 1
      requestId.current = id
      setUser(nextUser)
      setAuthReady(true)
      if (!nextUser) {
        setProfile(null)
        setProfileStatus('idle')
        setProfileError(null)
        return
      }
      setProfileStatus('loading')
      applyProfileResult(nextUser.uid, id)
    })
  }, [applyProfileResult, configured])

  const refreshProfile = useCallback(() => {
    if (!user) return Promise.resolve(null)
    const id = requestId.current + 1
    requestId.current = id
    setProfileStatus('loading')
    return applyProfileResult(user.uid, id)
  }, [applyProfileResult, user])

  const signUp = useCallback(async (email, password) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase is not configured.')
    await createUserWithEmailAndPassword(auth, email, password)
  }, [])

  const signIn = useCallback(async (email, password) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase is not configured.')
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    await signOut(auth)
  }, [])

  const value = useMemo(() => ({
    configured,
    user,
    authReady,
    profile,
    profileStatus,
    profileError,
    signUp,
    signIn,
    signOutUser,
    refreshProfile,
  }), [
    configured,
    user,
    authReady,
    profile,
    profileStatus,
    profileError,
    signUp,
    signIn,
    signOutUser,
    refreshProfile,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

