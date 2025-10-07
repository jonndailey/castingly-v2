'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  ChevronRight,
  Plus,
  Filter,
  Eye,
  MessageCircle,
  FileText,
  Navigation,
  Camera,
  Mic
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/lib/store/auth-store'

// Mock auditions data
const auditions = [
  {
    id: '1',
    project: 'City Lights Season 2',
    role: 'Detective Marcus',
    type: 'Callback',
    date: new Date(Date.now() + 86400000 * 2),
    time: '2:30 PM',
    duration: 45,
    location: {
      type: 'in-person',
      address: '1234 Casting Studios, Atlanta, GA 30309',
      room: 'Studio B',
      parking: 'Street parking available'
    },
    castingDirector: 'Michael Chen',
    status: 'confirmed',
    notes: 'Bring comfortable clothes for movement. Review scenes 12-15.',
    materials: ['Scene sides', 'Updated headshot'],
    attendees: ['Michael Chen', 'Producer Sarah Kim'],
    confirmation: {
      required: true,
      deadline: new Date(Date.now() + 86400000),
      status: 'pending'
    }
  },
  {
    id: '2',
    project: 'Nike Commercial',
    role: 'Basketball Player',
    type: 'Final Callback',
    date: new Date(Date.now() + 86400000 * 5),
    time: '10:00 AM',
    duration: 60,
    location: {
      type: 'virtual',
      platform: 'Zoom',
      link: 'https://zoom.us/j/123456789',
      meetingId: '123 456 789'
    },
    castingDirector: 'Jennifer Woods',
    status: 'confirmed',
    notes: 'Final callback! Wardrobe fitting will follow if selected.',
    materials: ['Athletic wear', 'Basketball'],
    attendees: ['Jennifer Woods', 'Creative Director', 'Client'],
    confirmation: {
      required: true,
      deadline: new Date(Date.now() + 86400000 * 3),
      status: 'confirmed'
    }
  },
  {
    id: '3',
    project: 'Indie Horror Film',
    role: 'Supporting Lead',
    type: 'Chemistry Read',
    date: new Date(Date.now() + 86400000 * 10),
    time: '4:00 PM',
    duration: 30,
    location: {
      type: 'in-person',
      address: '567 Production Office, Austin, TX 78701',
      room: 'Conference Room A',
      parking: 'Validation available'
    },
    castingDirector: 'Amy Rodriguez',
    status: 'tentative',
    notes: 'Chemistry read with potential co-star. Casual attire preferred.',
    materials: ['Scene sides', 'Comfortable clothes'],
    attendees: ['Amy Rodriguez', 'Director', 'Co-star auditionee'],
    confirmation: {
      required: true,
      deadline: new Date(Date.now() + 86400000 * 7),
      status: 'pending'
    }
  },
  {
    id: '4',
    project: 'Theater Workshop',
    role: 'Hamlet',
    type: 'Workshop Audition',
    date: new Date(Date.now() - 86400000 * 2),
    time: '6:00 PM',
    duration: 90,
    location: {
      type: 'in-person',
      address: '890 Theater District, New York, NY 10019',
      room: 'Rehearsal Room 3',
      parking: 'Paid parking garage'
    },
    castingDirector: 'Robert Hayes',
    status: 'completed',
    notes: 'Completed workshop audition. Awaiting feedback.',
    materials: ['Prepared monologue', 'Movement clothes'],
    attendees: ['Robert Hayes', 'Assistant Director'],
    confirmation: {
      required: false,
      deadline: null,
      status: 'confirmed'
    }
  }
]

