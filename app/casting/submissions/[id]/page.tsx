'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Share,
  Star,
  Heart,
  MessageSquare,
  Calendar,
  Clock,
  Eye,
  User,
  MapPin,
  Phone,
  Mail,
  Award,
  CheckCircle,
  XCircle,
  Flag,
  Bookmark,
  Send,
  FileText,
  Camera,
  Video,
  Headphones,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Edit,
  Save,
  AlertCircle,
  Info
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useAuthStore from '@/lib/store/auth-store'

// Mock submission data for detailed view
const getSubmissionById = (id: string) => {
  return {
    id: id,
    submittedAt: new Date(Date.now() - 86400000 * 3),
    status: 'new',
    priority: 'high',
    rating: null,
    notes: '',
    flagged: false,
    shortlisted: false,
    viewCount: 2,
    lastViewed: new Date(Date.now() - 86400000),
    matchScore: 94,
    
    // Actor Information
    actor: {
      id: 'actor1',
      name: 'Elena Rodriguez',
      avatar: 'https://placehold.co/300x300/e8d5f2/9c27b0?text=ER',
      age: 28,
      gender: 'Female',
      ethnicity: 'Hispanic/Latino',
      height: "5'6\"",
      weight: '125 lbs',
      hairColor: 'Dark Brown',
      eyeColor: 'Brown',
      location: 'Los Angeles, CA',
      phone: '(555) 123-4567',
      email: 'elena.rodriguez.actor@email.com',
      union: 'SAG-AFTRA',
      experience: 'Professional',
      archetype: 'Leading Woman',
      
      // Agent/Representation
      agent: {
        name: 'Michael Chen',
        agency: 'WME',
        phone: '(555) 987-6543',
        email: 'mchen@wme.com'
      },
      
      // Skills & Specialties
      specialties: ['Drama', 'Comedy', 'Musical Theatre', 'Commercial'],
      skills: ['Fluent Spanish', 'Classical Voice', 'Ballet', 'Piano', 'Stage Combat'],
      accents: ['Standard American', 'Mexican', 'Neutral Spanish'],
      languages: ['English (Native)', 'Spanish (Native)', 'French (Conversational)'],
      
      // Experience
      training: [
        'Juilliard School - BFA Acting (2018)',
        'Groundlings - Improv & Sketch (2019)',
        'Ivana Chubbuck Studio - Advanced Scene Study (2020-2022)'
      ],
      
      credits: [
        { type: 'Film', title: 'The Silent Hour', role: 'Detective Maria Santos', year: 2023, director: 'James Wilson' },
        { type: 'TV', title: 'Brooklyn Medical', role: 'Dr. Carmen Valdez (Recurring)', year: 2022, network: 'NBC' },
        { type: 'Theater', title: 'In the Heights', role: 'Vanessa', year: 2021, venue: 'Pantages Theatre' },
        { type: 'Commercial', title: 'Coca-Cola Holiday Campaign', role: 'Lead', year: 2023, agency: 'McCann' }
      ],
      
      awards: [
        'Best Supporting Actress - LA Film Festival 2023',
        'Outstanding Performance - Theatre West 2021'
      ]
    },
    
    // Project Information
    project: {
      id: 'proj1',
      title: 'Shadow Protocol',
      role: 'Agent Sarah Martinez',
      roleType: 'Lead',
      description: 'A skilled undercover agent who must infiltrate a international crime syndicate. Requires strong dramatic range, action sequences, and bilingual dialogue (English/Spanish).',
      requirements: [
        'Female, 25-35 years old',
        'Hispanic/Latino or can authentically portray',
        'Fluent in Spanish and English',
        'Athletic build for action sequences',
        'Previous dramatic television/film experience',
        'Available for 3-month shoot in Los Angeles'
      ],
      payRange: '$15,000 - $25,000/episode',
      shootDates: 'March 15 - June 30, 2024',
      location: 'Los Angeles, CA',
      director: 'Maria Santos',
      network: 'Netflix',
      genre: 'Action/Drama'
    },
    
    // Submission Materials
    materials: {
      selfTape: {
        url: 'https://player.vimeo.com/video/76979871',
        thumbnail: 'https://placehold.co/640x360/1a1a1a/ffffff?text=Self-Tape',
        duration: '4:32',
        uploadDate: new Date(Date.now() - 86400000 * 3),
        scenes: [
          {
            name: 'Scene 12 - Interrogation',
            description: 'Sarah questions a suspect about the crime syndicate',
            timestamp: '0:00',
            notes: 'Shows dramatic intensity and bilingual skills'
          },
          {
            name: 'Scene 18 - Action Sequence',
            description: 'Sarah engages in hand-to-hand combat',
            timestamp: '2:15',
            notes: 'Demonstrates physicality and stunt capability'
          }
        ],
        fileSize: '247 MB',
        format: 'MP4'
      },
      
      reel: {
        url: 'https://player.vimeo.com/video/76979871',
        thumbnail: 'https://placehold.co/640x360/2a2a2a/ffffff?text=Demo-Reel',
        duration: '3:45',
        uploadDate: new Date(Date.now() - 86400000 * 30),
        description: 'Professional demo reel showcasing range from dramatic to comedic work',
        fileSize: '186 MB',
        format: 'MP4'
      },
      
      headshots: [
        {
          url: 'https://placehold.co/800x1000/e8d5f2/9c27b0?text=Professional+Headshot',
          type: 'Professional',
          photographer: 'David Kim Photography',
          uploadDate: new Date(Date.now() - 86400000 * 60)
        },
        {
          url: 'https://placehold.co/800x1000/f2e8d5/b09c27?text=Commercial+Headshot',
          type: 'Commercial',
          photographer: 'Sarah Mitchell Studios',
          uploadDate: new Date(Date.now() - 86400000 * 60)
        },
        {
          url: 'https://placehold.co/800x1000/d5f2e8/27b09c?text=Theatrical+Headshot',
          type: 'Theatrical',
          photographer: 'David Kim Photography',
          uploadDate: new Date(Date.now() - 86400000 * 60)
        }
      ],
      
      resume: {
        url: '/documents/elena_rodriguez_resume.pdf',
        uploadDate: new Date(Date.now() - 86400000 * 30),
        fileSize: '2.1 MB'
      },
      
      additionalMaterials: [
        {
          type: 'Voice Sample',
          name: 'Spanish Monologue Sample',
          url: '/audio/elena_spanish_monologue.mp3',
          duration: '2:15',
          description: 'Dramatic monologue in Spanish demonstrating vocal range'
        },
        {
          type: 'Photo',
          name: 'Full Body Shot',
          url: 'https://placehold.co/600x800/e8d5f2/9c27b0?text=Full+Body',
          description: 'Recent full body photo for costume/wardrobe reference'
        }
      ]
    },
    
    // Submission History
    timeline: [
      {
        date: new Date(Date.now() - 86400000 * 3),
        action: 'Submission Received',
        details: 'Complete submission received via agent portal',
        user: 'System'
      },
      {
        date: new Date(Date.now() - 86400000 * 2),
        action: 'Viewed by Casting',
        details: 'Materials reviewed by casting team',
        user: 'Jennifer Martinez (CD)'
      },
      {
        date: new Date(Date.now() - 86400000),
        action: 'Flagged for Review',
        details: 'Flagged as high priority for director review',
        user: 'Jennifer Martinez (CD)'
      }
    ]
  }
}

