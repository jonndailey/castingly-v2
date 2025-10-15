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
  
  // Development mode - role switching
  devMode: boolean
  originalUser: User | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
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

// Demo users for development with password
const DEMO_PASSWORDS: Record<string, string> = {
  'danactor': 'dailey123',
  'christineagent': 'dailey123',
  'jonnydirector': 'dailey123',
  'admin': 'admin123'
}

const DEMO_USERS: Record<string, User> = {
  'danactor': {
    id: '1',
    email: 'danactor',
    name: 'Dan Actor',
    role: 'actor',
    avatar_url: 'https://ui-avatars.com/api/?name=Dan+Actor&background=9C27B0&color=fff',
    email_verified: true
  },
  'christineagent': {
    id: '2',
    email: 'christineagent',
    name: 'Christine Agent',
    role: 'agent',
    avatar_url: 'https://ui-avatars.com/api/?name=Christine+Agent&background=009688&color=fff',
    email_verified: true
  },
  'jonnydirector': {
    id: '3',
    email: 'jonnydirector',
    name: 'Jonny Director',
    role: 'casting_director',
    avatar_url: 'https://ui-avatars.com/api/?name=Jonny+Director&background=FF5722&color=fff',
    email_verified: true
  },
  'admin': {
    id: '4',
    email: 'admin',
    name: 'Admin User',
    role: 'admin',
    avatar_url: 'https://ui-avatars.com/api/?name=Admin+User&background=DC2626&color=fff',
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
      devMode: process.env.NODE_ENV === 'development',
      originalUser: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
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
            // Try demo users if API fails
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
              return;
            }
            
            // No demo user found, show API error
            set({ 
              error: data.error || 'Invalid username or password', 
              isLoading: false 
            })
            throw new Error(data.error || 'Invalid credentials')
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
            await daileyCoreAuth.logout(refreshToken)
            console.log('🎭 Logged out from Dailey Core')
          } catch (error) {
            console.error('🎭 Logout error:', error)
          }
        }
        
        set({ 
          user: null, 
          token: null,
          refreshToken: null,
          authSource: null,
          originalUser: null,
          error: null 
        })
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
