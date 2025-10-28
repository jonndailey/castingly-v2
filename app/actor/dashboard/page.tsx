'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Calendar,
  TrendingUp,
  Video,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  User,
  FileText,
  Camera
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileAvatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'
import { useActorProfile } from '@/lib/hooks/useActorData'

// Mock data for demo
const stats = {
  profileViews: 247,
  submissions: 12,
  callbacks: 3,
  bookings: 1
}

const upcomingAuditions = [
  {
    id: '1',
    project: 'Summer Blockbuster',
    role: 'Lead Scientist',
    date: new Date(Date.now() + 86400000 * 2), // 2 days from now
    time: '2:00 PM',
    type: 'In-Person',
    location: 'Warner Bros Studio',
    status: 'confirmed'
  },
  {
    id: '2',
    project: 'Indie Drama',
    role: 'Supporting Role',
    date: new Date(Date.now() + 86400000 * 5), // 5 days from now
    time: '10:00 AM',
    type: 'Self-Tape',
    location: 'Remote',
    status: 'pending'
  }
]

const recentSubmissions = [
  {
    id: '1',
    project: 'Netflix Series',
    role: 'Detective',
    submittedAt: new Date(Date.now() - 86400000),
    status: 'viewed'
  },
  {
    id: '2',
    project: 'Commercial',
    role: 'Dad',
    submittedAt: new Date(Date.now() - 86400000 * 2),
    status: 'pending'
  },
  {
    id: '3',
    project: 'Feature Film',
    role: 'Best Friend',
    submittedAt: new Date(Date.now() - 86400000 * 3),
    status: 'callback'
  }
]