export default function SubmissionReview() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [submission, setSubmission] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('materials')
  const [currentVideo, setCurrentVideo] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentHeadshot, setCurrentHeadshot] = useState(0)
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('new')
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [isFlagged, setIsFlagged] = useState(false)
  
  useEffect(() => {
    if (params?.id) {
      const submissionData = getSubmissionById(params.id as string)
      setSubmission(submissionData)
      setRating(submissionData.rating)
      setNotes(submissionData.notes)
      setStatus(submissionData.status)
      setIsShortlisted(submissionData.shortlisted)
      setIsFlagged(submissionData.flagged)
    }
  }, [params?.id])
  
  if (!submission) {
    return (
      <AppLayout>
        <PageContent>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submission...</p>
            </div>
          </div>
        </PageContent>
      </AppLayout>
    )
  }
  
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    console.log('Status changed to:', newStatus)
  }
  
  const handleSave = () => {
    console.log('Saving submission with:', { rating, notes, status, isShortlisted, isFlagged })
    // Handle save logic
  }
  
  const handleCallback = () => {
    setStatus('callback')
    console.log('Scheduling callback for:', submission.actor.name)
  }
  
  const handlePass = () => {
    setStatus('pass')
    console.log('Passing on:', submission.actor.name)
  }
  
  const statusConfig = {
    new: { label: 'New', color: 'default', icon: Clock },
    reviewed: { label: 'Reviewed', color: 'secondary', icon: Eye },
    shortlisted: { label: 'Shortlisted', color: 'warning', icon: Heart },
    callback: { label: 'Callback', color: 'success', icon: Star },
    offer: { label: 'Offer', color: 'success', icon: CheckCircle },
    pass: { label: 'Pass', color: 'error', icon: XCircle }
  }
  
  const currentStatusConfig = statusConfig[status as keyof typeof statusConfig]
  const StatusIcon = currentStatusConfig.icon
  
  return (
    <AppLayout>
      <PageHeader
        title={submission.actor.name}
        subtitle={`${submission.project.title} - ${submission.project.role}`}
        actions={
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={() => setIsShortlisted(!isShortlisted)}
              variant={isShortlisted ? 'default' : 'outline'}
              size="sm"
            >
              <Heart className={`w-4 h-4 mr-2 ${isShortlisted ? 'fill-current' : ''}`} />
              {isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </Button>
            <Button
              onClick={() => setIsFlagged(!isFlagged)}
              variant={isFlagged ? 'default' : 'outline'}
              size="sm"
            >
              <Flag className={`w-4 h-4 mr-2 ${isFlagged ? 'fill-current' : ''}`} />
              {isFlagged ? 'Flagged' : 'Flag'}
            </Button>
            <Button onClick={handleSave} variant="default">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        }
      />
      
      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={currentStatusConfig.color as any}
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      <StatusIcon className="w-4 h-4" />
                      {currentStatusConfig.label}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {submission.project.roleType}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {submission.matchScore}% Match
                    </Badge>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            rating && star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCallback}
                    variant="success"
                    className="flex-1"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Schedule Callback
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('reviewed')}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Mark Reviewed
                  </Button>
                  <Button
                    onClick={handlePass}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Pass
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="materials" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Materials
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="experience" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Experience
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="materials" className="space-y-6">
                {/* Self-Tape Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Self-Tape Audition
                    </CardTitle>
                    <CardDescription>
                      Duration: {submission.materials.selfTape.duration} • Uploaded {submission.materials.selfTape.uploadDate.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative group">
                      <iframe
                        src={submission.materials.selfTape.url}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Share className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Maximize className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Scene Breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Scene Breakdown</h4>
                      {submission.materials.selfTape.scenes.map((scene: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{scene.name}</h5>
                            <Badge variant="outline" size="sm">{scene.timestamp}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{scene.description}</p>
                          <p className="text-xs text-blue-600">{scene.notes}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Demo Reel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Demo Reel
                    </CardTitle>
                    <CardDescription>
                      Duration: {submission.materials.reel.duration} • {submission.materials.reel.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={submission.materials.reel.url}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Headshots */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Professional Headshots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {submission.materials.headshots.map((headshot: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div 
                            className="aspect-[4/5] bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setCurrentHeadshot(index)}
                          >
                            <img
                              src={headshot.url}
                              alt={`${headshot.type} headshot`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">{headshot.type}</p>
                            <p className="text-xs text-gray-500">{headshot.photographer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Additional Materials */}
                {submission.materials.additionalMaterials.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Additional Materials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {submission.materials.additionalMaterials.map((material: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              {material.type === 'Voice Sample' ? (
                                <Headphones className="w-5 h-5 text-purple-500" />
                              ) : (
                                <Camera className="w-5 h-5 text-blue-500" />
                              )}
                              <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-sm text-gray-600">{material.description}</p>
                                {material.duration && (
                                  <p className="text-xs text-gray-500">Duration: {material.duration}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="profile" className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actor Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Age</p>
                        <p className="font-medium">{submission.actor.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Gender</p>
                        <p className="font-medium">{submission.actor.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ethnicity</p>
                        <p className="font-medium">{submission.actor.ethnicity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Height</p>
                        <p className="font-medium">{submission.actor.height}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Hair Color</p>
                        <p className="font-medium">{submission.actor.hairColor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Eye Color</p>
                        <p className="font-medium">{submission.actor.eyeColor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{submission.actor.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Union Status</p>
                        <p className="font-medium">{submission.actor.union}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Experience Level</p>
                        <p className="font-medium">{submission.actor.experience}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Skills & Specialties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Specialties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {submission.actor.specialties.map((specialty: string) => (
                          <Badge key={specialty} variant="outline">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Special Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {submission.actor.skills.map((skill: string) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Languages & Accents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {submission.actor.languages.map((language: string) => (
                          <li key={language} className="text-sm">{language}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Accents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {submission.actor.accents.map((accent: string) => (
                          <Badge key={accent} variant="outline">
                            {accent}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="experience" className="space-y-6">
                {/* Training */}
                <Card>
                  <CardHeader>
                    <CardTitle>Training & Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {submission.actor.training.map((training: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{training}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Credits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Credits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {submission.actor.credits.map((credit: any, index: number) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{credit.title}</h4>
                            <Badge variant="outline" size="sm">{credit.year}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{credit.role}</span> • {credit.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {credit.director && `Dir: ${credit.director}`}
                            {credit.network && ` • ${credit.network}`}
                            {credit.venue && ` • ${credit.venue}`}
                            {credit.agency && ` • ${credit.agency}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Awards */}
                {submission.actor.awards.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Awards & Recognition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {submission.actor.awards.map((award: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{award}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {submission.timeline.map((event: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{event.action}</h4>
                              <span className="text-sm text-gray-500">
                                {event.date.toLocaleDateString()} at {event.date.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{event.details}</p>
                            <p className="text-xs text-gray-500">by {event.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actor Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <img 
                      src={submission.actor.avatar} 
                      alt={submission.actor.name}
                      className="w-full h-full object-cover"
                    />
                  </Avatar>
                  <h3 className="text-xl font-heading font-semibold">{submission.actor.name}</h3>
                  <p className="text-gray-600">{submission.actor.archetype}</p>
                  <Badge variant="outline" className="mt-2">
                    {submission.actor.union}
                  </Badge>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{submission.actor.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{submission.actor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{submission.actor.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Agent/Rep Info */}
            <Card>
              <CardHeader>
                <CardTitle>Representation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{submission.actor.agent.name}</p>
                    <p className="text-sm text-gray-600">{submission.actor.agent.agency}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{submission.actor.agent.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{submission.actor.agent.email}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Project Match */}
            <Card>
              <CardHeader>
                <CardTitle>Project Match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {submission.matchScore}%
                    </div>
                    <p className="text-sm text-gray-600">Overall Match Score</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Age Range</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ethnicity</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Language Skills</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Experience Level</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Availability</span>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Casting Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this submission..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                  <span>{notes.length}/500 characters</span>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Audition
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send to Director
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download All Materials
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Share className="w-4 h-4 mr-2" />
                    Share with Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </AppLayout>
  )
}
