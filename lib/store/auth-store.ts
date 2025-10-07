import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'actor' | 'agent' | 'casting_director' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  email_verified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  
  // Development mode - role switching
  devMode: boolean
  originalUser: User | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  switchRole: (role: UserRole) => void
  toggleDevMode: () => void
  clearError: () => void
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
      isLoading: false,
      error: null,
      devMode: process.env.NODE_ENV === 'development',
      originalUser: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // First try the real API
          console.log('Attempting login for:', email)
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          console.log('API Response status:', response.status)
          const data = await response.json()
          console.log('API Response data:', data)
          
          if (!response.ok) {
            // First try demo users if API fails
            const demoUser = DEMO_USERS[email]
            const demoPassword = DEMO_PASSWORDS[email]
            
            if (demoUser && demoPassword === password) {
              // Demo login successful
              const token = 'demo-token-' + Date.now()
              
              set({ 
                user: demoUser, 
                token, 
                isLoading: false,
                originalUser: demoUser
              })
              return; // Early return for demo users
            }
            
            // If not a demo user and API failed, show the API error
            set({ 
              error: data.error || 'Invalid username or password', 
              isLoading: false 
            })
            throw new Error(data.error || 'Invalid credentials')
          }
          
          if (response.ok) {
            // Successful API login
            set({ 
              user: data.user, 
              token: data.token, 
              isLoading: false,
              originalUser: data.user
            })
          }
        } catch (error: any) {
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

      logout: () => {
        set({ 
          user: null, 
          token: null, 
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
    }),
    {
      name: 'castingly-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        devMode: state.devMode 
      }),
    }
  )
)

export default useAuthStore