'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useAuthStore from '@/lib/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
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
      await login(email, password)
      
      // Get the user from the store to determine their role
      const { user } = useAuthStore.getState()
      if (user) {
        let dashboardPath: string
        if (user.role === 'casting_director') {
          dashboardPath = '/casting/dashboard'
        } else if (user.role === 'admin') {
          dashboardPath = '/admin'
        } else {
          dashboardPath = `/${user.role}/dashboard`
        }
        router.push(dashboardPath)
      }
    } catch (err) {
      // Error is handled by the store
    }
  }
  
  // Demo login function
  const demoLogin = async (role: 'actor' | 'agent' | 'casting_director' | 'admin') => {
    const demoAccounts = {
      actor: { email: 'danactor', password: 'dailey123' },
      agent: { email: 'christineagent', password: 'dailey123' },
      casting_director: { email: 'jonnydirector', password: 'dailey123' },
      admin: { email: 'admin', password: 'admin123' }
    }
    
    const account = demoAccounts[role]
    setEmail(account.email)
    setPassword(account.password)
    
    // Auto-submit after a short delay
    setTimeout(() => {
      document.getElementById('login-form')?.requestSubmit()
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
              <h1 className="text-4xl font-heading font-bold gradient-text">
                Castingly
              </h1>
            </Link>
            <p className="mt-2 text-gray-600">Welcome back</p>
          </div>
          
          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
            <Input
              type="text"
              label="Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationErrors.email}
              icon={<User className="w-4 h-4" />}
              placeholder="e.g., danactor"
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
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
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
          
          {/* Demo accounts */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4">
              Try a demo account
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => demoLogin('actor')}
                variant="outline"
                size="sm"
              >
                Actor
              </Button>
              <Button
                onClick={() => demoLogin('agent')}
                variant="outline"
                size="sm"
              >
                Agent
              </Button>
              <Button
                onClick={() => demoLogin('casting_director')}
                variant="outline"
                size="sm"
              >
                Director
              </Button>
              <Button
                onClick={() => demoLogin('admin')}
                variant="outline"
                size="sm"
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              >
                🛡️ Admin
              </Button>
            </div>
          </div>
          
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