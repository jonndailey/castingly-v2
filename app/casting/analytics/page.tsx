'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  Users,
  Calendar,
  Award,
  Eye,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/lib/store/auth-store'

// Mock analytics data
const analyticsData = {
  overview: {
    totalProjects: 8,
    activeProjects: 3,
    totalRoles: 187,
    rolesFilled: 142,
    submissionsReceived: 4890,
    auditionsScheduled: 234,
    successfulBookings: 89,
    avgTimeToFill: 12 // days
  },
  recentActivity: [
    { action: 'Callback scheduled', actor: 'Marcus Johnson', project: 'Shadow Protocol', time: '2 hours ago' },
    { action: 'Offer extended', actor: 'Maya Patel', project: 'Shadow Protocol', time: '4 hours ago' },
    { action: 'Submission reviewed', actor: 'Elena Rodriguez', project: 'The Last Resort', time: '6 hours ago' }
  ]
}

export default function CastingAnalytics() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  return (
    <AppLayout>
      <PageHeader
        title="Casting Analytics"
        subtitle="Track your casting performance and project insights"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="default">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold">{analyticsData.overview.activeProjects}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Roles Filled</p>
                  <p className="text-2xl font-bold text-green-600">{analyticsData.overview.rolesFilled}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-purple-600">{analyticsData.overview.submissionsReceived}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {((analyticsData.overview.successfulBookings / analyticsData.overview.submissionsReceived) * 100).toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Casting Progress</CardTitle>
              <CardDescription>Roles filled over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Progress chart would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Project Distribution</CardTitle>
              <CardDescription>Breakdown by project type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Distribution chart would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest casting actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.actor} - {activity.project}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </AppLayout>
  )
}