export default function ActorDashboard() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const { profile, loading, error } = useActorProfile(user?.id)
  const [localAvatar, setLocalAvatar] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [hideCompletion, setHideCompletion] = React.useState<boolean>(false)

  useEffect(() => {
    if (profile?.preferences?.hideProfileCompletion) {
      setHideCompletion(true)
    }
  }, [profile?.preferences?.hideProfileCompletion])

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!user?.id || !token) return
      const actorIdForPatch = profile?.id
      if (!actorIdForPatch) return
      // Optimistic preview
      const preview = URL.createObjectURL(file)
      setLocalAvatar(preview)
      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name)
      form.append('category', 'headshot')
      const res = await fetch(`/api/media/actor/${encodeURIComponent(String(user.id))}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const j = await res.json().catch(() => ({}))
      const first = Array.isArray(j?.file) ? j.file[0] : j?.file || {}
      const url = first?.signed_url || first?.public_url || first?.url || first?.proxy_url || null
      if (url) {
        // Persist avatar_url
        await fetch(`/api/actors/${encodeURIComponent(String(actorIdForPatch))}/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile_image: url }),
        })
      }
    } catch (e) {
      // Reset optimistic preview on failure
      setLocalAvatar(null)
    }
  }
  
  useEffect(() => {
    if (!user || user.role !== 'actor') {
      router.push('/login')
    }
  }, [user, router])
  
  if (!user) return null
  
  if (loading) {
    return (
      <AppLayout>
        <PageContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </PageContent>
      </AppLayout>
    )
  }
  
  if (error || !profile) {
    return (
      <AppLayout>
        <PageContent>
          <div className="text-center text-red-600 p-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>Failed to load profile data</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </PageContent>
      </AppLayout>
    )
  }
  
  const profileCompletion = profile.profile_completion || 0
  const dismissCompletion = async () => {
    try {
      if (!user?.id) return
      await fetch(`/api/actors/${encodeURIComponent(String(user.id))}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(useAuthStore.getState().token ? { Authorization: `Bearer ${useAuthStore.getState().token}` } : {}),
        },
        body: JSON.stringify({ preferences: { hideProfileCompletion: true } }),
      })
      setHideCompletion(true)
    } catch {}
  }
  
  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user.name}!`}
        subtitle="Here's what's happening with your casting journey"
        actions={
          <Button
            onClick={() => router.push('/actor/profile')}
            variant="outline"
          >
            Complete Profile
          </Button>
        }
      />
      
      <PageContent>
        {/* Profile completion alert */}
        {profileCompletion < 100 && !hideCompletion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-teal-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        Your profile is {profileCompletion}% complete
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Complete your profile to increase your chances of being cast
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => router.push('/actor/profile')}
                      size="sm"
                      variant="default"
                      className="whitespace-nowrap"
                    >
                      Complete Now
                    </Button>
                    <Button onClick={dismissCompletion} size="sm" variant="ghost" className="whitespace-nowrap">Hide</Button>
                  </div>
                </div>
                <div className="mt-3 w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  <ProfileAvatar
                    editable
                    size="xl"
                    alt={profile.name}
                    // Prioritize a URL available immediately after login to avoid first-paint delay.
                    src={
                      localAvatar ||
                      (useAuthStore.getState().user?.avatar_url || undefined) ||
                      profile.avatar_url ||
                      `/api/media/avatar/safe/${encodeURIComponent(String(user?.id || ''))}`
                    }
                    fallback={profile.name}
                    onUpload={handleAvatarUpload}
                  />
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {profile.name}
                  </h3>
                  
                  {profile.bio && (
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                  
                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Skills & Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 6).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Physical Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {profile.height && (
                      <div>
                        <span className="text-gray-500">Height:</span>
                        <p className="font-medium">{profile.height}</p>
                      </div>
                    )}
                    {profile.eye_color && (
                      <div>
                        <span className="text-gray-500">Eyes:</span>
                        <p className="font-medium">{profile.eye_color}</p>
                      </div>
                    )}
                    {profile.hair_color && (
                      <div>
                        <span className="text-gray-500">Hair:</span>
                        <p className="font-medium">{profile.hair_color}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/actor/profile')}
                    >
                      Edit Profile
                    </Button>
                    {profile.resume_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(profile.resume_url!, '_blank')}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View Resume
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
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
                    <p className="text-sm text-gray-600">Profile Views</p>
                    <p className="text-2xl font-bold">{stats.profileViews}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% this week
                    </p>
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
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Submissions</p>
                    <p className="text-2xl font-bold">{stats.submissions}</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-teal-600" />
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
                    <p className="text-xs text-gray-500 mt-1">Awaiting</p>
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
                    <p className="text-xs text-gray-500 mt-1">This year</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Auditions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Upcoming Auditions</CardTitle>
                <CardDescription>Your scheduled auditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAuditions.map((audition) => (
                    <div
                      key={audition.id}
                      className="flex items-start gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{audition.project}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{audition.role}</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-gray-500">
                              <span className="flex items-center gap-1 truncate">
                                <Clock className="w-3 h-3" />
                                {audition.date.toLocaleDateString()} at {audition.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <Badge variant={audition.type === 'Self-Tape' ? 'secondary' : 'default'} size="sm">
                              {audition.type}
                            </Badge>
                            <Badge
                              variant={audition.status === 'confirmed' ? 'success' : 'warning'}
                              size="sm"
                            >
                              {audition.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={() => router.push('/actor/auditions')}
                    variant="ghost"
                    fullWidth
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    View All Auditions
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
                <CardDescription>Track your submission status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{submission.project}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{submission.role}</p>
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-1 truncate">
                          Submitted {submission.submittedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          submission.status === 'callback' ? 'success' :
                          submission.status === 'viewed' ? 'secondary' :
                          'outline'
                        }
                        size="sm"
                      >
                        {submission.status}
                      </Badge>
                    </div>
                  ))}
                  
                  <Button
                    onClick={() => router.push('/actor/submissions')}
                    variant="ghost"
                    fullWidth
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    View All Submissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <h2 className="text-lg font-heading font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => router.push('/actor/opportunities')}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Video className="w-6 h-6 mb-2" />
              <span>Browse Roles</span>
            </Button>
            <Button
              onClick={() => router.push('/actor/profile')}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Star className="w-6 h-6 mb-2" />
              <span>Update Profile</span>
            </Button>
            {/* Removed Upload Media shortcut; uploads are inline via camera icon/profile */}
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
