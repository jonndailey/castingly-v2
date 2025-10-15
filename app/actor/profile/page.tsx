'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  Instagram,
  Twitter,
  Film,
  Award,
  Languages,
  Edit,
  Save,
  Upload,
  Plus,
  X,
  Check,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ForumActivityPanel } from '@/components/forum/forum-activity-panel'
import useAuthStore from '@/lib/store/auth-store'
import { useActorProfile } from '@/lib/hooks/useActorData'

// Mock data for the profile
const profileData = {
  basicInfo: {
    name: 'Dan Actor',
    email: 'danactor@email.com',
    phone: '(555) 123-4567',
    location: 'Los Angeles, CA',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    union: 'SAG-AFTRA',
    website: 'www.danactor.com',
    instagram: '@danactor',
    twitter: '@danactor'
  },
  physicalAttributes: {
    height: "5'10\"",
    weight: '165 lbs',
    hairColor: 'Brown',
    eyeColor: 'Blue',
    ethnicity: 'Caucasian',
    ageRange: '25-35'
  },
  bio: "Passionate and versatile actor with 8+ years of experience in film, television, and theater. Trained at the Lee Strasberg Theatre & Film Institute, I bring authenticity and depth to every role. Known for strong character work and ability to transform physically and emotionally for each project.",
  skills: [
    'Method Acting',
    'Improv',
    'Stage Combat',
    'Horseback Riding',
    'Basketball',
    'Guitar',
    'Spanish (Fluent)',
    'British Accent',
    'Southern Accent'
  ],
  training: [
    { institution: 'Lee Strasberg Theatre & Film Institute', year: '2016', focus: 'Method Acting' },
    { institution: 'Upright Citizens Brigade', year: '2017', focus: 'Improv Comedy' },
    { institution: 'Ivana Chubbuck Studio', year: '2018', focus: 'Scene Study' }
  ],
  experience: [
    { project: 'Breaking Shadows', type: 'Film', role: 'Lead', year: '2023' },
    { project: 'City Lights', type: 'TV Series', role: 'Recurring', year: '2022' },
    { project: 'Hamlet', type: 'Theater', role: 'Laertes', year: '2021' },
    { project: 'Nike Commercial', type: 'Commercial', role: 'Principal', year: '2023' }
  ],
  archetypes: ['Hero', 'Explorer', 'Rebel'],
  media: {
    headshots: ['/headshot1.jpg', '/headshot2.jpg', '/headshot3.jpg'],
    resume: '/resume.pdf',
    reels: ['Demo Reel 2023', 'Comedy Reel', 'Drama Reel']
  }
}

const archetypesList = [
  'Hero', 'Innocent', 'Explorer', 'Sage', 'Rebel', 'Lover',
  'Creator', 'Jester', 'Caregiver', 'Ruler', 'Magician', 'Regular Guy'
]

