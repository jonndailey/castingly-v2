'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  MapPin,
  Film,
  Tv,
  Theater,
  Mic,
  Video,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  Filter,
  Download
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock submissions data
const submissions = [
  {
    id: '1',
    project: 'Breaking Chains',
    role: 'Daniel',
    type: 'Film',
    submittedAt: new Date(Date.now() - 86400000 * 2),
    status: 'viewed',
    viewedAt: new Date(Date.now() - 86400000),
    materials: ['Self-tape', 'Resume', 'Headshot'],
    castingDirector: 'Sarah Mitchell',
    location: 'Los Angeles, CA',
    shootDates: 'March 15 - April 30, 2024',
    feedback: null,
    rating: null
  },
  {
    id: '2',
    project: 'City Lights Season 2',
    role: 'Detective Marcus',
    type: 'TV Series',
    submittedAt: new Date(Date.now() - 86400000 * 5),
    status: 'callback',
    viewedAt: new Date(Date.now() - 86400000 * 3),
    materials: ['Self-tape', 'Resume', 'Headshot', 'Reel'],
    castingDirector: 'Michael Chen',
    location: 'Atlanta, GA',
    shootDates: 'February - June 2024',
    callbackDate: new Date(Date.now() + 86400000 * 3),
    feedback: 'Great energy! Looking forward to seeing more.',
    rating: 4
  },
  {
    id: '3',
    project: 'Nike - Just Do It Campaign',
    role: 'Basketball Player',
    type: 'Commercial',
    submittedAt: new Date(Date.now() - 86400000),
    status: 'submitted',
    viewedAt: null,
    materials: ['Self-tape', 'Athletic Photos'],
    castingDirector: 'Jennifer Woods',
    location: 'Miami, FL',
    shootDates: 'January 20-22, 2024',
    feedback: null,
    rating: null
  },
  {
    id: '4',
    project: 'Hamlet',
    role: 'Laertes',
    type: 'Theater',
    submittedAt: new Date(Date.now() - 86400000 * 10),
    status: 'rejected',
    viewedAt: new Date(Date.now() - 86400000 * 8),
    materials: ['Monologue Video', 'Resume'],
    castingDirector: 'Robert Hayes',
    location: 'New York, NY',
    shootDates: 'May - August 2024',
    feedback: 'Strong audition but went with someone with more classical experience.',
    rating: 3
  },
  {
    id: '5',
    project: 'Indie Horror Film',
    role: 'Supporting Lead',
    type: 'Film',
    submittedAt: new Date(Date.now() - 86400000 * 7),
    status: 'booked',
    viewedAt: new Date(Date.now() - 86400000 * 6),
    materials: ['Self-tape', 'Resume', 'Headshot'],
    castingDirector: 'Amy Rodriguez',
    location: 'Austin, TX',
    shootDates: 'February 5-20, 2024',
    feedback: 'Perfect for the role! Contract coming soon.',
    rating: 5
  }
]

const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'secondary',
    icon: <Clock className="w-4 h-4" />,
    description: 'Your submission is awaiting review'
  },
  viewed: {
    label: 'Viewed',
    color: 'warning',
    icon: <Eye className="w-4 h-4" />,
    description: 'Casting has reviewed your submission'
  },
  callback: {
    label: 'Callback!',
    color: 'success',
    icon: <Star className="w-4 h-4" />,
    description: 'You\'ve been invited for a callback'
  },
  rejected: {
    label: 'Not Selected',
    color: 'error',
    icon: <XCircle className="w-4 h-4" />,
    description: 'Not selected for this role'
  },
  booked: {
    label: 'Booked!',
    color: 'success',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Congratulations! You got the role'
  }
}

export default function ActorSubmissions() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    callbacks: submissions.filter(s => s.status === 'callback').length,
    booked: submissions.filter(s => s.status === 'booked').length
  }
  
  const filteredSubmissions = filterStatus === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filterStatus)
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Film': return <Film className="w-4 h-4" />
      case 'TV Series': return <Tv className="w-4 h-4" />
      case 'Commercial': return <Mic className="w-4 h-4" />
      case 'Theater': return <Theater className="w-4 h-4" />
      default: return <Film className="w-4 h-4" />
    }
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="My Submissions"
        subtitle="Track your audition submissions and responses"
        actions={
          <Button
            onClick={() => router.push('/actor/opportunities')}
            variant="outline"
          >
            Browse Opportunities
          </Button>
        }
      />
      
      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
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
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
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
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
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
                    <p className="text-sm text-gray-600">Booked</p>
                    <p className="text-2xl font-bold">{stats.booked}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              onClick={() => setFilterStatus('all')}
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All ({submissions.length})
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = submissions.filter(s => s.status === status).length
              return (
                <Button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                >
                  {config.icon}
                  <span className="ml-2">{config.label} ({count})</span>
                </Button>
              )
            })}
          </div>
        </div>
        
        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.map((submission, index) => {
            const status = statusConfig[submission.status as keyof typeof statusConfig]
            
            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={status.color as any}>
                                <span className="flex items-center gap-1">
                                  {status.icon}
                                  {status.label}
                                </span>
                              </Badge>
                              <span className="flex items-center gap-1 text-sm text-gray-500">
                                {getTypeIcon(submission.type)}
                                {submission.type}
                              </span>
                            </div>
                            <h3 className="text-xl font-heading font-semibold">
                              {submission.project}
                            </h3>
                            <p className="text-gray-600">
                              Role: {submission.role} • CD: {submission.castingDirector}
                            </p>
                          </div>
                          {submission.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < submission.rating
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Timeline */}
                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted {submission.submittedAt.toLocaleDateString()}
                          </div>
                          {submission.viewedAt && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              Viewed {submission.viewedAt.toLocaleDateString()}
                            </div>
                          )}
                          {submission.callbackDate && (
                            <div className="flex items-center gap-1 text-purple-600 font-medium">
                              <Calendar className="w-4 h-4" />
                              Callback {submission.callbackDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        {/* Location and Dates */}
                        <div className="flex flex-wrap gap-4 mb-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {submission.location}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {submission.shootDates}
                          </div>
                        </div>
                        
                        {/* Materials */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {submission.materials.map((material) => (
                            <Badge key={material} variant="outline" size="sm">
                              {material}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Feedback */}
                        {submission.feedback && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                  Feedback from {submission.castingDirector}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {submission.feedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex md:flex-col gap-2">
                        <Button
                          onClick={() => setSelectedSubmission(submission.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          View Tape
                        </Button>
                        {submission.status === 'callback' && (
                          <Button
                            onClick={() => router.push(`/actor/auditions?id=${submission.id}`)}
                            variant="default"
                            size="sm"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        )}
                        {submission.status === 'booked' && (
                          <Button
                            onClick={() => {}}
                            variant="success"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Contract
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No submissions found
            </h3>
            <p className="text-gray-600 mb-4">
              {filterStatus === 'all' 
                ? "You haven't submitted for any roles yet"
                : `No ${statusConfig[filterStatus as keyof typeof statusConfig].label.toLowerCase()} submissions`}
            </p>
            <Button
              onClick={() => router.push('/actor/opportunities')}
              variant="default"
            >
              Browse Opportunities
            </Button>
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}