import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { login } from '../api/auth'

/**
 * Authentication form component with multi-step login flow.
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.setAuthenticated - Callback to set authentication status
 * @param {Object} props.credentials - Current credentials {username, password}
 * @param {Function} props.setCredentials - Callback to update credentials
 * @returns {JSX.Element} Authentication form with username/password steps
 */
export default function AuthForm({ setAuthenticated, credentials, setCredentials }) {
  const [step, setStep] = useState(1) // 1 = username step, 2 = password step
  const [isLoading, setIsLoading] = useState(false)
  const [loadingDots, setLoadingDots] = useState('.') // For loading animation

  /**
   * Animation effect for loading dots during authentication
   */
  useEffect(() => {
    let interval
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '') return '.'
          if (prev === '.') return '..'
          if (prev === '..') return '...'
          return ''
        })
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  /**
   * Handles form submission for authentication
   * @async
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await login(credentials)
      if (response.success) {
        // Store session data in memory (not persistent)
        sessionStorage.setItem('authCookies', JSON.stringify(response.cookies))
        sessionStorage.setItem('username', credentials.username)
        setAuthenticated(true)
        toast.success('Login successful')
      }
    } catch (error) {
      // Handle specific error messages with appropriate user feedback
      if (error.message.includes('Username does not exist')) {
        toast.error('Username does not exist', {
          toastId: 'username-error' // Prevent duplicate toasts
        })
        setStep(1) // Reset to username step
      } else if (error.message.includes('Invalid password')) {
        toast.error('Invalid password. Please try again.', {
          toastId: 'password-error'
        })
      } else {
        toast.error(error.message || 'Login failed. Please check your credentials.', {
          toastId: 'generic-error'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">University Portal Login</h1>
        
        {step === 1 ? (
          // Username step
          <div>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                University Username
              </label>
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!credentials.username.trim()) {
                  toast.error('Please enter your username')
                  return
                }
                setStep(2)
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        ) : (
          // Password step
          <div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password for {credentials.username}
              </label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-pulse">
                    Logging in{loadingDots}
                  </span>
                ) : 'Login'}
              </button>
            </div>
          </div>
        )}
        {/* Privacy disclaimer */}
        <p className="text-[11px] text-gray-500 mt-4 text-justify">
          Your credentials are stored in memory only for the duration of this session and are not persisted on disk or sent to any server. They are used solely for the purpose of scraping your grades from the university portal.
        </p>
      </form>
    </div>
  )
}