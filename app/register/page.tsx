'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useAuthStore, { UserRole } from '@/lib/store/auth-store'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'actor' as UserRole
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationErrors({})
    
    // Validation
    const errors: Record<string, string> = {}
    if (!formData.name) errors.name = 'Name is required'
    if (!formData.email) errors.email = 'Email is required'
    if (!formData.password) errors.password = 'Password is required'
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role
      })
      
      // Redirect based on role
      router.push(`/${formData.role === 'casting_director' ? 'casting' : formData.role}/dashboard`)
    } catch (err) {
      // Error is handled by the store
    }
  }
  
  const roleOptions = [
    {
      value: 'actor' as UserRole,
      label: 'Actor',
      description: 'Showcase your talent and find roles',
      icon: '🎭',
      color: 'from-purple-500 to-purple-600'
    },
    {
      value: 'agent' as UserRole,
      label: 'Agent',
      description: 'Manage and promote your talent roster',
      icon: '💼',
      color: 'from-teal-500 to-teal-600'
    },
    {
      value: 'casting_director' as UserRole,
      label: 'Casting Director',
      description: 'Find perfect talent for your projects',
      icon: '🎬',
      color: 'from-orange-500 to-orange-600'
    }
  ]
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Register form */}
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
            <p className="mt-2 text-gray-600">Create your account</p>
          </div>
          
          {/* Role selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a...
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, role: option.value })}
                  className={cn(
                    'relative p-3 rounded-lg border-2 transition-all',
                    formData.role === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <p className="text-sm font-medium">{option.label}</p>
                  {formData.role === option.value && (
                    <motion.div
                      layoutId="role-indicator"
                      className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none"
                    />
                  )}
                </button>
              ))}
            </div>
            {formData.role && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-gray-600 text-center"
              >
                {roleOptions.find(r => r.value === formData.role)?.description}
              </motion.p>
            )}
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={validationErrors.name}
              icon={<User className="w-4 h-4" />}
              placeholder="John Doe"
              autoComplete="name"
            />
            
            <Input
              type="email"
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={validationErrors.email}
              icon={<Mail className="w-4 h-4" />}
              placeholder="your@email.com"
              autoComplete="email"
            />
            
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={validationErrors.password}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Create a password"
                autoComplete="new-password"
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
            
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={validationErrors.confirmPassword}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
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
            
            <div className="flex items-start">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                required
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Create Account
            </Button>
          </form>
          
          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right side - Image/Graphics */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br',
          formData.role === 'actor' ? 'from-purple-600 to-purple-700' :
          formData.role === 'agent' ? 'from-teal-600 to-teal-700' :
          'from-orange-600 to-orange-700'
        )}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-white text-center">
              <motion.div
                key={formData.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-6xl mb-6">
                  {roleOptions.find(r => r.value === formData.role)?.icon}
                </div>
                <h2 className="text-4xl font-heading font-bold mb-4">
                  {formData.role === 'actor' && 'Your Stage Awaits'}
                  {formData.role === 'agent' && 'Empower Your Talent'}
                  {formData.role === 'casting_director' && 'Find Your Stars'}
                </h2>
                <p className="text-xl text-white/90 mb-8 max-w-md mx-auto">
                  {formData.role === 'actor' && 'Join thousands of actors showcasing their talent and landing their dream roles.'}
                  {formData.role === 'agent' && 'Manage your roster, submit talent, and grow careers with powerful tools.'}
                  {formData.role === 'casting_director' && 'Streamline your casting process and discover amazing talent effortlessly.'}
                </p>
              </motion.div>
              
              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto mt-8">
                {formData.role === 'actor' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span>📸</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Professional Profile</h3>
                        <p className="text-sm text-white/80">Showcase headshots, reels, and resume</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span>🎯</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Smart Matching</h3>
                        <p className="text-sm text-white/80">Get matched with perfect roles</p>
                      </div>
                    </div>
                  </>
                )}
                {formData.role === 'agent' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span>👥</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Roster Management</h3>
                        <p className="text-sm text-white/80">Organize and promote your talent</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span>📊</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Track Success</h3>
                        <p className="text-sm text-white/80">Monitor submissions and bookings</p>
                      </div>
                    </div>
                  </>
                )}
                {formData.role === 'casting_director' && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span>⚡</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Fast Review</h3>
                        <p className="text-sm text-white/80">Swipe through submissions quickly</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span>🔍</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Advanced Filters</h3>
                        <p className="text-sm text-white/80">Find exactly what you need</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}