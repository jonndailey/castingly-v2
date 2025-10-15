'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart,
  UserCheck,
  UserPlus,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  userGrowth: {
    totalUsers: number
    newUsersThisWeek: number
    newUsersLastWeek: number
    newUsersThisMonth: number
    newUsersLastMonth: number
    growthRate: number
  }
  userActivity: {
    activeToday: number
    activeThisWeek: number
    activeThisMonth: number
    averageSessionTime: string
    totalSessions: number
  }
  userDistribution: {
    actors: number
    agents: number
    castingDirectors: number
    admins: number
  }
  engagement: {
    profileViews: number
    submissions: number
    messages: number
    logins: number
  }
  topContent: {
    mostViewedProfiles: Array<{
      id: number
      name: string
      views: number
      role: string
    }>
    mostActiveUsers: Array<{
      id: number
      name: string
      lastLogin: string
      activityScore: number
    }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {Math.abs(rate).toFixed(1)}%
      </div>
    )
  }

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      default: return 'Last 30 Days'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Analytics</h1>
            <p className="text-gray-600">Platform usage and performance metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <Button
              onClick={fetchAnalytics}
              variant="outline"
              size="sm"
            >
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.userGrowth.totalUsers.toLocaleString() || '0'}
                    </p>
                    <div className="mt-1">
                      {data && formatGrowthRate(data.userGrowth.growthRate)}
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.userActivity.activeThisMonth.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{getTimeframeLabel()}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.userGrowth.newUsersThisMonth.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.userActivity.totalSessions.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Avg: {data?.userActivity.averageSessionTime || '0m'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                User Distribution by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.userDistribution && Object.entries(data.userDistribution).map(([role, count]) => {
                  const total = Object.values(data.userDistribution).reduce((a, b) => a + b, 0)
                  const percentage = ((count / total) * 100).toFixed(1)
                  const roleColors: Record<string, string> = {
                    actors: 'bg-blue-500',
                    agents: 'bg-green-500',
                    castingDirectors: 'bg-purple-500',
                    admins: 'bg-red-500'
                  }
                  
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${roleColors[role]}`}></div>
                        <span className="font-medium capitalize">
                          {role.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{count.toLocaleString()}</span>
                        <span className="text-gray-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Platform Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.engagement && Object.entries(data.engagement).map(([metric, value]) => {
                  const metricIcons: Record<string, any> = {
                    profileViews: Eye,
                    submissions: BarChart3,
                    messages: Activity,
                    logins: UserCheck
                  }
                  const Icon = metricIcons[metric]
                  
                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="font-medium capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className="font-bold">{value.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Viewed Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topContent.mostViewedProfiles?.length ? (
                  data.topContent.mostViewedProfiles.map((profile, index) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{profile.name}</p>
                          <p className="text-sm text-gray-600 capitalize">{profile.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{profile.views.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">views</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Most Active Users */}
          <Card>
            <CardHeader>
              <CardTitle>Most Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topContent.mostActiveUsers?.length ? (
                  data.topContent.mostActiveUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">Last login: {user.lastLogin}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{user.activityScore}</p>
                        <p className="text-xs text-gray-500">activity</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
