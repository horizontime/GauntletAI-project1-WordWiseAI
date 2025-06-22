import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

export function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDemoArrow, setShowDemoArrow] = useState(false)

  const { signIn, signUp } = useAuthStore()
  const location = useLocation()

  // Check if user came from landing page with demo intent
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('demo') === 'true') {
      setShowDemoArrow(true)
    }
  }, [location])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WordWise AI
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Write with confidence. Edit with intelligence.</p>
        </div>

        <div className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="p-6 space-y-1 pb-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {isSignIn ? 'Sign in to your account' : 'Create your account'}
              </h2>
            </div>
          </div>
          <div className="p-6 pt-0 space-y-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 h-12 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 h-12 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isSignIn && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 h-12 border border-gray-200 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {isSignIn && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                <span>{isSignIn ? 'Sign in' : 'Sign up'}</span>
                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social login buttons placeholder */}
            <div className="grid grid-cols-2 gap-3">
              <button className="h-12 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button className="h-12 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isSignIn ? "Don't have an account? " : "Already have an account? "}
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
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {isSignIn ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-block w-full">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full h-12 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  Try demo (no account)
                </button>
                
                {/* Animated arrow */}
                {showDemoArrow && (
                  <div
                    className="absolute -left-20 top-1/2 -translate-y-1/2 text-blue-600"
                    style={{
                      animation: 'slideLeftRight 1s ease-in-out infinite'
                    }}
                  >
                    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="w-16 h-10">
                      <path 
                        d="M5 20 L45 20 M45 20 L35 10 M45 20 L35 30" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 