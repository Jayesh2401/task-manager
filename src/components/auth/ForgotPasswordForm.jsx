import React, { useState } from 'react'
import { FaEnvelope, FaArrowLeft, FaKey, FaCheckCircle } from 'react-icons/fa'

const ForgotPasswordForm = ({ onSendReset, onSwitchToLogin, loading, error }) => {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    
    setEmailError('')
    return true
  }

  const handleEmailChange = (value) => {
    setEmail(value)
    if (emailError) {
      setEmailError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateEmail()) {
      return
    }

    const result = await onSendReset(email.trim())
    
    if (result.success) {
      setIsEmailSent(true)
      setSuccessMessage(result.message)
    }
  }

  const handleResendEmail = async () => {
    const result = await onSendReset(email.trim())
    
    if (result.success) {
      setSuccessMessage('Password reset email sent again!')
    }
  }

  if (isEmailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600 mt-2">We've sent password reset instructions to</p>
            <p className="text-blue-600 font-medium">{email}</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the reset link in the email</li>
              <li>Create a new password</li>
              <li>Sign in with your new password</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <FaEnvelope className="w-4 h-4" />
                  <span>Resend Email</span>
                </>
              )}
            </button>

            <button
              onClick={onSwitchToLogin}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <FaKey className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-600 mt-2">Enter your email to receive reset instructions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending reset email...</span>
              </>
            ) : (
              <>
                <FaEnvelope className="w-4 h-4" />
                <span>Send Reset Email</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-2 mx-auto"
            disabled={loading}
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordForm
