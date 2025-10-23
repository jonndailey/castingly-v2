'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useAuthStore from '@/lib/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { login, completeMfa, pendingMfa, clearPendingMfa, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [devUsers, setDevUsers] = useState<Array<{ id: string; name: string; email: string; avatar_url: string; role: string }>>([])
  const [showDevUsers, setShowDevUsers] = useState(false)
  const [devLoading, setDevLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [mfaCode, setMfaCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const isMfaStep = Boolean(pendingMfa)

  useEffect(() => {
    if (pendingMfa) {
      clearError()
      setValidationErrors({})
      setMfaCode('')
      setBackupCode('')
      setUseBackupCode(false)
    }
  }, [pendingMfa, clearError])

  // Load quick test users (development only)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    let cancelled = false
    ;(async () => {
      try {
        setDevLoading(true)
        const res = await fetch('/api/dev/test-users')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setDevUsers(data.users || [])
      } finally {
        setDevLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const routeToDashboard = () => {
    const { user } = useAuthStore.getState()
    if (user) {
      let dashboardPath: string
      if (user.role === 'casting_director') {
        dashboardPath = '/casting/dashboard'
      } else if (user.role === 'admin') {
        dashboardPath = '/admin'
      } else if (user.role === 'investor') {
        // Investors should go to actor dashboard for now
        dashboardPath = '/actor/dashboard'
      } else {
        dashboardPath = `/${user.role}/dashboard`
      }
      router.push(dashboardPath)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationErrors({})
    
    // Basic validation
    const errors: Record<string, string> = {}
    if (!email) errors.email = 'Username is required'
    if (!password) errors.password = 'Password is required'
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    try {
      // For demo, accept any email/password
      // In production, this would call the real API
      const result = await login(email, password)

      if (result?.mfaRequired) {
        return
      }

      routeToDashboard()
    } catch (err) {
      // Error is handled by the store
    }
  }

  const handleDevImpersonate = async (userEmail: string) => {
    try {
      const res = await fetch('/api/auth/dev/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      if (!res.ok) return
      // trigger route based on updated store after auth-store consumes response
      const data = await res.json()
      useAuthStore.setState({
        user: data.user,
        token: data.token,
        refreshToken: null,
        authSource: 'demo',
        originalUser: data.user,
        isLoading: false,
        error: null,
      })
      routeToDashboard()
    } catch (e) {
      // ignore for dev tool
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingMfa) return

    clearError()
    setValidationErrors({})

    if (!useBackupCode && !mfaCode) {
      setValidationErrors({ mfa: 'Authentication code is required' })
      return
    }

    if (useBackupCode && !backupCode) {
      setValidationErrors({ backup: 'Backup code is required' })
      return
    }

    try {
      await completeMfa({
        code: useBackupCode ? undefined : mfaCode,
        backupCode: useBackupCode ? backupCode : undefined
      })
      routeToDashboard()
    } catch (err) {
      // Error is handled by the store
    }
  }

  const handleCancelMfa = () => {
    clearPendingMfa()
    setMfaCode('')
    setBackupCode('')
    setUseBackupCode(false)
    setValidationErrors({})
    clearError()
  }

  // Demo login function
  const demoLogin = async (role: 'actor' | 'agent' | 'casting_director' | 'admin') => {
    const demoAccounts = {
      actor: { email: 'jackfdfnnelly@gmail.com', password: 'demo123' },
      agent: { email: 'super.agent@castingly.com', password: 'demo123' },
      casting_director: { email: 'indie.casting@castingly.com', password: 'demo123' },
      admin: { email: 'admin@dailey.cloud', password: 'demo123' }
    }
    
    const account = demoAccounts[role]
    setEmail(account.email)
    setPassword(account.password)
    
    // Auto-submit after a short delay
    setTimeout(() => {
      const form = document.getElementById('login-form') as HTMLFormElement | null
      form?.requestSubmit()
    }, 500)
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src="/favicon-32x32.png" alt="DAILEY CORE" className="w-8 h-8" />
                <h1 className="text-4xl font-heading font-bold gradient-text">
                  Castingly
                </h1>
              </div>
            </Link>
            <p className="mt-2 text-gray-600">Welcome back</p>
            <p className="text-xs text-gray-500 mt-1">Powered by DAILEY CORE</p>
          </div>
          
          {isMfaStep ? (
            <motion.div
              key="mfa-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Step Verification</h2>
                <p className="text-gray-600">
                  Enter the {useBackupCode ? 'backup code' : '6-digit code'} for{' '}
                  <span className="font-medium text-gray-900">{pendingMfa?.user.email}</span>
                </p>
              </div>

              <form id="mfa-form" onSubmit={handleMfaSubmit} className="space-y-6">
                {useBackupCode ? (
                  <Input
                    type="text"
                    label="Backup Code"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    error={validationErrors.backup}
                    placeholder="ABCD-EFGH"
                    autoComplete="off"
                  />
                ) : (
                  <Input
                    type="text"
                    label="Authentication Code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\s+/g, ''))}
                    error={validationErrors.mfa}
                    placeholder="123456"
                    autoComplete="one-time-code"
                  />
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode((prev) => !prev)
                      setValidationErrors({})
                      clearError()
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {useBackupCode ? 'Use authenticator code' : 'Use a backup code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelMfa}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Switch account
                  </button>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Verify & Continue
                </Button>
              </form>
            </motion.div>
          ) : (
            <>
              {/* Quick Test Users (Development only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Quick Test Users (Real Accounts)</p>
                    <button
                      type="button"
                      onClick={() => setShowDevUsers((v) => !v)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      {showDevUsers ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showDevUsers && (
                    <div className="border border-gray-200 rounded-lg p-2 max-h-72 overflow-y-auto bg-white">
                      {devLoading && (
                        <div className="text-xs text-gray-500 p-2">Loading users…</div>
                      )}
                      {!devLoading && devUsers.length === 0 && (
                        <div className="text-xs text-gray-500 p-2">No users found</div>
                      )}
                      <div className="grid grid-cols-1 gap-1">
                        {devUsers.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setEmail(u.email)
                              setPassword('demo123')
                              // Optionally impersonate directly
                              handleDevImpersonate(u.email)
                            }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 text-left"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={u.avatar_url}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form id="login-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
                <Input
                  type="text"
                  label="Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={validationErrors.email}
                  icon={<User className="w-4 h-4" />}
                  placeholder="e.g., jackfdfnnelly@gmail.com"
                  autoComplete="username"
                  required={false}
                />

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={validationErrors.password}
                    icon={<Lock className="w-4 h-4" />}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (<EyeOff className="w-4 h-4" />) : (<Eye className="w-4 h-4" />)}
                  </button>
                </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-2"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Sign In
                </Button>
              </form>

              {/* Demo accounts (explicitly gated for investor demos) */}
              {process.env.NEXT_PUBLIC_ENABLE_INVESTOR_DEMO === 'true' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    Try a demo account
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => demoLogin('actor')} variant="outline" size="sm">Actor</Button>
                    <Button onClick={() => demoLogin('agent')} variant="outline" size="sm">Agent</Button>
                    <Button onClick={() => demoLogin('casting_director')} variant="outline" size="sm">Casting Director</Button>
                    <Button onClick={() => demoLogin('admin')} variant="outline" size="sm" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">🛡️ Admin</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sign up link */}

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right side - Image/Graphics */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-teal-600">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white text-center">
              <h2 className="text-4xl font-heading font-bold mb-4">
                Welcome to the Future of Casting
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Connect with talent, streamline auditions, and cast your next project with ease.
              </p>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-6 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span>🎬</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Video Reviews</h3>
                    <p className="text-sm text-white/80">Swipe through auditions quickly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span>🎭</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Smart Matching</h3>
                    <p className="text-sm text-white/80">Find perfect fits with AI</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span>📱</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Mobile First</h3>
                    <p className="text-sm text-white/80">Work from anywhere</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span>🔒</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Secure</h3>
                    <p className="text-sm text-white/80">Industry-standard security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
