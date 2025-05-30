import { useState, useEffect, useCallback } from 'react'
import { AuthService } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Sign up
  const signUp = useCallback(async (email, password, displayName) => {
    setLoading(true)
    setError(null)

    try {
      const result = await AuthService.signUp(email, password, displayName)

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return result
      }

      setLoading(false)
      return result
    } catch (error) {
      setError('An unexpected error occurred')
      setLoading(false)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Sign in
  const signIn = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)

    try {
      // Try stored credentials first, then regular Firebase Auth
      const result = await AuthService.signInWithStoredCredentials(email, password)

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return result
      }

      setLoading(false)
      return result
    } catch (error) {
      setError('An unexpected error occurred')
      setLoading(false)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await AuthService.signOut()

      if (!result.success) {
        setError(result.error)
      }

      setLoading(false)
      return result
    } catch (error) {
      setError('An unexpected error occurred')
      setLoading(false)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Send password reset
  const sendPasswordReset = useCallback(async (email) => {
    setError(null)

    try {
      const result = await AuthService.sendPasswordReset(email)

      if (!result.success) {
        setError(result.error)
      }

      return result
    } catch (error) {
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Resend email verification
  const resendEmailVerification = useCallback(async () => {
    setError(null)

    try {
      const result = await AuthService.resendEmailVerification()

      if (!result.success) {
        setError(result.error)
      }

      return result
    } catch (error) {
      setError('An unexpected error occurred')
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    resendEmailVerification,
    clearError,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  }
}
