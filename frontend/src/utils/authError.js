const MESSAGES = {
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Use at least 6 characters.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project.',
  'auth/network-request-failed': 'Firebase could not be reached. Check the connection and try again.',
}

export function readAuthError(error) {
  if (!error) return 'Authentication failed.'
  return MESSAGES[error.code] || error.message || 'Authentication failed.'
}