export default function ActorProfile() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { profile: actorData, loading, error } = useActorProfile(user?.id)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; index: number } | null>(null)
  const [imageGallery, setImageGallery] = useState<Array<{ src: string; alt: string }>>([])

  const headshots = (actorData?.media?.headshots ?? []).filter(
    (entry): entry is typeof entry & { media_url: string } =>
      typeof entry.media_url === 'string' && entry.media_url.length > 0
  )
  const headshotGallery = headshots.map((item, index) => ({
    src: `/api/media/images${item.media_url.replace('/downloaded_images', '')}`,
    alt: `Headshot ${index + 1}`
  }))
  const primaryHeadshot = headshots[0]
  const galleryMedia = (actorData?.media?.all ?? []).filter(
    (entry): entry is typeof entry & { media_url: string } =>
      entry.media_type === 'gallery' &&
      typeof entry.media_url === 'string' &&
      entry.media_url.length > 0
  )
  const galleryImages = galleryMedia.map((item, index) => ({
    src: `/api/media/images${item.media_url.replace('/downloaded_images', '')}`,
    alt: `Gallery ${index + 1}`
  }))
  
  const openImageModal = useCallback((src: string, alt: string, gallery: Array<{ src: string; alt: string }>, index: number) => {
    setImageGallery(gallery)
    setSelectedImage({ src, alt, index })
  }, [])
  
  const closeImageModal = useCallback(() => {
    setSelectedImage(null)
    setImageGallery([])
  }, [])
  
  const goToPreviousImage = useCallback(() => {
    if (selectedImage && selectedImage.index > 0) {
      const newIndex = selectedImage.index - 1
      setSelectedImage({
        src: imageGallery[newIndex].src,
        alt: imageGallery[newIndex].alt,
        index: newIndex
      })
    }
  }, [selectedImage, imageGallery])
  
  const goToNextImage = useCallback(() => {
    if (selectedImage && selectedImage.index < imageGallery.length - 1) {
      const newIndex = selectedImage.index + 1
      setSelectedImage({
        src: imageGallery[newIndex].src,
        alt: imageGallery[newIndex].alt,
        index: newIndex
      })
    }
  }, [selectedImage, imageGallery])
  
  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return
      
      switch (e.key) {
        case 'Escape':
          closeImageModal()
          break
        case 'ArrowLeft':
          goToPreviousImage()
          break
        case 'ArrowRight':
          goToNextImage()
          break
      }
    }
    
    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage, closeImageModal, goToNextImage, goToPreviousImage])
  
  // Generate a clean URL slug from the user's name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }
  
  const userSlug = actorData?.name ? generateSlug(actorData.name) : 'actor'
  const publicProfileUrl = `castingly.com/talent/${userSlug}`
  const fullPublicProfileUrl = `https://castingly.com/talent/${userSlug}`
  const localProfileUrl = `/talent/${userSlug}`
  
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
  
  if (error || !actorData) {
    return (
      <AppLayout>
        <PageContent>
          <div className="text-center text-red-600 p-8">
            <p>Failed to load profile data</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </PageContent>
      </AppLayout>
    )
  }
  
  const profileCompletion = actorData.profile_completion || 0
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'media', label: 'Media' },
    { id: 'experience', label: 'Experience' },
    { id: 'training', label: 'Training' },
    { id: 'archetypes', label: 'Archetypes' }
  ]
  
  return (
    <AppLayout>
      <PageHeader
        title="My Profile"
        subtitle="Manage your professional acting profile"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/actor/media')}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'default' : 'outline'}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Profile Completion */}
        {profileCompletion < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-50 to-teal-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm font-bold text-purple-600">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Complete your profile to increase visibility to casting directors
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <Avatar
                    src={primaryHeadshot ? `/api/media/images${primaryHeadshot.media_url.replace('/downloaded_images', '')}` : user?.avatar_url}
                    alt={actorData?.name || ''}
                    fallback={actorData?.name || ''}
                    size="xl"
                    className="w-32 h-32"
                  />
                  {isEditing && (
                    <Button size="sm" variant="outline" className="mt-3">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  )}
                </div>
                
                {/* Basic Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-heading font-bold">{actorData?.name || ''}</h2>
                      <p className="text-gray-600">{actorData?.union || 'Non-Union'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="success">Available</Badge>
                      <Badge variant="secondary">Verified</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{actorData?.location || 'Los Angeles'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{actorData?.email || ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{actorData?.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Age Range: {actorData?.age_range || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex gap-3 mt-4">
                    {actorData?.website && (
                      <Button size="sm" variant="ghost">
                        <Globe className="w-4 h-4" />
                      </Button>
                    )}
                    {actorData?.instagram && (
                      <Button size="sm" variant="ghost">
                        <Instagram className="w-4 h-4" />
                      </Button>
                    )}
                    {actorData?.twitter && (
                      <Button size="sm" variant="ghost">
                        <Twitter className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <ForumActivityPanel userId={user.id} />
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Public Profile Card - Premium Feature */}
              <Card className="md:col-span-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary-600" />
                        Public Profile
                        <Badge className="bg-primary-600 text-white">Premium</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Share your professional profile with anyone - no login required
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium">Your public profile URL:</p>
                        <p className="text-sm text-primary-600 mt-1">
                          {publicProfileUrl}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigator.clipboard.writeText(fullPublicProfileUrl)}
                          variant="outline"
                          size="sm"
                        >
                          Copy Link
                        </Button>
                        <Button
                          onClick={() => window.open(localProfileUrl, '_blank')}
                          variant="outline"
                          size="sm"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => router.push('/actor/public-profile')}
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Configure Public Profile
                      </Button>
                      <p className="text-sm text-gray-600">
                        Choose what information to display publicly
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <textarea
                      className="w-full p-3 border rounded-lg resize-none h-32"
                      value={actorData?.bio || ''}
                      onChange={(e) => {/* TODO: Implement bio editing */}}
                    />
                  ) : (
                    <p className="text-gray-600">{actorData?.bio || 'No bio available'}</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Physical Attributes */}
              <Card>
                <CardHeader>
                  <CardTitle>Physical Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actorData?.height && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Height:</span>
                        <span className="font-medium">{actorData.height}</span>
                      </div>
                    )}
                    {actorData?.eye_color && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Eye Color:</span>
                        <span className="font-medium">{actorData.eye_color}</span>
                      </div>
                    )}
                    {actorData?.hair_color && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hair Color:</span>
                        <span className="font-medium">{actorData.hair_color}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Skills */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Special Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {actorData?.skills?.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {isEditing && (
                      <Button size="sm" variant="outline">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Skill
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Headshots */}
              <Card>
                <CardHeader>
                  <CardTitle>Headshots</CardTitle>
                  <CardDescription>Professional photos for casting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {headshots.map((photo, index) => (
                      <div 
                        key={photo.id || index} 
                        className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageModal(
                          `/api/media/images${photo.media_url.replace('/downloaded_images', '')}`,
                          `Headshot ${index + 1}`,
                          headshotGallery,
                          index
                        )}
                      >
                        <img
                          src={`/api/media/images${photo.media_url.replace('/downloaded_images', '')}`}
                          alt={`Headshot ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-gray-300');
                          }}
                        />
                      </div>
                    ))}
                    <button className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Gallery Photos */}
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                  <CardDescription>Additional photos and portfolio images</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {galleryMedia.map((photo, index) => (
                      <div 
                        key={photo.id || index} 
                        className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageModal(
                          `/api/media/images${photo.media_url.replace('/downloaded_images', '')}`,
                          `Gallery ${index + 1}`,
                          galleryImages,
                          index
                        )}
                      >
                        <img
                          src={`/api/media/images${photo.media_url.replace('/downloaded_images', '')}`}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-gray-300');
                          }}
                        />
                      </div>
                    ))}
                    <button className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Reels */}
              <Card>
                <CardHeader>
                  <CardTitle>Demo Reels</CardTitle>
                  <CardDescription>Video showcases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {actorData?.media?.reels?.map((reel) => (
                      <div key={reel.id || reel.media_url} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Film className="w-5 h-5 text-primary-600" />
                          <span className="font-medium">{reel.title || 'Demo Reel'}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" fullWidth>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Reel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {activeTab === 'experience' && (
            <motion.div
              key="experience"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Professional Experience</CardTitle>
                  <CardDescription>Film, TV, Theater, and Commercial work</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">Experience details will be added in a future update.</p>
                    {isEditing && (
                      <Button variant="outline" fullWidth>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {activeTab === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Training & Education</CardTitle>
                  <CardDescription>Acting schools and workshops</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">Training details will be added in a future update.</p>
                    {isEditing && (
                      <Button variant="outline" fullWidth>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Training
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {activeTab === 'archetypes' && (
            <motion.div
              key="archetypes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Character Archetypes</CardTitle>
                  <CardDescription>
                    Select up to 3 archetypes that best represent your casting type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {archetypesList.map((archetype) => {
                      const isSelected = false
                      return (
                        <button
                          key={archetype}
                          onClick={() => {
                            if (!isEditing) return
                            if (isSelected) {
                              // TODO: Implement archetype editing
                            } else {
                              // TODO: Implement archetype editing
                            }
                          }}
                          disabled={!isEditing}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all',
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300',
                            !isEditing && 'cursor-default'
                          )}
                        >
                          <div className="text-2xl mb-2">
                            {archetype === 'Hero' && '🦸'}
                            {archetype === 'Innocent' && '👶'}
                            {archetype === 'Explorer' && '🧭'}
                            {archetype === 'Sage' && '🧙'}
                            {archetype === 'Rebel' && '😈'}
                            {archetype === 'Lover' && '💕'}
                            {archetype === 'Creator' && '🎨'}
                            {archetype === 'Jester' && '🃏'}
                            {archetype === 'Caregiver' && '🤱'}
                            {archetype === 'Ruler' && '👑'}
                            {archetype === 'Magician' && '🔮'}
                            {archetype === 'Regular Guy' && '👔'}
                          </div>
                          <p className="font-medium">{archetype}</p>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Selected: 0/3
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContent>
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Previous button */}
            {selectedImage.index > 0 && (
              <button
                onClick={goToPreviousImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {/* Next button */}
            {selectedImage.index < imageGallery.length - 1 && (
              <button
                onClick={goToNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Image counter */}
            {imageGallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {selectedImage.index + 1} / {imageGallery.length}
              </div>
            )}
          </div>
          
          {/* Background click to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeImageModal}
          />
        </div>
      )}
    </AppLayout>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function AnimatePresence({ children, mode }: { children: React.ReactNode, mode?: string }) {
  return <>{children}</>
}
