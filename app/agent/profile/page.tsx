'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Award,
  Users,
  Star,
  Edit2,
  Camera,
  Save,
  X,
  Building,
  Briefcase,
  Clock,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle,
  Plus
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ForumActivityPanel } from '@/components/forum/forum-activity-panel'
import useAuthStore from '@/lib/store/auth-store'

// Mock agent profile data
const agentProfile = {
  id: 'agent1',
  name: 'Jennifer Martinez',
  title: 'Senior Talent Agent',
  agency: {
    name: 'Creative Artists Agency (CAA)',
    logo: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=CAA',
    tier: 'Top 10 Agency'
  },
  avatar: 'https://placehold.co/150x150/e8d5f2/9c27b0?text=JM',
  bio: "Senior talent agent with 12+ years of experience representing actors, directors, and writers in film, television, and theater. Specializing in emerging talent and career development with a focus on diverse storytelling.",
  contact: {
    phone: '+1 (323) 555-0123',
    email: 'j.martinez@caa.com',
    office: '+1 (310) 288-4545',
    assistant: 'Sarah Kim - s.kim@caa.com'
  },
  location: {
    office: 'Los Angeles, CA',
    territory: 'West Coast & National'
  },
  specializations: [
    'Film & Television',
    'Theater',
    'Commercial',
    'Voice Over',
    'Emerging Talent',
    'Diversity & Inclusion'
  ],
  stats: {
    yearsExperience: 12,
    activeClients: 47,
    bookingsThisYear: 89,
    averageDeal: '$125K',
    clientRetention: '94%',
    industryRating: 4.8
  },
  achievements: [
    {
      year: '2023',
      title: 'Agent of the Year',
      organization: 'Hollywood Reporter',
      description: 'Recognized for outstanding client representation and deal-making'
    },
    {
      year: '2022',
      title: 'Diversity Champion Award',
      organization: 'Talent Agents Association',
      description: 'For commitment to representing diverse voices in entertainment'
    },
    {
      year: '2021',
      title: 'Rising Star Agent',
      organization: 'Variety',
      description: 'Featured in Variety\'s list of top emerging talent agents'
    }
  ],
  recentDeals: [
    {
      client: 'Marcus Johnson',
      project: 'Netflix Series Lead',
      value: '$2.5M',
      date: new Date(Date.now() - 86400000 * 5)
    },
    {
      client: 'Elena Rodriguez',
      project: 'Warner Bros Feature',
      value: '$800K',
      date: new Date(Date.now() - 86400000 * 12)
    },
    {
      client: 'David Chen',
      project: 'HBO Limited Series',
      value: '$1.2M',
      date: new Date(Date.now() - 86400000 * 18)
    }
  ],
  memberSince: new Date('2019-03-15'),
  lastActive: new Date(Date.now() - 3600000)
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'roster', label: 'Client Roster' },
  { id: 'deals', label: 'Recent Deals' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'settings', label: 'Settings' }
]

export default function AgentProfile() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(agentProfile)
  
  const handleSave = () => {
    // Handle profile save
    console.log('Saving profile:', formData)
    setIsEditing(false)
  }
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <img 
                  src={formData.avatar} 
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              </Avatar>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="text-2xl font-bold"
                      />
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-heading font-bold">{formData.name}</h1>
                      <p className="text-xl text-gray-600 mb-2">{formData.title}</p>
                    </>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <img 
                      src={formData.agency.logo} 
                      alt={formData.agency.name}
                      className="w-8 h-8 rounded"
                    />
                    <div>
                      <p className="font-medium">{formData.agency.name}</p>
                      <Badge variant="secondary" size="sm">{formData.agency.tier}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={formData.lastActive > new Date(Date.now() - 3600000) ? 'success' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    {formData.lastActive > new Date(Date.now() - 3600000) ? 'Online' : 'Away'}
                  </Badge>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium">{formData.stats.industryRating}</span>
                  </div>
                </div>
              </div>
              
              {/* Bio */}
              <div className="mb-4">
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">{formData.bio}</p>
                )}
              </div>
              
              {/* Contact Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{formData.location.office}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{formData.contact.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{formData.contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formData.stats.yearsExperience} years exp.</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.activeClients}</p>
            <p className="text-sm text-gray-600">Active Clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.bookingsThisYear}</p>
            <p className="text-sm text-gray-600">Bookings (2024)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.averageDeal}</p>
            <p className="text-sm text-gray-600">Avg Deal Size</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.clientRetention}</p>
            <p className="text-sm text-gray-600">Retention Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.industryRating}</p>
            <p className="text-sm text-gray-600">Industry Rating</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.yearsExperience}</p>
            <p className="text-sm text-gray-600">Years Experience</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle>Specializations</CardTitle>
          <CardDescription>Areas of expertise and focus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {formData.specializations.map(spec => (
              <Badge key={spec} variant="outline" className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {spec}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const renderRecentDeals = () => (
    <div className="space-y-4">
      {formData.recentDeals.map((deal, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{deal.client}</h4>
                  <p className="text-sm text-gray-600">{deal.project}</p>
                  <p className="text-xs text-gray-400">{deal.date.toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{deal.value}</p>
                  <Badge variant="success" size="sm">Closed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
  
  const renderAchievements = () => (
    <div className="space-y-4">
      {formData.achievements.map((achievement, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <Badge variant="secondary">{achievement.year}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{achievement.organization}</p>
                  <p className="text-sm text-gray-500">{achievement.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
  
  return (
    <AppLayout>
      <PageHeader
        title="Agent Profile"
        subtitle="Manage your professional profile and agency information"
        actions={
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  variant="default"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        }
      />
      
      <PageContent>
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

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
        
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'roster' && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Roster</h3>
              <p className="text-gray-600 mb-4">Manage your talent roster and client relationships</p>
              <Button onClick={() => router.push('/agent/roster')}>
                View Full Roster
              </Button>
            </div>
          )}
          {activeTab === 'deals' && renderRecentDeals()}
          {activeTab === 'achievements' && renderAchievements()}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <p className="text-gray-600">Profile settings coming soon</p>
            </div>
          )}
        </motion.div>
      </PageContent>
    </AppLayout>
  )
}
