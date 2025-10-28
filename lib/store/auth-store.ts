import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'

export type UserRole = 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  email_verified: boolean
  forum_display_name?: string | null
  forum_signature?: string | null
  is_verified_professional?: boolean
  is_investor?: boolean
  forum_last_seen_at?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  authSource: 'dailey-core' | 'legacy' | 'demo' | null
  isLoading: boolean
  error: string | null
  pendingMfa: PendingMfaChallenge | null
  
  // Development mode - role switching
  devMode: boolean
  originalUser: User | null
  
  // Actions
  login: (email: string, password: string) => Promise<{ mfaRequired: true } | void>
  completeMfa: (params: { code?: string; backupCode?: string }) => Promise<void>
  clearPendingMfa: () => void
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  switchRole: (role: UserRole) => void
  toggleDevMode: () => void
  clearError: () => void
  validateSession: () => Promise<boolean>
  refreshTokens: () => Promise<boolean>
}

interface RegisterData {
  email: string
  password: string
  name: string
  role: UserRole
}

interface PendingMfaChallenge {
  token: string
  challengeId?: string
  expiresAt: number
  type: string
  methods: string[]
  user: {
    id: string
    email: string
    name?: string
    email_verified?: boolean
  }
}

// Demo users for development with password - Real accounts from database
const DEMO_PASSWORDS: Record<string, string> = {
  'jackfdfnnelly@gmail.com': 'demo123',
  'super.agent@castingly.com': 'demo123',
  'indie.casting@castingly.com': 'demo123',
  'admin@dailey.cloud': 'demo123',
  'investor@castingly.com': 'demo123'
}

const DEMO_USERS: Record<string, User> = {
  'jackfdfnnelly@gmail.com': {
    id: '1',
    email: 'jackfdfnnelly@gmail.com',
    name: 'Jack Connelly',
    role: 'actor',
    avatar_url: 'https://ui-avatars.com/api/?name=Jack+Connelly&background=9C27B0&color=fff',
    email_verified: true
  },
  'super.agent@castingly.com': {
    id: '2',
    email: 'super.agent@castingly.com',
    name: 'Super Agent',
    role: 'agent',
    avatar_url: 'https://ui-avatars.com/api/?name=Super+Agent&background=009688&color=fff',
    email_verified: true
  },
  'indie.casting@castingly.com': {
    id: '3',
    email: 'indie.casting@castingly.com',
    name: 'Indie Casting Director',
    role: 'casting_director',
    avatar_url: 'https://ui-avatars.com/api/?name=Indie+Casting&background=FF5722&color=fff',
    email_verified: true
  },
  'admin@dailey.cloud': {
    id: '4',
    email: 'admin@dailey.cloud',
    name: 'Admin User',
    role: 'admin',
    avatar_url: 'https://ui-avatars.com/api/?name=Admin+User&background=DC2626&color=fff',
    email_verified: true
  },
  'investor@castingly.com': {
    id: '5',
    email: 'investor@castingly.com',
    name: 'Investor Demo',
    role: 'investor',
    avatar_url: 'https://ui-avatars.com/api/?name=Investor+Demo&background=4CAF50&color=fff',
    email_verified: true
  }
}

