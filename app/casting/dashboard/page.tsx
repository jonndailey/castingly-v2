'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Film,
  Users,
  Calendar,
  PlayCircle,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import VideoReview from '@/components/video/video-review'
import useAuthStore from '@/lib/store/auth-store'

// Mock data
const stats = {
  activeProjects: 3,
  totalSubmissions: 247,
  pendingReviews: 42,
  callbacks: 18
}

const projects = [
  {
    id: '1',
    title: 'Summer Blockbuster',
    type: 'Feature Film',
    status: 'casting',
    roles: 12,
    submissions: 89,
    deadline: new Date(Date.now() + 86400000 * 7),
    image: 'https://ui-avatars.com/api/?name=Summer+Blockbuster&background=FF5722&color=fff'
  },
  {
    id: '2',
    title: 'Netflix Original Series',
    type: 'TV Series',
    status: 'callbacks',
    roles: 8,
    submissions: 156,
    deadline: new Date(Date.now() + 86400000 * 14),
    image: 'https://ui-avatars.com/api/?name=Netflix+Series&background=E50914&color=fff'
  },
  {
    id: '3',
    title: 'Indie Drama',
    type: 'Independent Film',
    status: 'pre-production',
    roles: 5,
    submissions: 34,
    deadline: new Date(Date.now() + 86400000 * 21),
    image: 'https://ui-avatars.com/api/?name=Indie+Drama&background=9C27B0&color=fff'
  }
]

const recentSubmissions = [
  {
    id: '1',
    actorName: 'Sarah Johnson',
    actorImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=9C27B0&color=fff',
    project: 'Summer Blockbuster',
    role: 'Lead Scientist',
    submittedAt: new Date(Date.now() - 3600000),
    videoUrl: 'sample-video-1.mp4',
    videoPlatform: 'upload' as const,
    hasVideo: true,
    rating: 4
  },
  {
    id: '2',
    actorName: 'Michael Chen',
    actorImage: 'https://ui-avatars.com/api/?name=Michael+Chen&background=009688&color=fff',
    project: 'Netflix Series',
    role: 'Detective',
    submittedAt: new Date(Date.now() - 7200000),
    videoUrl: 'https://youtube.com/watch?v=abc123',
    videoPlatform: 'youtube' as const,
    hasVideo: true,
    rating: 5
  },
  {
    id: '3',
    actorName: 'Emma Davis',
    actorImage: 'https://ui-avatars.com/api/?name=Emma+Davis&background=FF5722&color=fff',
    project: 'Indie Drama',
    role: 'Supporting Role',
    submittedAt: new Date(Date.now() - 10800000),
    videoUrl: 'sample-video-3.mp4',
    videoPlatform: 'upload' as const,
    hasVideo: true
  }
]

