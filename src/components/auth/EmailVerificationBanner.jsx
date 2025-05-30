import React, { useState } from 'react'
import { FaEnvelope, FaTimes, FaExclamationTriangle } from 'react-icons/fa'

const EmailVerificationBanner = ({ user, onResendVerification, onSignOut }) => {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [isDismissed, setIsDismissed] = useState(false)

  const handleResendVerification = async () => {
    setIsResending(true)
    setMessage('')
    
    try {
      const result = await onResendVerification()
      
      if (result.success) {
        setMessage('Verification email sent! Please check your inbox.')
      } else {
        setMessage(result.error || 'Failed to send verification email.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    await onSignOut()
  }

  if (isDismissed || user?.emailVerified) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Email Verification Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please verify your email address to access all features. 
                  We sent a verification email to <strong>{user?.email}</strong>
                </p>
                {message && (
                  <p className={`mt-2 ${message.includes('sent') ? 'text-green-700' : 'text-red-700'}`}>
                    {message}
                  </p>
                )}
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-800"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FaEnvelope className="w-4 h-4" />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsDismissed(true)}
                className="text-yellow-400 hover:text-yellow-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationBanner
