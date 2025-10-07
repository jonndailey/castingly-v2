'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Globe, Mail, Phone, MapPin, Calendar, Award, Download,
  Play, ChevronRight, Star, Film, Briefcase, GraduationCap,
  Languages, Users, ExternalLink, Share2, Instagram, Twitter,
  Facebook, Youtube, Linkedin, ArrowLeft
} from 'lucide-react'

export default function PublicTalentProfilePage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState('about')
  const [showContactModal, setShowContactModal] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper function to convert username back to search for actor
  const findActorByUsername = async (username) => {
    try {
      console.log('Searching for actor with slug:', username)
      
      // First try to get all actors and find by generating slugs
      const allActorsResponse = await fetch('/api/actors?limit=1000')
      
      if (!allActorsResponse.ok) {
        throw new Error('Failed to fetch actors')
      }
      
      const allActorsData = await allActorsResponse.json()
      console.log('Total actors found:', allActorsData.actors?.length)
      
      // Find the best match based on slug generation
      const generateSlug = (name) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim()
      }
      
      // Try to find exact match
      const actor = allActorsData.actors?.find(actor => {
        const actorSlug = generateSlug(actor.name)
        console.log(`Comparing actor "${actor.name}" -> slug "${actorSlug}" with "${username}"`)
        return actorSlug === username
      })
      
      if (!actor) {
        console.log('No exact match found')
        throw new Error('Actor not found')
      }
      
      console.log('Found actor:', actor)
      
      // Fetch full actor details
      const actorResponse = await fetch(`/api/actors/${actor.id}`)
      if (!actorResponse.ok) {
        throw new Error('Failed to fetch actor details')
      }
      
      return await actorResponse.json()
      
    } catch (error) {
      console.error('Error finding actor:', error)
      throw error
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const actorData = await findActorByUsername(params.username)
        
        // Transform actor data to profile format
        const transformedProfile = {
          username: params.username,
          name: actorData.name || 'Actor',
          tagline: 'Professional Actor',
          location: actorData.location || 'Los Angeles, CA',
          union: 'Non-Union',
          agency: 'Available for Representation',
          agentName: 'Contact for Details',
          profileImage: actorData.media?.headshots?.[0] 
            ? `/api/media/images${actorData.media.headshots[0].media_url.replace('/downloaded_images', '')}` 
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(actorData.name)}&size=400&background=6366f1&color=fff`,
          coverImage: '/api/placeholder/1200/400',
          bio: actorData.bio || 'Professional actor available for casting opportunities.',
          
          stats: {
            credits: 0,
            awards: 0,
            yearsExperience: 0,
            languages: 1
          },

          headshots: actorData.media?.headshots?.map((headshot, index) => ({
            id: index + 1,
            url: `/api/media/images${headshot.media_url.replace('/downloaded_images', '')}`,
            caption: headshot.caption || `Headshot ${index + 1}`
          })) || [],

          gallery: actorData.media?.all?.filter(media => media.media_type === 'gallery')?.map((photo, index) => ({
            id: index + 1,
            url: `/api/media/images${photo.media_url.replace('/downloaded_images', '')}`,
            caption: photo.caption || `Gallery ${index + 1}`
          })) || [],

          reels: actorData.media?.reels?.map((reel, index) => ({
            id: index + 1,
            title: reel.title || `Demo Reel ${index + 1}`,
            duration: '2:30',
            thumbnail: '/api/placeholder/400/225',
            url: reel.media_url || '#'
          })) || [],

          experience: [],
          training: [],
          skills: Array.isArray(actorData.skills) 
            ? actorData.skills 
            : typeof actorData.skills === 'string' 
              ? actorData.skills.split(',').map(s => s.trim()).filter(Boolean)
              : [],

          physicalAttributes: {
            height: actorData.height || 'Not specified',
            hair: actorData.hair_color || 'Not specified',
            eyes: actorData.eye_color || 'Not specified'
          },

          archetypes: [],

          socialMedia: {
            instagram: actorData.instagram || null,
            twitter: actorData.twitter || null,
            website: actorData.website || null
          }
        }
        
        setProfile(transformedProfile)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (params.username) {
      loadProfile()
    }
  }, [params.username])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">The actor profile you're looking for doesn't exist.</p>
          <Link href="/" className="text-primary-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.name} - Actor Profile`,
        text: profile.tagline,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-2xl font-heading font-bold gradient-text">Castingly</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={() => setShowContactModal(true)}
                className="btn-touch bg-primary-600 text-white hover:bg-primary-700"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Image */}
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover"
            />
            
            {/* Profile Info */}
            <div className="flex-grow">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-lg text-gray-600 mt-2">{profile.tagline}</p>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {profile.union}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {profile.agency}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{profile.stats.credits}</div>
                  <div className="text-xs text-gray-600">Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{profile.stats.awards}</div>
                  <div className="text-xs text-gray-600">Awards</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{profile.stats.yearsExperience}</div>
                  <div className="text-xs text-gray-600">Years Exp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{profile.stats.languages}</div>
                  <div className="text-xs text-gray-600">Languages</div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex md:flex-col gap-2">
              {profile.socialMedia.instagram && (
                <a href={`https://instagram.com/${profile.socialMedia.instagram.substring(1)}`} 
                   target="_blank" rel="noopener noreferrer"
                   className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {profile.socialMedia.twitter && (
                <a href={`https://twitter.com/${profile.socialMedia.twitter.substring(1)}`}
                   target="_blank" rel="noopener noreferrer"
                   className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {profile.socialMedia.youtube && (
                <a href={`https://youtube.com/@${profile.socialMedia.youtube}`}
                   target="_blank" rel="noopener noreferrer"
                   className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <nav className="flex overflow-x-auto">
            {['about', 'media', 'experience', 'skills'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                  {profile.bio}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Physical Attributes</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(profile.physicalAttributes).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm text-gray-500 capitalize">{key}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Character Types</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.archetypes.map((type) => (
                    <span key={type} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Headshots</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profile.headshots && profile.headshots.length > 0 ? (
                    profile.headshots.map((headshot) => (
                      <div key={headshot.id} className="group cursor-pointer">
                        <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={headshot.url} 
                            alt={headshot.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">{headshot.caption}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500 italic">No headshots available</p>
                    </div>
                  )}
                </div>
              </div>

              {profile.gallery && profile.gallery.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.gallery.map((photo) => (
                      <div key={photo.id} className="group cursor-pointer">
                        <div className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={photo.url} 
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">{photo.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Demo Reels</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {profile.reels.map((reel) => (
                    <a 
                      key={reel.id}
                      href={reel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={reel.thumbnail} 
                          alt={reel.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {reel.duration}
                        </span>
                      </div>
                      <p className="font-medium mt-2">{reel.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Credits</h2>
                <div className="space-y-4">
                  {profile.experience.map((credit) => (
                    <div key={credit.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      <Film className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-grow">
                        <h3 className="font-semibold">{credit.title}</h3>
                        <p className="text-primary-600">{credit.project}</p>
                        <p className="text-sm text-gray-600">
                          {credit.type} • {credit.year} • Dir. {credit.director}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Training & Education</h2>
                <div className="space-y-4">
                  {profile.training.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{item.institution}</h3>
                        <p className="text-gray-600">{item.degree}</p>
                        <p className="text-sm text-gray-500">{item.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Special Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span 
                      key={skill}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No special skills listed</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold mb-4">Contact {profile.name}</h3>
            <p className="text-gray-600 mb-6">
              For professional inquiries, please contact through representation:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{profile.agency}</p>
                <p className="text-sm text-gray-600">Agent: {profile.agentName}</p>
                <div className="mt-3 space-y-2">
                  <a href="mailto:agent@caa.com" className="flex items-center gap-2 text-primary-600 hover:underline">
                    <Mail className="w-4 h-4" />
                    agent@caa.com
                  </a>
                  <a href="tel:+13105551234" className="flex items-center gap-2 text-primary-600 hover:underline">
                    <Phone className="w-4 h-4" />
                    (310) 555-1234
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
              <a
                href="mailto:agent@caa.com"
                className="flex-1 btn-touch bg-primary-600 text-white hover:bg-primary-700 text-center"
              >
                Send Email
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}