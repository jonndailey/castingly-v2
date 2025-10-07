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
          'flex-1 pb-20 md:pb-0 min-h-screen', // Padding bottom for mobile nav, min-height for proper layout
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
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
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
      'px-4 sm:px-6 lg:px-8 py-6',
      'max-w-7xl mx-auto',
      className
    )}>
      {children}
    </div>
  )
}