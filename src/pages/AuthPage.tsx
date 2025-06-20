import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signIn, signUp } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!isSignIn && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (isSignIn) {
      const result = await signIn(email, password)
      if (result.error) {
        setError(result.error)
      }
    } else {
      const result = await signUp(email, password)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(result.success)
      } else {
        setSuccess('Account created successfully!')
      }
    }

    setLoading(false)
  }

  // Handle demo (anonymous) login so users can try the app without creating an account
  const handleDemoLogin = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // 1. Attempt to sign in with a pre-created demo account (recommended if it exists)
      const { error: pwError } = await supabase.auth.signInWithPassword({
        email: 'demo@wordwise.ai',
        password: 'Demo123!'
      })

      if (pwError) {
        // 2. Fallback to anonymous sign-in (requires Anonymous Sign-Ins enabled)
        const { error: anonError } = await supabase.auth.signInAnonymously()
        if (anonError) {
          setError(anonError.message)
        }
      }
      // On success, the global auth listener will redirect the user
    } catch {
      setError('Unable to start demo session. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur py-4 px-6 sm:px-10 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-2xl font-bold text-primary-600">WordWise AI</h1>
        <Link
          to="/"
          className="inline-block rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Welcome page
        </Link>
      </header>

      {/* Auth Form Container */}
      <main className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-100 via-white to-white">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-gray-900 mb-2">
              WordWise AI
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Write with confidence. Edit with intelligence.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block w-3/4 mx-auto text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-3/4 mx-auto px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block w-3/4 mx-auto text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 appearance-none relative block w-3/4 mx-auto px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>

              {!isSignIn && (
                <div>
                  <label htmlFor="confirmPassword" className="block w-3/4 mx-auto text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 appearance-none relative block w-3/4 mx-auto px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm text-center">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-3/4 mx-auto flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                {isSignIn ? 'Sign in' : 'Sign up'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignIn(!isSignIn)
                  setError('')
                  setSuccess('')
                  setEmail('')
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                {isSignIn 
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </button>
            </div>

            {/* Demo login button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="mt-4 group relative w-3/4 mx-auto flex justify-center py-2 px-4 border border-primary-600 text-sm font-medium rounded-md text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Try demo (no account)
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
} 