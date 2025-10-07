'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import useAuthStore from '@/lib/store/auth-store'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/about',
  '/contact'
]

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate the auth state from localStorage
  useEffect(() => {
    // This ensures the component has access to localStorage
    setIsHydrated(true)
  }, [])

  // Handle route protection
  useEffect(() => {
    if (!isHydrated) return

    const isPublicRoute = publicRoutes.some(route => pathname === route)
    
    if (!user && !isPublicRoute) {
      // User is not logged in and trying to access a protected route
      router.push('/login')
    } else if (user && (pathname === '/login' || pathname === '/register')) {
      // User is logged in but trying to access auth pages
      const dashboardPath = user.role === 'casting_director' 
        ? '/casting/dashboard' 
        : `/${user.role}/dashboard`
      router.push(dashboardPath)
    }
  }, [user, pathname, router, isHydrated])

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook to ensure auth is loaded before using
export function useAuth() {
  const { user, token, login, logout, updateUser } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if we have hydrated from localStorage
    setIsReady(true)
  }, [])

  return {
    user,
    token,
    login,
    logout,
    updateUser,
    isReady,
    isAuthenticated: !!user
  }
}