// Create the store
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      authSource: null,
      isLoading: false,
      error: null,
      pendingMfa: null,
      devMode: process.env.NODE_ENV === 'development',
      originalUser: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null, pendingMfa: null })
        
        try {
          console.log('🎭 Castingly Login Attempt:', email)
          
          // First try the API (which handles both Dailey Core and legacy auth)
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          const data = await response.json()
          console.log('🎭 API Response:', { status: response.status, source: data.source })
          
          if (!response.ok) {
            // In production, do NOT allow demo fallback unless explicitly enabled
            const enableDemoFallback = (
              process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === 'true' ||
              process.env.NODE_ENV !== 'production' ||
              (typeof window !== 'undefined' && /(^localhost:|127\.0\.0\.1|dev\.|staging\.)/i.test(window.location.host))
            )

            if (enableDemoFallback) {
              const demoUser = DEMO_USERS[email]
              const demoPassword = DEMO_PASSWORDS[email]
              if (demoUser && demoPassword === password) {
                console.log('🎭 Demo login successful:', email)
                const token = 'demo-token-' + Date.now()
                set({ 
                  user: demoUser, 
                  token, 
                  refreshToken: null,
                  authSource: 'demo',
                  isLoading: false,
                  originalUser: demoUser
                })
                return
              }
            }

            // No demo user or not permitted; surface API error
            set({ 
              error: data.error || 'Invalid username or password', 
              isLoading: false 
            })
            throw new Error(data.error || 'Invalid credentials')
          }

          if (data.mfa_required) {
            const expiresIn = typeof data.challenge_expires_in === 'number' ? data.challenge_expires_in : 300
            set({
              pendingMfa: {
                token: data.challenge_token,
                challengeId: data.challenge_id,
                expiresAt: Date.now() + expiresIn * 1000,
                type: data.mfa_type || 'totp',
                methods: Array.isArray(data.methods) && data.methods.length > 0 ? data.methods : ['totp'],
                user: data.user
              },
              isLoading: false,
              error: null,
              user: null,
              token: null,
              refreshToken: null,
              originalUser: null,
              authSource: null
            })
            return { mfaRequired: true }
          }
          
          // Successful API login
          console.log('✅ Login successful via:', data.source)
          set({ 
            user: data.user, 
            token: data.token,
            refreshToken: data.refresh_token || null,
            authSource: data.source as 'dailey-core' | 'legacy',
            isLoading: false,
            originalUser: data.user
          })
          
        } catch (error: any) {
          console.error('❌ Login failed:', error)
          set({ 
            error: error.message || 'Login failed. Please try again.', 
            isLoading: false 
          })
          throw error
        }
      },

      completeMfa: async ({ code, backupCode }: { code?: string; backupCode?: string }) => {
        const { pendingMfa } = get()

        if (!pendingMfa) {
          throw new Error('No pending MFA challenge to complete')
        }

        if (!code && !backupCode) {
          set({ error: 'MFA code or backup code is required', isLoading: false })
          throw new Error('MFA code or backup code is required')
        }

        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/auth/mfa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: pendingMfa.token,
              code,
              backup_code: backupCode
            })
          })

          const data = await response.json()

          if (!response.ok) {
            set({
              error: data.error || 'Invalid MFA code',
              isLoading: false
            })
            throw new Error(data.error || 'Invalid MFA code')
          }

          console.log('✅ MFA completed; login finalized via:', data.source)

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refresh_token || null,
            authSource: data.source as 'dailey-core' | 'legacy',
            isLoading: false,
            pendingMfa: null,
            error: null,
            originalUser: data.user
          })
        } catch (error: any) {
          console.error('❌ MFA verification failed:', error)
          if (!error.message?.includes('Invalid MFA code')) {
            set({ isLoading: false })
          }
          throw error
        }
      },

      clearPendingMfa: () => set({ pendingMfa: null }),

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
          const user: User = {
            id: Date.now().toString(),
            email: data.email,
            name: data.name,
            role: data.role,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=9C27B0&color=fff`,
            email_verified: false
          }
          
          const token = 'demo-token-' + Date.now()
          
          set({ 
            user, 
            token, 
            isLoading: false,
            originalUser: user
          })
        } catch (error: any) {
          set({ 
            error: 'Registration failed. Please try again.', 
            isLoading: false 
          })
          throw error
        }
      },

      logout: async () => {
        const { refreshToken, authSource } = get()
        
        // If using Dailey Core auth, logout from Dailey Core
        if (authSource === 'dailey-core' && refreshToken) {
          try {
            // Call our server route to avoid Core CORS in the browser
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            })
          } catch {
            // ignore network errors on logout
          }
        }
        
        set({ 
          user: null, 
          token: null,
          refreshToken: null,
          authSource: null,
          pendingMfa: null,
          originalUser: null,
          error: null 
        })

        // Hard clear persisted auth (all tabs) and transient flags
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('castingly-auth')
            sessionStorage.removeItem('sessionExpired')
            // Broadcast to other tabs to update immediately
            window.dispatchEvent(new StorageEvent('storage', { key: 'castingly-auth' }))
          }
        } catch {}
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },

      switchRole: (role: UserRole) => {
        const currentUser = get().user
        if (currentUser && get().devMode) {
          // Create a temporary user with the new role
          const tempUser: User = {
            ...currentUser,
            role,
            id: `${currentUser.id}-${role}`, // Unique ID for dev mode
          }
          set({ user: tempUser })
        }
      },

      toggleDevMode: () => {
        const { devMode, originalUser, user } = get()
        if (!devMode && user) {
          // Entering dev mode - save current user
          set({ devMode: true, originalUser: user })
        } else if (devMode && originalUser) {
          // Exiting dev mode - restore original user
          set({ devMode: false, user: originalUser, originalUser: null })
        } else {
          set({ devMode: !devMode })
        }
      },

      clearError: () => set({ error: null }),

      validateSession: async (): Promise<boolean> => {
        const { token, authSource } = get()
        if (!token) return false

        // For demo tokens, always return true
        if (authSource === 'demo') return true
        
        // For legacy tokens, assume they're valid (they don't have server-side validation)
        if (authSource === 'legacy') return true

        // For Dailey Core tokens, validate with the server
        if (authSource === 'dailey-core') {
          try {
            const validation = await daileyCoreAuth.validateToken(token)
            if (validation?.valid) {
              // Update user data if it changed
              const castinglyUser = daileyCoreAuth.mapToCastinglyUser(validation.user)
              set({ user: castinglyUser })
              return true
            }
          } catch (error) {
            console.error('🎭 Session validation failed:', error)
          }
          
          // Try to refresh the token
          return await get().refreshTokens()
        }

        return false
      },

      refreshTokens: async (): Promise<boolean> => {
        const { refreshToken, authSource } = get()
        
        if (authSource !== 'dailey-core' || !refreshToken) {
          return false
        }

        try {
          const refreshResult = await daileyCoreAuth.refreshToken(refreshToken)
          if (refreshResult) {
            const castinglyUser = daileyCoreAuth.mapToCastinglyUser(refreshResult.user)
            set({
              user: castinglyUser,
              token: refreshResult.access_token,
              refreshToken: refreshResult.refresh_token
            })
            console.log('🎭 Tokens refreshed successfully')
            return true
          }
        } catch (error) {
          console.error('🎭 Token refresh failed:', error)
        }

        // Refresh failed, logout user
        await get().logout()
        return false
      },
    }),
    {
      name: 'castingly-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        refreshToken: state.refreshToken,
        authSource: state.authSource,
        devMode: state.devMode 
      }),
    }
  )
)

export default useAuthStore