export default function CastingDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [showVideoReview, setShowVideoReview] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  
  useEffect(() => {
    if (!user || user.role !== 'casting_director') {
      router.push('/login')
    }
  }, [user, router])
  
  if (!user) return null
  
  const handleDecision = (submissionId: string, decision: 'callback' | 'pass' | 'maybe') => {
    console.log('Decision:', submissionId, decision)
  }
  
  const handleRating = (submissionId: string, rating: number) => {
    console.log('Rating:', submissionId, rating)
  }
  
  const handleNote = (submissionId: string, note: string) => {
    console.log('Note:', submissionId, note)
  }
  
  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user.name}!`}
        subtitle="Manage your casting projects and review submissions"
        actions={
          <Button
            onClick={() => router.push('/casting/projects/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        }
      />
      
      <PageContent>
        {/* Quick Review Section */}
        {stats.pendingReviews > 0 && !showVideoReview && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {stats.pendingReviews} submissions awaiting review
                      </p>
                      <p className="text-sm text-gray-600">
                        Quick review with swipe gestures - callback, pass, or maybe
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowVideoReview(true)}
                    variant="default"
                  >
                    Start Reviewing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Video Review Mode */}
        {showVideoReview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold">Quick Review Mode</h2>
              <Button
                onClick={() => setShowVideoReview(false)}
                variant="outline"
                size="sm"
              >
                Exit Review
              </Button>
            </div>
            <VideoReview
              submissions={recentSubmissions}
              onDecision={handleDecision}
              onRating={handleRating}
              onNote={handleNote}
            />
          </motion.div>
        ) : (
          <>
            {/* Stats Grid */}
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
                        <p className="text-sm text-gray-600">Active Projects</p>
                        <p className="text-2xl font-bold">{stats.activeProjects}</p>
                        <p className="text-xs text-gray-500 mt-1">In production</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Film className="w-5 h-5 text-orange-600" />
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
                        <p className="text-sm text-gray-600">Total Submissions</p>
                        <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +23% this week
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
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
                        <p className="text-sm text-gray-600">Pending Reviews</p>
                        <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                        <p className="text-xs text-yellow-600 mt-1">Needs attention</p>
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
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Callbacks</p>
                        <p className="text-2xl font-bold">{stats.callbacks}</p>
                        <p className="text-xs text-gray-500 mt-1">Scheduled</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* Projects and Submissions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Active Projects */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>Your current casting projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => router.push(`/casting/projects/${project.id}`)}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Avatar
                            src={project.image}
                            alt={project.title}
                            fallback={project.title}
                            size="md"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{project.title}</p>
                                <p className="text-sm text-gray-600">{project.type}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500">
                                    {project.roles} roles • {project.submissions} submissions
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  project.status === 'casting' ? 'default' :
                                  project.status === 'callbacks' ? 'warning' :
                                  'secondary'
                                }
                                size="sm"
                              >
                                {project.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Deadline: {project.deadline.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        onClick={() => router.push('/casting/projects')}
                        variant="ghost"
                        fullWidth
                        icon={<ArrowRight className="w-4 h-4" />}
                        iconPosition="right"
                      >
                        View All Projects
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Recent Submissions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                    <CardDescription>Latest actor submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentSubmissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <Avatar
                            src={submission.actorImage}
                            alt={submission.actorName}
                            fallback={submission.actorName}
                            size="sm"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{submission.actorName}</p>
                            <p className="text-sm text-gray-600">
                              {submission.role} • {submission.project}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {submission.submittedAt.toLocaleTimeString()}
                            </p>
                          </div>
                          {submission.hasVideo && (
                            <PlayCircle className="w-5 h-5 text-primary-600" />
                          )}
                          {submission.rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium">{submission.rating}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        onClick={() => setShowVideoReview(true)}
                        variant="ghost"
                        fullWidth
                        icon={<PlayCircle className="w-4 h-4" />}
                        iconPosition="right"
                      >
                        Review All Submissions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
        
        {/* Quick Actions */}
        {!showVideoReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <h2 className="text-lg font-heading font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={() => router.push('/casting/projects/new')}
                variant="outline"
                className="h-auto flex-col py-4"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span>New Project</span>
              </Button>
              <Button
                onClick={() => router.push('/casting/talent')}
                variant="outline"
                className="h-auto flex-col py-4"
              >
                <Search className="w-6 h-6 mb-2" />
                <span>Search Talent</span>
              </Button>
              <Button
                onClick={() => setShowVideoReview(true)}
                variant="outline"
                className="h-auto flex-col py-4"
              >
                <PlayCircle className="w-6 h-6 mb-2" />
                <span>Quick Review</span>
              </Button>
              <Button
                onClick={() => router.push('/casting/callbacks')}
                variant="outline"
                className="h-auto flex-col py-4"
              >
                <Calendar className="w-6 h-6 mb-2" />
                <span>Callbacks</span>
              </Button>
            </div>
          </motion.div>
        )}
      </PageContent>
    </AppLayout>
  )
}