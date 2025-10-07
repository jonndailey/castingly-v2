'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users,
  TrendingUp,
  Calendar,
  Star,
  Send,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Plus,
  Activity
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock data
const stats = {
  totalTalent: 24,
  activeSubmissions: 18,
  callbacks: 7,
  bookings: 3,
  monthlyEarnings: 45000
}

const roster = [
  {
    id: '1',
    name: 'Sarah Johnson',
    image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=9C27B0&color=fff',
    type: 'Lead',
    activeProjects: 3,
    lastBooked: new Date(Date.now() - 86400000 * 10),
    status: 'available',
    rating: 4.8
  },
  {
    id: '2',
    name: 'Michael Chen',
    image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=009688&color=fff',
    type: 'Character',
    activeProjects: 2,
    lastBooked: new Date(Date.now() - 86400000 * 5),
    status: 'on-set',
    rating: 4.9
  },
  {
    id: '3',
    name: 'Emma Davis',
    image: 'https://ui-avatars.com/api/?name=Emma+Davis&background=FF5722&color=fff',
    type: 'Supporting',
    activeProjects: 1,
    lastBooked: new Date(Date.now() - 86400000 * 30),
    status: 'available',
    rating: 4.6
  },
  {
    id: '4',
    name: 'James Wilson',
    image: 'https://ui-avatars.com/api/?name=James+Wilson&background=2196F3&color=fff',
    type: 'Lead',
    activeProjects: 4,
    lastBooked: new Date(Date.now() - 86400000 * 2),
    status: 'callback',
    rating: 4.7
  }
]

const recentActivity = [
  {
    id: '1',
    type: 'callback',
    actor: 'Sarah Johnson',
    project: 'Summer Blockbuster',
    role: 'Lead Scientist',
    time: new Date(Date.now() - 3600000)
  },
  {
    id: '2',
    type: 'submission',
    actor: 'Michael Chen',
    project: 'Netflix Series',
    role: 'Detective',
    time: new Date(Date.now() - 7200000)
  },
  {
    id: '3',
    type: 'booking',
    actor: 'James Wilson',
    project: 'Commercial',
    role: 'Principal',
    time: new Date(Date.now() - 10800000)
  },
  {
    id: '4',
    type: 'submission',
    actor: 'Emma Davis',
    project: 'Indie Drama',
    role: 'Supporting',
    time: new Date(Date.now() - 14400000)
  }
]

const opportunities = [
  {
    id: '1',
    project: 'HBO Drama Series',
    role: 'Series Regular',
    type: 'TV Series',
    deadline: new Date(Date.now() + 86400000 * 3),
    matchingTalent: 8
  },
  {
    id: '2',
    project: 'National Commercial',
    role: 'Principal',
    type: 'Commercial',
    deadline: new Date(Date.now() + 86400000 * 1),
    matchingTalent: 12
  },
  {
    id: '3',
    project: 'Feature Film',
    role: 'Supporting Lead',
    type: 'Film',
    deadline: new Date(Date.now() + 86400000 * 7),
    matchingTalent: 5
  }
]

export default function AgentDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  useEffect(() => {
    if (!user || user.role !== 'agent') {
      router.push('/login')
    }
  }, [user, router])
  
  if (!user) return null
  
  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user.name}!`}
        subtitle="Manage your talent roster and track submissions"
        actions={
          <Button
            onClick={() => router.push('/agent/talent/add')}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Talent
          </Button>
        }
      />
      
      <PageContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Talent</p>
                    <p className="text-2xl font-bold">{stats.totalTalent}</p>
                    <p className="text-xs text-gray-500 mt-1">Active roster</p>
                  </div>
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Submissions</p>
                    <p className="text-2xl font-bold">{stats.activeSubmissions}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +15%
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Send className="w-5 h-5 text-purple-600" />
                  </div>
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Callbacks</p>
                    <p className="text-2xl font-bold">{stats.callbacks}</p>
                    <p className="text-xs text-gray-500 mt-1">This week</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="text-2xl font-bold">{stats.bookings}</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Earnings</p>
                    <p className="text-2xl font-bold">${(stats.monthlyEarnings / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Talent Roster */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="md:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Talent Roster</CardTitle>
                <CardDescription>Your represented talent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {roster.map((talent) => (
                    <div
                      key={talent.id}
                      onClick={() => router.push(`/agent/talent/${talent.id}`)}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      <Avatar
                        src={talent.image}
                        alt={talent.name}
                        fallback={talent.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{talent.name}</p>
                            <p className="text-sm text-gray-600">{talent.type} Actor</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600">{talent.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                • {talent.activeProjects} active
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              talent.status === 'available' ? 'success' :
                              talent.status === 'on-set' ? 'warning' :
                              talent.status === 'callback' ? 'secondary' :
                              'outline'
                            }
                            size="sm"
                          >
                            {talent.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={() => router.push('/agent/talent')}
                  variant="ghost"
                  fullWidth
                  className="mt-4"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  View All Talent
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        activity.type === 'callback' && 'bg-orange-100',
                        activity.type === 'submission' && 'bg-purple-100',
                        activity.type === 'booking' && 'bg-green-100'
                      )}>
                        {activity.type === 'callback' && (
                          <Calendar className="w-4 h-4 text-orange-600" />
                        )}
                        {activity.type === 'submission' && (
                          <Send className="w-4 h-4 text-purple-600" />
                        )}
                        {activity.type === 'booking' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.actor}</span>
                          {activity.type === 'callback' && ' got a callback for '}
                          {activity.type === 'submission' && ' was submitted for '}
                          {activity.type === 'booking' && ' booked '}
                          <span className="text-gray-600">{activity.role}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.project} • {activity.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={() => router.push('/agent/activity')}
                  variant="ghost"
                  fullWidth
                  className="mt-4"
                  icon={<Activity className="w-4 h-4" />}
                  iconPosition="right"
                >
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>New Opportunities</CardTitle>
              <CardDescription>Projects looking for talent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{opp.project}</p>
                      <p className="text-sm text-gray-600">{opp.role} • {opp.type}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          Deadline: {opp.deadline.toLocaleDateString()}
                        </span>
                        <Badge variant="success" size="sm">
                          {opp.matchingTalent} matches
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/agent/opportunities/${opp.id}`)}
                      size="sm"
                    >
                      Submit Talent
                    </Button>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={() => router.push('/agent/opportunities')}
                variant="ghost"
                fullWidth
                className="mt-4"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Browse All Opportunities
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <h2 className="text-lg font-heading font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => router.push('/agent/talent/add')}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Plus className="w-6 h-6 mb-2" />
              <span>Add Talent</span>
            </Button>
            <Button
              onClick={() => router.push('/agent/submissions/new')}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Send className="w-6 h-6 mb-2" />
              <span>New Submission</span>
            </Button>
            <Button
              onClick={() => router.push('/agent/schedule')}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Calendar className="w-6 h-6 mb-2" />
              <span>Schedule</span>
            </Button>
            <Button
              onClick={() => router.push('/messages')}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <CheckCircle className="w-6 h-6 mb-2" />
              <span>Messages</span>
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </AppLayout>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}