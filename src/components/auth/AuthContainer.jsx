import React, { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import ForgotPasswordForm from './ForgotPasswordForm'
import { useAuth } from '../../hooks/useAuth'

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState('login') // 'login', 'signup', 'forgot-password'
  const { signIn, signUp, sendPasswordReset, loading, error, clearError } = useAuth()

  const handleLogin = async (email, password) => {
    clearError()
    const result = await signIn(email, password)
    return result
  }

  const handleSignup = async (email, password, displayName) => {
    clearError()
    const result = await signUp(email, password, displayName)
    
    if (result.success) {
      // Show success message and switch to login
      alert(result.message)
      setCurrentView('login')
    }
    
    return result
  }

  const handleForgotPassword = async (email) => {
    clearError()
    const result = await sendPasswordReset(email)
    return result
  }

  const switchToLogin = () => {
    clearError()
    setCurrentView('login')
  }

  const switchToSignup = () => {
    clearError()
    setCurrentView('signup')
  }

  const switchToForgotPassword = () => {
    clearError()
    setCurrentView('forgot-password')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* App Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Manager</h1>
          <p className="text-gray-600">Manage your tasks efficiently</p>
        </div>

        {/* Auth Forms */}
        {currentView === 'login' && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToSignup={switchToSignup}
            onSwitchToForgotPassword={switchToForgotPassword}
            loading={loading}
            error={error}
          />
        )}

        {currentView === 'signup' && (
          <SignupForm
            onSignup={handleSignup}
            onSwitchToLogin={switchToLogin}
            loading={loading}
            error={error}
          />
        )}

        {currentView === 'forgot-password' && (
          <ForgotPasswordForm
            onSendReset={handleForgotPassword}
            onSwitchToLogin={switchToLogin}
            loading={loading}
            error={error}
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Task Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthContainer
