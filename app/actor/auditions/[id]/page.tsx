'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
  Star,
  ChevronLeft,
  FileText,
  Navigation,
  Camera,
  Mic,
  Download,
  Upload,
  MessageCircle,
  Users,
  Building,
  Mail,
  ExternalLink
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import useAuthStore from '@/lib/store/auth-store'

// Mock audition detail data
const getAuditionData = (id: string) => {
  const auditions: Record<string, any> = {
    '1': {
      id: '1',
      project: {
        title: 'City Lights Season 2',
        type: 'TV Series',
        network: 'HBO Max',
        genre: 'Crime Drama',
        synopsis: 'A gritty crime drama following detectives in Atlanta as they navigate complex cases and personal challenges.',
        productionCompany: 'Peachtree Productions',
        shootingDates: 'March 2025 - August 2025',
        location: 'Atlanta, GA'
      },
      role: {
        name: 'Detective Marcus Williams',
        type: 'Series Regular',
        ageRange: '35-45',
        ethnicity: 'Open',
        gender: 'Male',
        description: 'A seasoned detective with a troubled past. Marcus is tough but fair, with a dry sense of humor that masks deeper emotional wounds. Must be physically fit and comfortable with action sequences.',
        scenes: 'Approximately 8 episodes',
        rate: 'SAG-AFTRA Scale + 10%'
      },
      auditionDetails: {
        type: 'Callback',
        round: 2,
        date: new Date(Date.now() + 86400000 * 2).toISOString(),
        time: '2:30 PM EST',
        duration: '45 minutes',
        format: 'In-Person',
        location: {
          venue: 'Casting Studios Atlanta',
          address: '1234 Peachtree St NE',
          city: 'Atlanta',
          state: 'GA',
          zip: '30309',
          room: 'Studio B',
          floor: '3rd Floor',
          parking: 'Free parking available in building garage. Enter on Spring St.',
          publicTransit: 'MARTA Red Line - Arts Center Station (5 min walk)'
        }
      },
      castingTeam: {
        castingDirector: {
          name: 'Michael Chen',
          company: 'Chen Casting',
          email: 'casting@chencasting.com',
          phone: '(404) 555-0123'
        },
        associate: {
          name: 'Sarah Johnson',
          email: 'sarah@chencasting.com'
        }
      },
      requirements: {
        sides: {
          available: true,
          pages: 5,
          downloadUrl: '#',
          scenes: ['INT. POLICE STATION - DAY', 'EXT. CRIME SCENE - NIGHT'],
          dueDate: 'Please prepare all sides'
        },
        wardrobe: 'Business casual - think detective off-duty. Earth tones preferred. No logos.',
        preparation: [
          'Memorize all sides',
          'Prepare one contemporary monologue (1-2 minutes)',
          'Be ready for cold reads',
          'Possible improv exercises'
        ],
        brings: [
          'Headshot and resume (3 copies)',
          'Water bottle',
          'Reading glasses if needed'
        ]
      },
      status: 'confirmed',
      notes: 'The team loved your initial read. Focus on bringing more vulnerability to the second scene. Director will be present for this callback.',
      timeline: {
        submitted: new Date(Date.now() - 86400000 * 7).toISOString(),
        firstAudition: new Date(Date.now() - 86400000 * 3).toISOString(),
        callback: new Date(Date.now() + 86400000 * 2).toISOString(),
        expectedDecision: new Date(Date.now() + 86400000 * 5).toISOString()
      }
    },
    '2': {
      id: '2',
      project: {
        title: 'Summer Dreams',
        type: 'Feature Film',
        genre: 'Romantic Comedy',
        synopsis: 'A heartwarming story about finding love in unexpected places during one unforgettable summer.',
        productionCompany: 'Sunshine Films',
        shootingDates: 'April 2025 - May 2025',
        location: 'Savannah, GA'
      },
      role: {
        name: 'Tom Bradley',
        type: 'Supporting',
        ageRange: '28-35',
        ethnicity: 'Open',
        gender: 'Male',
        description: 'The protagonist\'s best friend. Funny, loyal, and always ready with advice (good or bad). Comic timing essential.',
        scenes: '12 scenes',
        rate: 'SAG-AFTRA Scale'
      },
      auditionDetails: {
        type: 'Self-Tape',
        round: 1,
        date: new Date(Date.now() + 86400000 * 4).toISOString(),
        time: 'Due by 11:59 PM EST',
        duration: 'Max 5 minutes total',
        format: 'Video Submission',
        technical: {
          format: 'MP4 or MOV',
          resolution: 'Minimum 720p',
          sound: 'Clear audio required',
          framing: 'Medium shot, well-lit',
          slate: 'Name, agency (if applicable), role auditioning for'
        }
      },
      castingTeam: {
        castingDirector: {
          name: 'Jennifer Martinez',
          company: 'Coastal Casting',
          email: 'jmartinez@coastalcasting.com'
        }
      },
      requirements: {
        sides: {
          available: true,
          pages: 3,
          downloadUrl: '#',
          scenes: ['EXT. BEACH - DAY', 'INT. COFFEE SHOP - MORNING'],
          dueDate: 'Upload by deadline'
        },
        wardrobe: 'Casual summer wear. Bright colors welcome.',
        preparation: [
          'Two scenes provided',
          'Reader off-camera is fine',
          'Multiple takes allowed, submit best one'
        ],
        uploadInstructions: 'Upload via EcoCast or WeTransfer link to casting@sunshinefilms.com'
      },
      status: 'preparing',
      notes: 'Great opportunity for comedy showcase. Production is fast-tracked.'
    }
  }
  
  return auditions[id] || auditions['1'] // Default to audition 1 if ID not found
}

export default function AuditionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuthStore()
  const [audition, setAudition] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (params?.id) {
      const data = getAuditionData(params.id as string)
      setAudition(data)
    }
  }, [params?.id])

  if (!audition) {
    return (
      <AppLayout>
        <PageContent className="flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Loading Audition Details</h3>
                <p className="text-gray-500">Please wait...</p>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </AppLayout>
    )
  }

  const auditionDate = new Date(audition.auditionDetails.date)
  const isUpcoming = auditionDate > new Date()
  const isPastDeadline = !isUpcoming && audition.auditionDetails.format === 'Self-Tape'

  return (
    <AppLayout>
      <PageHeader
        title="Audition Details"
        subtitle={`${audition.project.title} - ${audition.role.name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/actor/auditions')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Auditions
            </Button>
          </div>
        }
      />
      
      <PageContent>
        <div className="max-w-6xl mx-auto">
          {/* Status Alert */}
          {isUpcoming && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your audition is confirmed for {auditionDate.toLocaleDateString()} at {audition.auditionDetails.time}
              </AlertDescription>
            </Alert>
          )}
          
          {isPastDeadline && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The submission deadline for this self-tape has passed.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            {['details', 'requirements', 'location', 'materials'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'details' && (
                <>
                  {/* Project Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Project Information</span>
                        <Badge>{audition.project.type}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{audition.project.title}</h3>
                        <p className="text-gray-600">{audition.project.network || audition.project.productionCompany}</p>
                      </div>
                      <p className="text-sm">{audition.project.synopsis}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Genre:</span>
                          <p className="font-medium">{audition.project.genre}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Shooting:</span>
                          <p className="font-medium">{audition.project.shootingDates}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium">{audition.project.location}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Production:</span>
                          <p className="font-medium">{audition.project.productionCompany}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Role Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Role Details</span>
                        <Badge variant="secondary">{audition.role.type}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{audition.role.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{audition.role.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Age Range:</span>
                          <p className="font-medium">{audition.role.ageRange}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Gender:</span>
                          <p className="font-medium">{audition.role.gender}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Ethnicity:</span>
                          <p className="font-medium">{audition.role.ethnicity}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Screen Time:</span>
                          <p className="font-medium">{audition.role.scenes}</p>
                        </div>
                      </div>
                      {audition.role.rate && (
                        <div className="pt-2 border-t">
                          <span className="text-gray-500 text-sm">Rate:</span>
                          <p className="font-medium">{audition.role.rate}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'requirements' && (
                <>
                  {/* Preparation Requirements */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Preparation Requirements</CardTitle>
                      <CardDescription>Everything you need to prepare for this audition</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">What to Prepare:</h4>
                        <ul className="space-y-2">
                          {audition.requirements.preparation.map((item: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Wardrobe:</h4>
                        <p className="text-sm text-gray-600">{audition.requirements.wardrobe}</p>
                      </div>

                      {audition.requirements.brings && (
                        <div>
                          <h4 className="font-medium mb-2">What to Bring:</h4>
                          <ul className="space-y-1">
                            {audition.requirements.brings.map((item: string, index: number) => (
                              <li key={index} className="text-sm text-gray-600">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {audition.requirements.uploadInstructions && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2 text-blue-900">Submission Instructions:</h4>
                          <p className="text-sm text-blue-800">{audition.requirements.uploadInstructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Technical Requirements (for self-tapes) */}
                  {audition.auditionDetails.technical && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Technical Requirements</CardTitle>
                        <CardDescription>Self-tape specifications</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Format:</span>
                            <p className="font-medium">{audition.auditionDetails.technical.format}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Resolution:</span>
                            <p className="font-medium">{audition.auditionDetails.technical.resolution}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Sound:</span>
                            <p className="font-medium">{audition.auditionDetails.technical.sound}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Framing:</span>
                            <p className="font-medium">{audition.auditionDetails.technical.framing}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Slate:</span>
                            <p className="font-medium">{audition.auditionDetails.technical.slate}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {activeTab === 'location' && audition.auditionDetails.location && (
                <>
                  {/* Location Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Location Details</CardTitle>
                      <CardDescription>Where to go for your audition</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{audition.auditionDetails.location.venue}</h3>
                        <p className="text-gray-600">
                          {audition.auditionDetails.location.address}<br />
                          {audition.auditionDetails.location.city}, {audition.auditionDetails.location.state} {audition.auditionDetails.location.zip}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Room:</span>
                          <p className="font-medium">{audition.auditionDetails.location.room}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Floor:</span>
                          <p className="font-medium">{audition.auditionDetails.location.floor}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <div>
                          <h4 className="font-medium mb-1 flex items-center">
                            <Navigation className="h-4 w-4 mr-1" />
                            Parking
                          </h4>
                          <p className="text-sm text-gray-600">{audition.auditionDetails.location.parking}</p>
                        </div>
                        {audition.auditionDetails.location.publicTransit && (
                          <div>
                            <h4 className="font-medium mb-1">Public Transit</h4>
                            <p className="text-sm text-gray-600">{audition.auditionDetails.location.publicTransit}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3">
                        <Button variant="outline" className="flex-1">
                          <MapPin className="h-4 w-4 mr-2" />
                          Open in Maps
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Navigation className="h-4 w-4 mr-2" />
                          Get Directions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'materials' && (
                <>
                  {/* Sides/Scripts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Audition Materials</CardTitle>
                      <CardDescription>Scripts and sides for your audition</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {audition.requirements.sides.available ? (
                        <>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Audition Sides</h4>
                              <Badge>{audition.requirements.sides.pages} pages</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Scenes to prepare: {audition.requirements.sides.scenes.join(', ')}
                            </p>
                            <Button className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Download Sides (PDF)
                            </Button>
                          </div>

                          <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                              {audition.requirements.sides.dueDate}
                            </AlertDescription>
                          </Alert>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No materials available yet</p>
                          <p className="text-sm mt-1">Check back closer to your audition date</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upload Section (for self-tapes) */}
                  {audition.auditionDetails.format === 'Video Submission' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Submit Your Self-Tape</CardTitle>
                        <CardDescription>Upload your audition video</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium mb-1">Drop your video file here</p>
                          <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                          <Button variant="outline">Select Video File</Button>
                          <p className="text-xs text-gray-500 mt-4">
                            Accepted formats: {audition.auditionDetails.technical?.format || 'MP4, MOV'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Audition Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Audition Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Badge className="mr-2" variant={
                      audition.auditionDetails.type === 'Callback' ? 'default' : 'secondary'
                    }>
                      {audition.auditionDetails.type}
                    </Badge>
                    {audition.auditionDetails.round > 1 && (
                      <span className="text-gray-500">Round {audition.auditionDetails.round}</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{new Date(audition.auditionDetails.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{audition.auditionDetails.time}</span>
                    </div>
                    <div className="flex items-center">
                      {audition.auditionDetails.format === 'In-Person' ? (
                        <>
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{audition.auditionDetails.format}</span>
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{audition.auditionDetails.format}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    {audition.auditionDetails.format === 'Video Submission' ? (
                      <Button className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Self-Tape
                      </Button>
                    ) : (
                      <Button className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        Add to Calendar
                      </Button>
                    )}
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Casting
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Casting Team */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Casting Team</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{audition.castingTeam.castingDirector.name}</p>
                    <p className="text-sm text-gray-600">{audition.castingTeam.castingDirector.company}</p>
                    <div className="mt-2 space-y-1">
                      <a href={`mailto:${audition.castingTeam.castingDirector.email}`} 
                         className="text-sm text-blue-600 hover:underline flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {audition.castingTeam.castingDirector.email}
                      </a>
                      {audition.castingTeam.castingDirector.phone && (
                        <p className="text-sm flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {audition.castingTeam.castingDirector.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {audition.castingTeam.associate && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-500">Casting Associate</p>
                      <p className="font-medium">{audition.castingTeam.associate.name}</p>
                      {audition.castingTeam.associate.email && (
                        <a href={`mailto:${audition.castingTeam.associate.email}`}
                           className="text-sm text-blue-600 hover:underline">
                          {audition.castingTeam.associate.email}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {audition.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes from Casting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{audition.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              {audition.timeline && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Audition Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Submitted</span>
                        <span>{new Date(audition.timeline.submitted).toLocaleDateString()}</span>
                      </div>
                      {audition.timeline.firstAudition && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">First Audition</span>
                          <span>{new Date(audition.timeline.firstAudition).toLocaleDateString()}</span>
                        </div>
                      )}
                      {audition.timeline.callback && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Callback</span>
                          <span>{new Date(audition.timeline.callback).toLocaleDateString()}</span>
                        </div>
                      )}
                      {audition.timeline.expectedDecision && (
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Expected Decision</span>
                          <span>{new Date(audition.timeline.expectedDecision).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PageContent>
    </AppLayout>
  )
}