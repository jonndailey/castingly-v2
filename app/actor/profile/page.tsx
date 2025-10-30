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
  FileText,
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
import { useActorProfile, useActorMedia, type ActorMediaEntry } from '@/lib/hooks/useActorData'
// import { useSignedHeadshot } from '@/lib/hooks/useSignedHeadshot'

// Mock data for the profile
const profileData = {
  basicInfo: {
    name: 'Jack Connelly',
    email: 'jackfdfnnelly@gmail.com',
    phone: '(555) 123-4567',
    location: 'Los Angeles, CA',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    union: 'SAG-AFTRA',
    website: 'www.jackconnelly.com',
    instagram: '@jackconnelly',
    twitter: '@jackconnelly'
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

const archetypesDefinitions = [
  { name: 'Hero', emoji: '🦸', description: 'Brave, determined, and driven to overcome challenges.' },
  { name: 'Innocent', emoji: '👶', description: 'Pure-hearted, optimistic, and full of wonder.' },
  { name: 'Explorer', emoji: '🧭', description: 'Adventurous, curious, and drawn to new experiences.' },
  { name: 'Sage', emoji: '🧙', description: 'Wise, thoughtful, and a seeker of truth and understanding.' },
  { name: 'Rebel', emoji: '😈', description: 'Bold, unconventional, and unafraid to challenge authority.' },
  { name: 'Lover', emoji: '💕', description: 'Passionate, expressive, and guided by emotion and connection.' },
  { name: 'Creator', emoji: '🎨', description: 'Visionary, imaginative, and driven to build or express.' },
  { name: 'Jester', emoji: '🃏', description: 'Playful, witty, and able to bring levity and truth through humor.' },
  { name: 'Caregiver', emoji: '🤱', description: 'Compassionate, nurturing, and selfless in service to others.' },
  { name: 'Ruler', emoji: '👑', description: 'Confident, commanding, and natural at leading or taking charge.' },
  { name: 'Magician', emoji: '🔮', description: 'Charismatic, insightful, and able to transform situations or people.' },
  { name: 'Regular Guy/Girl', emoji: '👔', description: 'Relatable, grounded, and authentically human.' }
]

export default function ActorProfile() {
  const router = useRouter()
  const { user, logout, token } = useAuthStore()
  // Fetch light profile first, then media separately for perceived speed
  const { profile: actorData, loading, error, refresh: refreshProfile } = useActorProfile(user?.id)
  const { media, loading: mediaLoading, reload: reloadMedia } = useActorMedia(user?.id)
  
  const deleteMediaFile = async (fileId: string) => {
    if (!user?.id || !token || !fileId) return
    if (!confirm('Delete this media file?')) return
    try {
      const res = await fetch(`/api/media/actor/${encodeURIComponent(String(user.id))}/files/${encodeURIComponent(String(fileId))}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      reloadMedia()
    } catch (e) {
      alert('Failed to delete media file')
    }
  }
  const [isEditing, setIsEditing] = useState(false)
  const [edit, setEdit] = useState<{ phone?: string; location?: string; website?: string; instagram?: string; twitter?: string; bio?: string; resume_url?: string; height?: string; eye_color?: string; hair_color?: string; age_range?: string; forum_display_name?: string; forum_signature?: string; archetypes?: string[]; training?: Array<{institution: string; year: string; focus: string}> }>({})
  const [saveMessage, setSaveMessage] = useState<string>('')
  const [skillsInput, setSkillsInput] = useState('')
  const [pendingSkills, setPendingSkills] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([])
  const [trainingEntries, setTrainingEntries] = useState<Array<{institution: string; year: string; focus: string}>>([])
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; index: number } | null>(null)
  const [imageGallery, setImageGallery] = useState<Array<{ src: string; alt: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string>('')
  const [pendingCategory, setPendingCategory] = useState<'headshot' | 'gallery' | 'reel' | 'resume' | 'self_tape' | 'voice_over' | 'document' | 'other'>('headshot')
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null)
  const [fastHeadshotTiles, setFastHeadshotTiles] = useState<Array<{ thumbSrc: string; fullSrc: string; alt: string }>>([])
  const [fastGalleryTiles, setFastGalleryTiles] = useState<Array<{ thumbSrc: string; fullSrc: string; alt: string }>>([])

  // Fast path: prefetch public small headshot tiles via lightweight API
  const fetchHeadshotTiles = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/media/actor/${encodeURIComponent(id)}/headshots/tiles`, { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      const tiles = Array.isArray(j?.tiles) ? j.tiles : []
      const mapped = tiles.map((t: any) => ({ thumbSrc: String(t.thumb), fullSrc: String(t.full), alt: String(t.name || 'Headshot') }))
      setFastHeadshotTiles(mapped)
    } catch {}
  }, [])
  useEffect(() => {
    const id = String((actorData as any)?.id || user?.id || '')
    if (!id) return
    let aborted = false
    ;(async () => { if (!aborted) await fetchHeadshotTiles(id) })()
    return () => { aborted = true }
  }, [(actorData as any)?.id, user?.id, fetchHeadshotTiles])

  // Fast path: prefetch public small gallery tiles via lightweight API
  useEffect(() => {
    const id = String((actorData as any)?.id || user?.id || '')
    if (!id) return
    let aborted = false
    ;(async () => {
      try {
        const r = await fetch(`/api/media/actor/${encodeURIComponent(id)}/gallery/tiles`, { cache: 'no-store' })
        if (!r.ok) return
        const j = await r.json()
        if (aborted) return
        const tiles = Array.isArray(j?.tiles) ? j.tiles : []
        const mapped = tiles.map((t: any) => ({ thumbSrc: String(t.thumb), fullSrc: String(t.full), alt: String(t.name || 'Gallery') }))
        setFastGalleryTiles(mapped)
      } catch {}
    })()
    return () => { aborted = true }
  }, [(actorData as any)?.id, user?.id])

  const headshots = (media?.headshots ?? []).filter((entry) =>
    Boolean(entry.url || entry.signed_url || entry.thumbnail_url)
  )
  // Removed extra roundtrip for signed headshot; we will use
  // avatar_url from the profile API (server-provided) or the
  // first available small-variant headshot from media when loaded.
  const headshotGallery = headshots.map((item, index) => ({
    src: getMediaUrl(item) ?? '',
    alt: `Headshot ${index + 1}`,
  }))
  const primaryHeadshot = headshots[0] ?? null

  // Group variants and pick small for grid, full for lightbox
  type VariantTile = { id?: string; thumbSrc: string; fullSrc: string; alt: string; ts?: number }
  function splitVariant(name?: string | null) {
    const n = String(name || '').toLowerCase()
    const m = n.match(/^(.*?)(?:_(large|medium|small|thumbnail))?(\.[^.]+)?$/)
    if (!m) return { base: n.replace(/\.[^.]+$/, ''), variant: null as null | 'large' | 'medium' | 'small' | 'thumbnail' }
    const baseWithExt = m[1] + (m[3] || '')
    const base = baseWithExt.replace(/\.[^.]+$/, '')
    const variant = (m[2] as any) || null
    return { base, variant }
  }
  function buildVariantTiles(items: Array<ActorMediaEntry | any>): VariantTile[] {
    const files = (items || []).filter((e) => Boolean(e?.url || e?.signed_url || e?.thumbnail_url))
    const groups = new Map<string, { small?: any; medium?: any; large?: any; original?: any; thumbnail?: any }>()
    for (const item of files) {
      const { base, variant } = splitVariant(item?.name as any)
      if (!groups.has(base)) groups.set(base, {})
      const g = groups.get(base)!
      if (!variant) {
        g.original = g.original || item
      } else if (variant === 'thumbnail') {
        g.thumbnail = g.thumbnail || item
      } else if (variant === 'small') {
        g.small = g.small || item
      } else if (variant === 'medium') {
        g.medium = g.medium || item
      } else if (variant === 'large') {
        g.large = g.large || item
      }
    }
    const tiles: VariantTile[] = []
    for (const [base, g] of groups.entries()) {
      // Thumb preference: public small > small > thumbnail > medium > original > large
      const smallIsPublic = !!(g.small && (
        String(((g.small as any)?.visibility || (g.small as any)?.metadata?.access || '')).toLowerCase() === 'public' ||
        String(((g.small as any)?.metadata?.bucketId || (g.small as any)?.metadata?.bucket_id || '')).toLowerCase() === 'castingly-public'
      ))
      const thumbEntry = (g.small && smallIsPublic ? g.small : null) || g.small || g.thumbnail || g.medium || g.original || g.large
      // Full preference: original > large > medium > small > thumbnail
      const fullEntry = g.original || g.large || g.medium || g.small || g.thumbnail
      if (!thumbEntry || !fullEntry) continue
      const tile: VariantTile = {
        id: String((fullEntry as any).id || ''),
        thumbSrc: getMediaUrl(thumbEntry) ?? '',
        fullSrc: getMediaUrl(fullEntry) ?? '',
        alt: String((fullEntry as any).name || base),
        ts: (() => { try { return Date.parse(String((fullEntry as any)?.uploaded_at || '')) || undefined } catch { return undefined } })(),
      }
      if (tile.thumbSrc && tile.fullSrc) tiles.push(tile)
    }
    // Newest first
    tiles.sort((a, b) => (b.ts || 0) - (a.ts || 0))
    return tiles
  }
  const galleryTilesFromMedia: VariantTile[] = buildVariantTiles((media?.gallery ?? []))
  const galleryTilesAll: VariantTile[] = fastGalleryTiles.length ? fastGalleryTiles as any : galleryTilesFromMedia
  const galleryTiles: VariantTile[] = galleryTilesAll.slice(0, 20)
  const headshotTilesFromMedia: VariantTile[] = buildVariantTiles((media?.headshots ?? []))
  const headshotTilesAll: VariantTile[] = fastHeadshotTiles.length
    ? fastHeadshotTiles as any
    : headshotTilesFromMedia
  const headshotTiles: VariantTile[] = headshotTilesAll.slice(0, 20)
  
  // Initialize archetypes and training when actor data loads
  useEffect(() => {
    if ((actorData as any)?.archetypes) {
      setSelectedArchetypes((actorData as any).archetypes)
    }
    if ((actorData as any)?.training) {
      setTrainingEntries((actorData as any).training)
    }
  }, [actorData])
  
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

  // Hidden uploader at root so any section can trigger it
  const renderGlobalUploader = () => (
    <>
      <input
        id="profile-upload-input"
        type="file"
        className="hidden"
        onChange={onFileSelected}
        accept="image/*,video/*,application/pdf,audio/*"
      />
      {uploadMessage && (
        <div className="mb-3 text-sm text-gray-600">{uploadMessage}</div>
      )}
    </>
  )

  // Upload helpers
  const startUpload = useCallback((category: 'headshot' | 'gallery' | 'reel' | 'resume' | 'self_tape' | 'voice_over' | 'document' | 'other') => {
    setPendingCategory(category)
    const input = document.getElementById('profile-upload-input') as HTMLInputElement | null
    input?.click()
  }, [])

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token || !user?.id) return

    setUploading(true)
    try {
      // Optimistic preview for images
      if (pendingCategory === 'headshot' || pendingCategory === 'gallery') {
        const url = URL.createObjectURL(file)
        setUploadPreviewUrl(url)
      }
      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name)
      form.append('category', pendingCategory)
      const res = await fetch(`/api/media/actor/${encodeURIComponent(String(user.id))}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Upload failed')
      }
      setUploadMessage('Uploaded successfully')
      setTimeout(() => setUploadMessage(''), 2500)
      // Refresh client media and tiles immediately to reflect new headshot
      // Wait for tiles first to get clean /api/serve URLs
      try {
        if ((pendingCategory === 'headshot') && user?.id) {
          await fetchHeadshotTiles(String(user.id))
        }
      } catch {}
      // Then reload full media after tiles are set
      try { reloadMedia() } catch {}
      router.refresh()
      // Persist a stable avatar pointer so profile reloads resolve via safe endpoint immediately
      try {
        if ((pendingCategory === 'headshot') && user?.id && token) {
          const safeAvatar = `/api/media/avatar/safe/${encodeURIComponent(String(user.id))}`
          await fetch(`/api/actors/${encodeURIComponent(String(user.id))}/profile`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profile_image: safeAvatar }),
          })
          try { await refreshProfile() } catch {}
        }
      } catch {}
    } catch (err: any) {
      setUploadMessage(err?.message || 'Upload failed')
      setTimeout(() => setUploadMessage(''), 3500)
    } finally {
      setUploading(false)
      // Clear preview after refresh has likely pulled new media
      setTimeout(() => setUploadPreviewUrl(null), 4000)
    }
  }, [pendingCategory, token, user?.id, router])
  
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

  useEffect(() => {
    if (actorData) {
      setEdit({
        phone: actorData.phone || '',
        location: actorData.location || '',
        website: actorData.website || '',
        instagram: actorData.instagram || '',
        twitter: actorData.twitter || '',
        bio: actorData.bio || '',
        resume_url: actorData.resume_url || '',
        height: actorData.height || '',
        eye_color: actorData.eye_color || '',
        hair_color: actorData.hair_color || '',
        age_range: actorData.age_range || '',
        // Forum fields
        forum_display_name: (actorData as any).forum_display_name || '',
        forum_signature: (actorData as any).forum_signature || '',
      })
      setPendingSkills(Array.isArray(actorData.skills) ? actorData.skills : [])
    }
  }, [actorData])

  const handleSave = async () => {
    try {
      if (!user || !actorData?.id) return
      const res = await fetch(`/api/actors/${actorData.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(useAuthStore.getState().token
            ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
            : {}),
        },
        body: JSON.stringify({
          phone: edit.phone,
          location: edit.location,
          website: edit.website,
          instagram: edit.instagram,
          twitter: edit.twitter,
          bio: edit.bio,
          resume_url: edit.resume_url,
          height: edit.height,
          eye_color: edit.eye_color,
          hair_color: edit.hair_color,
          age_range: edit.age_range,
          ...(pendingSkills ? { skills: pendingSkills } : {}),
          forum_display_name: (edit as any).forum_display_name,
          forum_signature: (edit as any).forum_signature,
        }),
      })
      if (!res.ok) throw new Error('Failed to save profile')
      setIsEditing(false)
      setSaveMessage('Profile saved')
      setTimeout(() => setSaveMessage(''), 2000)
      try { refreshProfile() } catch {}
    } catch (e) {
      alert('Failed to save profile')
    }
  }
  
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
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
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
        {/* Inside Connect entry */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Inside Connect</span>
              <Badge variant="secondary">New</Badge>
            </CardTitle>
            <CardDescription>Find agencies accepting new talent and pitch yourself</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">Browse open representation calls and track your submissions.</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/actor/connect')}>Open Inside Connect</Button>
            </div>
          </CardContent>
        </Card>
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
                  <div className="h-32 w-32 md:h-48 md:w-48 rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={
                        // Owner: prefer small public tile (edge cached), then server avatar_url (if not raw), then safe fallback
                        (() => {
                          const isRawUrl = (url: string | null | undefined) => {
                            if (!url) return false
                            return /(s3\.|amazonaws\.com|\.ovh\.)/i.test(url)
                          }
                          const avatarUrl = actorData?.avatar_url
                          const safeAvatarUrl = (avatarUrl && !isRawUrl(avatarUrl)) ? avatarUrl : null
                          const fallbackUrl = `/api/media/avatar/safe/${encodeURIComponent(String(actorData?.id || user?.id || ''))}`
                          return headshotTiles?.[0]?.thumbSrc || safeAvatarUrl || fallbackUrl
                        })()
                      }
                      alt={actorData?.name || ''}
                      className="h-full w-full object-cover"
                    />
                  </div>
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
                      <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
                        {(actorData as any)?.forum_display_name || actorData?.name || ''}
                        {(actorData as any)?.is_verified_professional ? (
                          <span className="inline-flex items-center text-xs text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Verified</span>
                        ) : null}
                      </h2>
                      <p className="text-gray-600">{actorData?.union || 'Non-Union'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="success">Available</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          value={edit.location || ''}
                          onChange={(e) => setEdit((s) => ({ ...s, location: e.target.value }))}
                          placeholder="Location"
                        />
                      ) : (
                        <span>{actorData?.location || 'Los Angeles'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          value={(edit as any).forum_display_name || ''}
                          onChange={(e) => setEdit((s) => ({ ...s, forum_display_name: e.target.value }))}
                          placeholder="Display name"
                        />
                      ) : (
                        <span>{(actorData as any)?.forum_display_name || actorData?.name || ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{actorData?.email || ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          value={edit.phone || ''}
                          onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))}
                          placeholder="Phone"
                        />
                      ) : (
                        <span>{actorData?.phone || 'Not provided'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          value={edit.age_range || ''}
                          onChange={(e) => setEdit((s) => ({ ...s, age_range: e.target.value }))}
                          placeholder="e.g. 20-30"
                        />
                      ) : (
                        <span>Age Range: {actorData?.age_range || 'Not specified'}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Links */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input className="border rounded px-2 py-1 text-sm w-full" value={edit.website || ''} onChange={(e) => setEdit((s) => ({ ...s, website: e.target.value }))} placeholder="Website" />
                      ) : (
                        <span>{actorData?.website || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Instagram className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input className="border rounded px-2 py-1 text-sm w-full" value={edit.instagram || ''} onChange={(e) => setEdit((s) => ({ ...s, instagram: e.target.value }))} placeholder="Instagram" />
                      ) : (
                        <span>{actorData?.instagram || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Twitter className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <input className="border rounded px-2 py-1 text-sm w-full" value={edit.twitter || ''} onChange={(e) => setEdit((s) => ({ ...s, twitter: e.target.value }))} placeholder="Twitter" />
                      ) : (
                        <span>{actorData?.twitter || '—'}</span>
                      )}
                    </div>
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
                        <Badge size="sm" className="bg-primary-600 text-white">Premium</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm sm:text-base">
                        Share your professional profile with anyone — no login required
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="font-medium text-sm sm:text-base">Your public profile URL:</p>
                      <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center">
                        <Input
                          readOnly
                          value={fullPublicProfileUrl}
                          className="text-sm sm:text-base font-mono"
                        />
                        <div className="flex gap-2 sm:ml-2">
                          <Button
                            onClick={() => navigator.clipboard.writeText(fullPublicProfileUrl)}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Copy Link
                          </Button>
                          <Button
                            onClick={() => window.open(localProfileUrl, '_blank')}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      <Button
                        onClick={() => router.push('/actor/public-profile')}
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Configure Public Profile
                      </Button>
                      <p className="text-xs sm:text-sm text-gray-600">
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
                    <>
                      <textarea
                        className="w-full p-3 border rounded-lg resize-none h-32"
                        value={edit.bio || ''}
                        onChange={(e) => setEdit((s) => ({ ...s, bio: e.target.value }))}
                        placeholder="Your professional bio"
                      />
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <input
                          className="border rounded px-2 py-1 text-sm w-full"
                          value={edit.resume_url || ''}
                          onChange={(e) => setEdit((s) => ({ ...s, resume_url: e.target.value }))}
                          placeholder="Resume URL (PDF)"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">{actorData?.bio || 'No bio available'}</p>
                      {actorData?.resume_url && (
                        <div className="mt-3 text-sm">
                          <a className="text-primary-600 hover:text-primary-700" href={actorData.resume_url} target="_blank" rel="noreferrer">
                            View Resume
                          </a>
                        </div>
                      )}
                    </>
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
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-600">Height:</span>
                      {isEditing ? (
                        <input className="border rounded px-2 py-1 text-sm w-40" value={(edit as any).height || ''} onChange={(e) => setEdit((s) => ({ ...s, height: e.target.value }))} placeholder="e.g., 5 ft 10 in" />
                      ) : (
                        <span className="font-medium">{actorData?.height || '—'}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-600">Eye Color:</span>
                      {isEditing ? (
                        <input className="border rounded px-2 py-1 text-sm w-40" value={(edit as any).eye_color || ''} onChange={(e) => setEdit((s) => ({ ...s, eye_color: e.target.value }))} placeholder="e.g., Blue" />
                      ) : (
                        <span className="font-medium">{actorData?.eye_color || '—'}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-600">Hair Color:</span>
                      {isEditing ? (
                        <input className="border rounded px-2 py-1 text-sm w-40" value={(edit as any).hair_color || ''} onChange={(e) => setEdit((s) => ({ ...s, hair_color: e.target.value }))} placeholder="e.g., Brown" />
                      ) : (
                        <span className="font-medium">{actorData?.hair_color || '—'}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Skills */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Special Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(pendingSkills || []).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        {isEditing && (
                          <button
                            className="ml-1 text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => setPendingSkills((list) => list.filter((s) => s !== skill))}
                            aria-label={`Remove ${skill}`}
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          placeholder="Add a skill"
                          value={skillsInput}
                          onChange={(e) => setSkillsInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const v = skillsInput.trim()
                              if (v && !pendingSkills.includes(v)) {
                                setPendingSkills((list) => [...list, v])
                                setSkillsInput('')
                              }
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const v = skillsInput.trim()
                            if (v && !pendingSkills.includes(v)) {
                              setPendingSkills((list) => [...list, v])
                              setSkillsInput('')
                            }
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Skill
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* Global uploader to support buttons across tabs */}
          {renderGlobalUploader()}

          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {mediaLoading && (
                <div className="md:col-span-2 lg:col-span-3 text-sm text-gray-500">
                  Loading media…
                </div>
              )}
              {/* Hidden uploader for media */}
              <input
                id="profile-upload-input"
                type="file"
                className="hidden"
                onChange={onFileSelected}
                accept="image/*,video/*,application/pdf,audio/*"
              />
              {uploadMessage && (
                <div className="md:col-span-2 lg:col-span-3 text-sm text-gray-600">{uploadMessage}</div>
              )}
              {/* Headshots */}
              <Card>
              <CardHeader>
                <CardTitle>
                  Headshots <span className="text-xs text-gray-500">({headshotTiles.length}/20)</span>
                </CardTitle>
                <CardDescription>Professional photos for casting</CardDescription>
              </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {mediaLoading && (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={`hs-skel-${i}`} className="aspect-[3/4] rounded-lg bg-gray-200 animate-pulse" />
                      ))
                    )}
                    {uploadPreviewUrl && (
                      <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-200">
                        <img src={uploadPreviewUrl} alt="Uploading..." className="h-full w-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/20">Uploading…</div>
                      </div>
                    )}
                    {headshotTiles.map((photo, index) => (
                      <div
                        key={`${photo.fullSrc}-${index}`}
                        className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageModal(
                          photo.fullSrc,
                          `Headshot ${index + 1}`,
                          headshotTiles.map(g => ({ src: g.fullSrc, alt: g.alt })),
                          index
                        )}
                      >
                        {/* lightweight spinner until image paints */}
                        <div data-spinner className="absolute inset-0 flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                        {photo.id && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteMediaFile(String(photo.id!)) }}
                            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white text-red-600 rounded-full px-2 py-1 text-xs shadow"
                            title="Delete headshot"
                          >
                            Delete
                          </button>
                        )}
                        <img
                          src={photo.thumbSrc}
                          alt={`Headshot ${index + 1}`}
                          className="h-full w-full object-cover opacity-0"
                          loading="lazy"
                          decoding="async"
                          onLoad={(e) => { 
                            e.currentTarget.classList.remove('opacity-0');
                            const sp = e.currentTarget.parentElement?.querySelector('[data-spinner]') as HTMLElement | null;
                            if (sp) sp.style.display = 'none';
                          }}
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement as HTMLElement | null
                            if (parent) parent.style.display = 'none'
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => startUpload('headshot')}
                      disabled={uploading}
                      className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
                      title="Upload Headshot"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Gallery Photos */}
              <Card>
              <CardHeader>
                <CardTitle>
                  Gallery <span className="text-xs text-gray-500">({galleryTiles.length}/20)</span>
                </CardTitle>
                <CardDescription>Additional photos and portfolio images</CardDescription>
              </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {mediaLoading && (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={`gal-skel-${i}`} className="aspect-[3/4] rounded-lg bg-gray-200 animate-pulse" />
                      ))
                    )}
                    {uploadPreviewUrl && pendingCategory === 'gallery' && (
                      <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-200">
                        <img src={uploadPreviewUrl} alt="Uploading..." className="h-full w-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/20">Uploading…</div>
                      </div>
                    )}
                    {galleryTiles.map((photo, index) => (
                      <div
                        key={`${photo.fullSrc}-${index}`}
                        className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageModal(photo.fullSrc, photo.alt, galleryTiles.map(g => ({ src: g.fullSrc, alt: g.alt })), index)}
                      >
                        <div data-spinner className="absolute inset-0 flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                        {photo.id && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteMediaFile(String(photo.id)) }}
                            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white text-red-600 rounded-full px-2 py-1 text-xs shadow"
                            title="Delete image"
                          >
                            Delete
                          </button>
                        )}
                        <img
                          src={photo.thumbSrc}
                          alt={photo.alt}
                          className="h-full w-full object-cover opacity-0"
                          loading="lazy"
                          decoding="async"
                          onLoad={(e) => {
                            e.currentTarget.classList.remove('opacity-0');
                            const sp = e.currentTarget.parentElement?.querySelector('[data-spinner]') as HTMLElement | null;
                            if (sp) sp.style.display = 'none';
                          }}
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement as HTMLElement | null
                            if (parent) parent.style.display = 'none'
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => startUpload('gallery')}
                      disabled={uploading}
                      className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 disabled:opacity-50"
                    >
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
                    {(media?.reels ?? []).map((reel) => {
                      const reelUrl = getMediaUrl(reel)

                      return (
                        <div
                          key={reel.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg bg-gray-50 p-3 w-full"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <Film className="h-5 w-5 text-primary-600 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none break-words">{reel.name || 'Demo Reel'}</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            {reelUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(reelUrl, '_blank')}
                              >
                                View
                              </Button>
                            )}
                            {reel.id && (
                              <Button size="sm" variant="danger" onClick={() => deleteMediaFile(String(reel.id))}>Delete</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <Button variant="outline" fullWidth disabled={uploading} onClick={() => startUpload('reel')}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Reel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Self-Tapes */}
              <Card>
                <CardHeader>
                  <CardTitle>Self-Tapes</CardTitle>
                  <CardDescription>Audition self-tapes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(media?.self_tapes ?? []).map((tape) => {
                      const tapeUrl = getMediaUrl(tape)
                      return (
                        <div key={tape.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg bg-gray-50 p-3 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <Film className="h-5 w-5 text-primary-600 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none break-words">{tape.name || 'Self-Tape'}</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            {tapeUrl && (
                              <Button size="sm" variant="ghost" onClick={() => window.open(tapeUrl, '_blank')}>
                                View
                              </Button>
                            )}
                            {tape.id && (
                              <Button size="sm" variant="danger" onClick={() => deleteMediaFile(String(tape.id))}>Delete</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <Button variant="outline" fullWidth disabled={uploading} onClick={() => startUpload('self_tape')}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Self-Tape
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Over */}
              <Card>
                <CardHeader>
                  <CardTitle>Voice Over</CardTitle>
                  <CardDescription>Audio samples</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(media?.voice_over ?? []).map((vo) => {
                      const url = getMediaUrl(vo)
                      return (
                        <div key={vo.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg bg-gray-50 p-3 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="font-medium text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none break-words">{vo.name || 'Voice Over'}</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            {url && (
                              <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                                Listen
                              </Button>
                            )}
                            {vo.id && (
                              <Button size="sm" variant="danger" onClick={() => deleteMediaFile(String(vo.id))}>Delete</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <Button variant="outline" fullWidth disabled={uploading} onClick={() => startUpload('voice_over')}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Audio
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resume / Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Resume & Documents</CardTitle>
                  <CardDescription>PDFs and other documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(media?.resumes ?? []).map((doc) => {
                      const url = getMediaUrl(doc)
                      return (
                        <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg bg-gray-50 p-3 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-primary-600 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none break-words">{doc.name || 'Resume'}</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            {url && (
                              <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                                View
                              </Button>
                            )}
                            {doc.id && (
                              <Button size="sm" variant="danger" onClick={() => deleteMediaFile(String(doc.id))}>Delete</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <Button variant="outline" fullWidth disabled={uploading} onClick={() => startUpload('resume')}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Other Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Other Documents</CardTitle>
                  <CardDescription>Additional PDFs and files</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(actorData?.media?.documents ?? []).map((doc) => {
                      const url = getMediaUrl(doc)
                      return (
                        <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-lg bg-gray-50 p-3 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-primary-600 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none break-words">{doc.name || 'Document'}</span>
                          </div>
                          {url && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(url, '_blank')}>
                              View
                            </Button>
                          )}
                        </div>
                      )
                    })}
                    <Button variant="outline" fullWidth disabled={uploading} onClick={() => startUpload('document')}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Document
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
                    {/* Training list */}
                    {trainingEntries && trainingEntries.length > 0 ? (
                      <div className="space-y-3">
                        {trainingEntries.map((entry, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
                            <div className="pr-8">
                              <h4 className="font-medium text-sm">{entry.institution}</h4>
                              <p className="text-sm text-gray-600">{entry.focus}</p>
                              <p className="text-xs text-gray-500 mt-1">{entry.year}</p>
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => {
                                  setTrainingEntries(prev => prev.filter((_, i) => i !== index))
                                }}
                                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No training entries added yet.</p>
                    )}
                    
                    {/* Add training form */}
                    {isEditing && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Add Training</h4>
                        <div className="space-y-3">
                          <Input
                            placeholder="Institution (e.g., Lee Strasberg Theatre & Film Institute)"
                            className="text-sm"
                            id="training-institution"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="Year (e.g., 2020)"
                              className="text-sm"
                              id="training-year"
                            />
                            <Input
                              placeholder="Focus (e.g., Method Acting)"
                              className="text-sm"
                              id="training-focus"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const institution = (document.getElementById('training-institution') as HTMLInputElement)?.value
                              const year = (document.getElementById('training-year') as HTMLInputElement)?.value
                              const focus = (document.getElementById('training-focus') as HTMLInputElement)?.value
                              
                              if (institution && year && focus) {
                                setTrainingEntries(prev => [...prev, { institution, year, focus }])
                                // Clear inputs
                                ;(document.getElementById('training-institution') as HTMLInputElement).value = ''
                                ;(document.getElementById('training-year') as HTMLInputElement).value = ''
                                ;(document.getElementById('training-focus') as HTMLInputElement).value = ''
                              }
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Entry
                          </Button>
                        </div>
                      </div>
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
                  {/* Introduction text */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Archetypes represent timeless character patterns that appear across stories, cultures, and performances. 
                      They reflect universal human motivations — from the drive to explore, to the desire to nurture, to the need to lead.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Select up to three archetypes that best define your casting type. These help casting professionals quickly understand your natural screen or stage presence.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {archetypesDefinitions.map((archetype) => {
                      const isSelected = selectedArchetypes.includes(archetype.name)
                      return (
                        <button
                          key={archetype.name}
                          onClick={() => {
                            if (!isEditing) return
                            if (isSelected) {
                              setSelectedArchetypes(prev => prev.filter(a => a !== archetype.name))
                            } else if (selectedArchetypes.length < 3) {
                              setSelectedArchetypes(prev => [...prev, archetype.name])
                            }
                          }}
                          disabled={!isEditing || (!isSelected && selectedArchetypes.length >= 3)}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-left',
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300',
                            !isEditing && 'cursor-default',
                            !isSelected && selectedArchetypes.length >= 3 && isEditing && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">{archetype.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm mb-1">{archetype.name}</p>
                              <p className="text-xs text-gray-600 line-clamp-2">{archetype.description}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <Check className="w-4 h-4 text-primary-600" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Selected: {selectedArchetypes.length}/3 archetypes
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

function getMediaUrl(entry: ActorMediaEntry | { url?: string | null; signed_url?: string | null; thumbnail_url?: string | null; uploaded_at?: string | null; visibility?: string | null; metadata?: any }) {
  if (!entry) return null
  const url: string | null = (entry as any).url || null
  const thumb: string | null = (entry as any).thumbnail_url || null
  const signed: string | null = (entry as any).signed_url || null
  const visibility = String(((entry as any)?.visibility || (entry as any)?.metadata?.access || '')).toLowerCase()
  const bucket = String(((entry as any)?.metadata?.bucketId || (entry as any)?.metadata?.bucket_id || '')).toLowerCase()
  const publicEntry = visibility === 'public' || bucket === 'castingly-public'

  const looksServe = (u?: string | null) => typeof u === 'string' && (/^\/?api\/serve\//.test(u) || /media\.dailey\.cloud\/api\/serve\//.test(u))
  const looksProxy = (u?: string | null) => typeof u === 'string' && /^\/?api\/media\/proxy\?/.test(u)
  const looksRawStorage = (u?: string | null) => typeof u === 'string' && /(s3\.|amazonaws\.com|\.ovh\.)/i.test(u!)

  // Strict preference order:
  // 1) For public files, any /api/serve URL (edge cached)
  // 2) Signed URL (private)
  // 3) Non-signed URL that is not a raw storage host
  // 4) Thumbnail as a last resort (but NEVER raw storage)
  let chosen: string | null = null
  if (publicEntry && (looksServe(url) || looksProxy(url))) chosen = url
  else if (publicEntry && looksServe(thumb)) chosen = thumb
  else if (signed && !looksRawStorage(signed)) chosen = signed
  else if (url && !looksRawStorage(url)) chosen = url
  else if (thumb && !looksRawStorage(thumb)) chosen = thumb
  // Never return raw S3/OVH URLs - return null instead
  if (chosen && looksRawStorage(chosen)) return null
  if (!chosen) return null
  // Avoid cache-buster on signed URLs
  const isSigned = /[?&]X-Amz-(Signature|Credential)=/i.test(chosen)
  if (isSigned) return chosen
  const uploadedAt: string | undefined = (entry as any)?.uploaded_at || undefined
  if (uploadedAt) {
    const ts = Date.parse(uploadedAt)
    if (!Number.isNaN(ts)) {
      const sep = chosen.includes('?') ? '&' : '?'
      return `${chosen}${sep}v=${ts}`
    }
  }
  return chosen
}

function AnimatePresence({ children, mode }: { children: React.ReactNode, mode?: string }) {
  return <>{children}</>
}
