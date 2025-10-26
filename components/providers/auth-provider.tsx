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
      // Only redirect to role-specific dashboard for non-admin users
      if (user.role === 'admin') {
        // Admin users can navigate freely - redirect to home page
        router.push('/')
      } else {
        const dashboardPath = user.role === 'casting_director' 
          ? '/casting/dashboard' 
          : `/${user.role}/dashboard`
        router.push(dashboardPath)
      }
    }
  }, [user, pathname, router, isHydrated])

  // Install a global fetch interceptor to handle 401s (expired sessions)
  useEffect(() => {
    if (!isHydrated) return
    if (typeof window === 'undefined') return
    const w = window as any
    if (w.__castingFetchPatched) return

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        // Preserve a clone for potential retry when input is a Request
        let requestClone: Request | null = null
        let url: string
        if (typeof input === 'string') {
          url = input
        } else if (input instanceof URL) {
          url = input.toString()
        } else if (typeof Request !== 'undefined' && input instanceof Request) {
          try {
            requestClone = input.clone()
          } catch {}
          url = input.url
        } else {
          url = ''
        }

        const isAbsolute = /^https?:\/\//i.test(url)
        const sameOrigin = !isAbsolute || url.startsWith(window.location.origin)
        const path = isAbsolute ? url.replace(window.location.origin, '') : url
        const isAuthEndpoint = path.startsWith('/api/auth/login') ||
                               path.startsWith('/api/auth/mfa') ||
                               path.startsWith('/api/auth/password-reset') ||
                               path.startsWith('/api/auth/dev') ||
                               path.startsWith('/api/dev')

        const resp = await originalFetch(input as any, init as any)
        if (resp.status !== 401 || !sameOrigin || isAuthEndpoint) {
          return resp
        }

        // Try to refresh tokens if possible (Dailey Core auth)
        try {
          const refreshed = await useAuthStore.getState().refreshTokens()
          if (refreshed) {
            const newToken = useAuthStore.getState().token
            if (typeof input === 'string' || input instanceof URL) {
              const headers = new Headers(init?.headers as any)
              headers.set('Authorization', `Bearer ${newToken}`)
              const retryInit: RequestInit = { ...init, headers }
              return await originalFetch(input as any, retryInit)
            } else if (requestClone) {
              const method = requestClone.method || 'GET'
              const headers = new Headers(requestClone.headers)
              headers.set('Authorization', `Bearer ${newToken}`)
              let body: BodyInit | undefined = undefined
              if (method !== 'GET' && method !== 'HEAD') {
                try {
                  // Rebuild body from the clone
                  const blob = await requestClone.blob()
                  body = blob
                } catch {}
              }
              const retryInit: RequestInit = {
                method,
                headers,
                body,
                credentials: (requestClone.credentials as RequestCredentials) || undefined,
                cache: (requestClone.cache as RequestCache) || undefined,
                redirect: (requestClone.redirect as RequestRedirect) || undefined,
                referrer: requestClone.referrer || undefined,
                referrerPolicy: (requestClone.referrerPolicy as ReferrerPolicy) || undefined,
                mode: (requestClone.mode as RequestMode) || undefined,
                integrity: requestClone.integrity || undefined,
                keepalive: requestClone.keepalive || undefined,
                signal: requestClone.signal || undefined,
              }
              return await originalFetch(requestClone.url, retryInit)
            }
          }
        } catch {}

        // If refresh failed or we couldn't retry, logout and redirect to login with message
        try {
          await useAuthStore.getState().logout()
        } catch {}
        try {
          sessionStorage.setItem('sessionExpired', '1')
        } catch {}

        if (!window.location.pathname.startsWith('/login')) {
          const loginUrl = new URL('/login', window.location.origin)
          loginUrl.searchParams.set('reason', 'session_expired')
          if (window.location.pathname) {
            loginUrl.searchParams.set('from', window.location.pathname)
          }
          window.location.href = loginUrl.toString()
        }

        return resp
      } catch (e) {
        // On any unexpected error, fall back to the original fetch
        return originalFetch(input as any, init as any)
      }
    }

    w.__castingFetchPatched = true
  }, [isHydrated])

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
