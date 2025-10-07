'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, 
  Database, 
  Activity, 
  Settings,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Clock,
  Shield,
  FileImage,
  Mail,
  Key
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/lib/store/auth-store'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalActors: number
  totalMedia: number
  recentLogins: number
  passwordResets: number
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const adminCards = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: 'System Analytics',
      description: 'View platform usage and performance metrics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'bg-green-500',
    },
    {
      title: 'Password Resets',
      description: 'Monitor and manage password reset requests',
      icon: Key,
      href: '/admin/password-resets',
      color: 'bg-yellow-500',
    },
    {
      title: 'Media Management',
      description: 'Manage uploaded images and files',
      icon: FileImage,
      href: '/admin/media',
      color: 'bg-purple-500',
    },
    {
      title: 'System Health',
      description: 'Monitor system status and performance',
      icon: Activity,
      href: '/admin/system',
      color: 'bg-red-500',
    },
    {
      title: 'Settings',
      description: 'Configure platform settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || user?.email}
              </span>
              <Link href="/actor/dashboard">
                <Button
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Switch to Regular View
                </Button>
              </Link>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? '...' : stats?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <UserCheck className="w-8 h-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? '...' : stats?.activeUsers || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Actors</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? '...' : stats?.totalActors || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileImage className="w-8 h-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Media Files</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? '...' : stats?.totalMedia || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Recent Logins</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? '...' : stats?.recentLogins || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Key className="w-8 h-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Password Resets</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? '...' : stats?.passwordResets || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Modules */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminCards.map((card, index) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={card.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                          <card.icon className="w-5 h-5 text-white" />
                        </div>
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{card.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/users?filter=recent">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Recent Users
                </Button>
              </Link>
              <Link href="/admin/password-resets?status=pending">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Pending Resets
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/admin/system">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  System Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}