export default function ActorAuditions() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const upcomingAuditions = auditions
    .filter(a => a.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  
  const todayAuditions = auditions.filter(a => 
    a.date.toDateString() === new Date().toDateString()
  )
  
  const filteredAuditions = auditions.filter(audition => {
    if (filterStatus === 'all') return true
    return audition.status === filterStatus
  })
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'success'
      case 'tentative': return 'warning'
      case 'completed': return 'secondary'
      case 'cancelled': return 'error'
      default: return 'secondary'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Callback': return <Star className="w-4 h-4" />
      case 'Final Callback': return <CheckCircle className="w-4 h-4" />
      case 'Chemistry Read': return <User className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }
  
  const handleConfirmation = (auditionId: string, confirm: boolean) => {
    console.log('Confirmation:', auditionId, confirm)
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Auditions & Schedule"
        subtitle="Manage your upcoming auditions and callbacks"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              variant="outline"
            >
              {viewMode === 'list' ? <Calendar className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              {viewMode === 'list' ? 'Calendar' : 'List'} View
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold">{todayAuditions.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold">{upcomingAuditions.length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {auditions.filter(a => a.confirmation.status === 'pending').length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">
                    {auditions.filter(a => {
                      const weekFromNow = new Date(Date.now() + 86400000 * 7)
                      return a.date >= new Date() && a.date <= weekFromNow
                    }).length}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setFilterStatus('all')}
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
          >
            All ({auditions.length})
          </Button>
          <Button
            onClick={() => setFilterStatus('confirmed')}
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            size="sm"
          >
            Confirmed ({auditions.filter(a => a.status === 'confirmed').length})
          </Button>
          <Button
            onClick={() => setFilterStatus('tentative')}
            variant={filterStatus === 'tentative' ? 'default' : 'outline'}
            size="sm"
          >
            Tentative ({auditions.filter(a => a.status === 'tentative').length})
          </Button>
          <Button
            onClick={() => setFilterStatus('completed')}
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
          >
            Completed ({auditions.filter(a => a.status === 'completed').length})
          </Button>
        </div>
        
        {/* Auditions List */}
        <div className="space-y-4">
          {filteredAuditions.map((audition, index) => (
            <motion.div
              key={audition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusColor(audition.status) as any}>
                              <span className="flex items-center gap-1">
                                {getTypeIcon(audition.type)}
                                {audition.type}
                              </span>
                            </Badge>
                            {audition.confirmation.status === 'pending' && (
                              <Badge variant="warning">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Confirmation Required
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-heading font-semibold mb-1">
                            {audition.project}
                          </h3>
                          <p className="text-gray-600">
                            Role: {audition.role} • CD: {audition.castingDirector}
                          </p>
                        </div>
                      </div>
                      
                      {/* Date & Time */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{audition.date.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{audition.time} ({audition.duration} min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {audition.location.type === 'in-person' ? (
                            <>
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>In Person</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 text-gray-400" />
                              <span>{audition.location.platform}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Location Details */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        {audition.location.type === 'in-person' ? (
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">{audition.location.address}</p>
                                {audition.location.room && (
                                  <p className="text-xs text-gray-500">{audition.location.room}</p>
                                )}
                                {audition.location.parking && (
                                  <p className="text-xs text-gray-500 mt-1">{audition.location.parking}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{audition.location.platform} Meeting</span>
                            </div>
                            <p className="text-xs text-gray-600">Meeting ID: {audition.location.meetingId}</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Notes */}
                      {audition.notes && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-1">Notes</p>
                              <p className="text-sm text-blue-800">{audition.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Materials & Attendees */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Required Materials</p>
                          <div className="flex flex-wrap gap-1">
                            {audition.materials.map(material => (
                              <Badge key={material} variant="outline" size="sm">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Attendees</p>
                          <div className="flex flex-wrap gap-1">
                            {audition.attendees.map(attendee => (
                              <Badge key={attendee} variant="secondary" size="sm">
                                {attendee}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="lg:w-48 space-y-3">
                      {audition.confirmation.required && audition.confirmation.status === 'pending' && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-xs font-medium text-yellow-700 mb-2">
                            Confirm by {audition.confirmation.deadline?.toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleConfirmation(audition.id, true)}
                              size="sm"
                              variant="success"
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              onClick={() => handleConfirmation(audition.id, false)}
                              size="sm"
                              variant="error"
                              className="flex-1"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {audition.location.type === 'in-person' && (
                          <Button variant="outline" size="sm" className="w-full">
                            <Navigation className="w-4 h-4 mr-2" />
                            Get Directions
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm" className="w-full">
                          <Calendar className="w-4 h-4 mr-2" />
                          Add to Calendar
                        </Button>
                        
                        <Button
                          onClick={() => router.push(`/actor/auditions/${audition.id}`)}
                          variant="default"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredAuditions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No auditions found
            </h3>
            <p className="text-gray-600 mb-4">
              {filterStatus === 'all' 
                ? "You don't have any scheduled auditions yet"
                : `No ${filterStatus} auditions found`}
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