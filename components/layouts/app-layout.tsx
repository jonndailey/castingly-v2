'use client'

import React from 'react'
import { BottomNav, SideNav } from '@/components/navigation/bottom-nav'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <SideNav />
        
        {/* Main content */}
        <main className={cn(
          // Padding bottom for mobile nav (increased for better clearance), safe areas, prevent horizontal scroll, wrap long words
          'flex-1 pb-32 md:pb-0 min-h-screen safe-bottom overflow-x-hidden break-words',
          className
        )}>
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}

// Page header component for consistent page titles
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  actions 
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-600 truncate">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">{actions}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Content container for consistent padding
interface PageContentProps {
  children: React.ReactNode
  className?: string
}

export const PageContent: React.FC<PageContentProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      'container-mobile py-5 sm:py-6',
      className
    )}>
      {children}
    </div>
  )
}
