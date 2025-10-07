'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  Search, 
  PlusCircle, 
  MessageCircle, 
  User,
  Briefcase,
  Users,
  Film,
  Grid3X3,
  Video,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useAuthStore from '@/lib/store/auth-store'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: Array<'actor' | 'agent' | 'casting_director'>
}

// Navigation items for different user roles
const actorNavItems: NavItem[] = [
  {
    label: 'Home',
    href: '/actor/dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Browse',
    href: '/actor/opportunities',
    icon: <Search className="w-5 h-5" />,
  },
  {
    label: 'Submit',
    href: '/actor/submit',
    icon: <PlusCircle className="w-5 h-5" />,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    label: 'Profile',
    href: '/actor/profile',
    icon: <User className="w-5 h-5" />,
  },
]

const agentNavItems: NavItem[] = [
  {
    label: 'Home',
    href: '/agent/dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Roster',
    href: '/agent/roster',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Submit',
    href: '/agent/submissions',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    label: 'Profile',
    href: '/agent/profile',
    icon: <User className="w-5 h-5" />,
  },
]

const castingDirectorNavItems: NavItem[] = [
  {
    label: 'Home',
    href: '/casting/dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Projects',
    href: '/casting/projects',
    icon: <Film className="w-5 h-5" />,
  },
  {
    label: 'Submissions',
    href: '/casting/submissions',
    icon: <Video className="w-5 h-5" />,
  },
  {
    label: 'Talent',
    href: '/casting/talent',
    icon: <Grid3X3 className="w-5 h-5" />,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: <MessageCircle className="w-5 h-5" />,
  },
]

export const BottomNav: React.FC = () => {
  const pathname = usePathname()
  const { user } = useAuthStore()
  
  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user) return []
    
    switch (user.role) {
      case 'actor':
        return actorNavItems
      case 'agent':
        return agentNavItems
      case 'casting_director':
        return castingDirectorNavItems
      default:
        return []
    }
  }
  
  const navItems = getNavItems()
  
  // Don't show on non-authenticated pages
  if (!user || pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-bottom">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-h-[56px] rounded-lg transition-colors relative',
                'text-gray-600 hover:text-primary-600 hover:bg-primary-50',
                isActive && 'text-primary-600 bg-primary-50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              
              <div className="relative">
                {item.icon}
                {item.label === 'Messages' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Desktop sidebar navigation
export const SideNav: React.FC = () => {
  const pathname = usePathname()
  const { user, devMode, switchRole, logout } = useAuthStore()
  
  const getNavItems = () => {
    if (!user) return []
    
    switch (user.role) {
      case 'actor':
        return actorNavItems
      case 'agent':
        return agentNavItems
      case 'casting_director':
        return castingDirectorNavItems
      default:
        return []
    }
  }
  
  const navItems = getNavItems()
  
  if (!user || pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null
  }
  
  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 min-h-full">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto min-h-full">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-heading font-bold gradient-text">
              Castingly
            </h1>
          </div>
          
          {/* Dev mode role switcher */}
          {devMode && (
            <div className="mt-5 px-4">
              <select
                value={user.role}
                onChange={(e) => switchRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-purple-50 text-purple-700 text-sm"
              >
                <option value="actor">👤 Actor View</option>
                <option value="agent">💼 Agent View</option>
                <option value="casting_director">🎬 CD View</option>
              </select>
            </div>
          )}
          
          {/* Test user quick switcher */}
          {devMode && user.role === 'actor' && (
            <div className="mt-3 px-4">
              <label className="text-xs text-gray-500 font-medium">Quick Test Users (4+ images)</label>
              <select
                defaultValue=""
                onChange={async (e) => {
                  if (e.target.value) {
                    const [email, password] = e.target.value.split('|')
                    // Auto-login to selected test user
                    try {
                      // Use the auth store's login method
                      const { login } = useAuthStore.getState()
                      await login(email, password)
                      // Refresh the page to load new user data
                      window.location.href = '/actor/profile'
                    } catch (error) {
                      console.error('Failed to switch user:', error)
                      alert('Failed to switch user. Please check the console.')
                    }
                  }
                }}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
              >
                <option value="">Select test user...</option>
                <option value="tjeantaylor@yahoo.com|changeme123">📸 Tina Taylor (15 photos)</option>
                <option value="dondogar@yahoo.com|changeme123">📸 Dondo Hemen (14 photos)</option>
                <option value="talentrubystarss@gmail.com|changeme123">📸 Judith Ingram (13 photos)</option>
                <option value="vladalexandrovamericandream@gmail.com|changeme123">📸 Vlad Alexandrov (12 photos)</option>
                <option value="jldrisk@protonmail.com|changeme123">📸 Kellynn Skell (12 photos)</option>
                <option value="fspringer3@gmail.com|changeme123">📸 Frederick Springer (11 photos)</option>
                <option value="prettypj2024@gmail.com|changeme123">📸 Jasmin Jhamb (11 photos)</option>
                <option value="haamiimali@gmail.com|changeme123">📸 HaaMiim Ali (11 photos)</option>
                <option value="ravikr@yopmail.com|changeme123">📸 Ravi Impinge (10 photos)</option>
                <option value="therealpopeye145@gmail.com|changeme123">📸 Roger Smith (10 photos)</option>
                <option value="ellewootsionn@gmail.com|changeme123">📸 Elle E (4 photos)</option>
                <option value="magjofogu@gmail.com|changeme123">📸 Johanna Forero (6 photos)</option>
              </select>
            </div>
          )}
          
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span className={cn(
                    'mr-3',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                  
                  {item.label === 'Messages' && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      3
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* User profile section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}