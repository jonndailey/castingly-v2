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
  Plus,
  Film,
  Tv,
  Theater,
  Mic,
  Eye,
  Trophy,
  Zap
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ForumActivityPanel } from '@/components/forum/forum-activity-panel'
import useAuthStore from '@/lib/store/auth-store'

// Mock casting director profile data
const castingProfile = {
  id: 'cd1',
  name: 'Sarah Mitchell',
  title: 'Senior Casting Director',
  company: {
    name: 'Mitchell Casting',
    logo: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=MC',
    type: 'Independent Casting Company',
    founded: '2010'
  },
  avatar: 'https://placehold.co/150x150/e8d5f2/9c27b0?text=SM',
  bio: "Award-winning casting director with 15+ years of experience in film, television, and streaming content. Specialized in discovering emerging talent and matching perfect actors to complex characters. Known for innovative casting choices and collaborative approach with directors and producers.",
  contact: {
    phone: '+1 (323) 555-0199',
    email: 's.mitchell@mitchellcasting.com',
    office: '+1 (310) 555-4545',
    assistant: 'Emma Thompson - e.thompson@mitchellcasting.com'
  },
  location: {
    office: 'Los Angeles, CA',
    territory: 'Global'
  },
  specializations: [
    'Feature Films',
    'Streaming Series',
    'Independent Films',
    'Commercials',
    'Emerging Talent',
    'Diversity Casting',
    'International Co-Productions'
  ],
  stats: {
    yearsExperience: 15,
    activeProjects: 8,
    castThisYear: 245,
    successfulBookings: 189,
    talentDatabase: 12500,
    industryRating: 4.9,
    avgProjectBudget: '$15M',
    clientRetention: 96
  },
  achievements: [
    {
      year: '2023',
      title: 'Outstanding Achievement in Casting - Drama Series',
      organization: 'Casting Society of America',
      project: 'Breaking Chains',
      description: 'Recognized for exceptional casting in Netflix drama series'
    },
    {
      year: '2022', 
      title: 'Diversity in Casting Excellence Award',
      organization: 'Hollywood Diversity Awards',
      project: 'Multiple Projects',
      description: 'For commitment to inclusive and representative casting'
    },
    {
      year: '2021',
      title: 'Emmy Nomination - Outstanding Casting',
      organization: 'Academy of Television Arts & Sciences',
      project: 'City Lights',
      description: 'Emmy nomination for outstanding casting in a drama series'
    },
    {
      year: '2020',
      title: 'Rising Star Casting Director',
      organization: 'Variety',
      project: 'Industry Recognition',
      description: 'Featured in Variety\'s list of top emerging casting professionals'
    }
  ],
  recentProjects: [
    {
      title: 'Shadow Protocol',
      studio: 'Netflix',
      type: 'TV Series',
      status: 'In Production',
      budget: '$25M',
      cast: 12,
      startDate: new Date('2024-01-15'),
      rolesTotal: 45,
      rolesFilled: 38
    },
    {
      title: 'Breaking Chains',
      studio: 'Warner Bros',
      type: 'Feature Film',
      status: 'Completed',
      budget: '$18M',
      cast: 8,
      startDate: new Date('2023-08-20'),
      rolesTotal: 25,
      rolesFilled: 25
    },
    {
      title: 'The Last Resort',
      studio: 'HBO',
      type: 'Limited Series',
      status: 'Pre-Production',
      budget: '$40M',
      cast: 15,
      startDate: new Date('2024-04-01'),
      rolesTotal: 32,
      rolesFilled: 8
    }
  ],
  clientTestimonials: [
    {
      client: 'David Rodriguez',
      title: 'Executive Producer, Netflix',
      project: 'Shadow Protocol',
      quote: "Sarah's ability to find the perfect actor for even the most challenging roles is unmatched. Her casting elevated our entire series.",
      rating: 5
    },
    {
      client: 'Michelle Chen',
      title: 'Director',
      project: 'Breaking Chains', 
      quote: "Working with Sarah was a dream. She understood my vision completely and brought me actors I never would have considered - all perfect fits.",
      rating: 5
    }
  ],
  memberSince: new Date('2018-03-15'),
  lastActive: new Date(Date.now() - 1800000) // 30 minutes ago
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Current Projects' },
  { id: 'achievements', label: 'Awards & Recognition' },
  { id: 'testimonials', label: 'Client Testimonials' },
  { id: 'settings', label: 'Settings' }
]

export default function CastingProfile() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(castingProfile)
  
  const handleSave = () => {
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
                      src={formData.company.logo} 
                      alt={formData.company.name}
                      className="w-8 h-8 rounded"
                    />
                    <div>
                      <p className="font-medium">{formData.company.name}</p>
                      <Badge variant="secondary" size="sm">{formData.company.type}</Badge>
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.activeProjects}</p>
            <p className="text-sm text-gray-600">Active Projects</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.castThisYear}</p>
            <p className="text-sm text-gray-600">Cast This Year</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.successfulBookings}</p>
            <p className="text-sm text-gray-600">Successful Bookings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold">{((formData.stats.successfulBookings / formData.stats.castThisYear) * 100).toFixed(0)}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
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
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.avgProjectBudget}</p>
            <p className="text-sm text-gray-600">Avg Budget</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-2xl font-bold">{(formData.stats.talentDatabase / 1000).toFixed(1)}K</p>
            <p className="text-sm text-gray-600">Talent Database</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold">{formData.stats.yearsExperience}</p>
            <p className="text-sm text-gray-600">Years Experience</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle>Casting Specializations</CardTitle>
          <CardDescription>Areas of expertise and project types</CardDescription>
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
  
  const renderCurrentProjects = () => (
    <div className="space-y-4">
      {formData.recentProjects.map((project, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={project.status === 'In Production' ? 'success' : project.status === 'Pre-Production' ? 'warning' : 'secondary'}>
                      {project.status}
                    </Badge>
                    <Badge variant="outline">
                      {project.type}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-1">
                    {project.title}
                  </h3>
                  <p className="text-gray-600">{project.studio}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-lg font-bold text-green-600">{project.budget}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Roles</p>
                  <p className="font-semibold">{project.rolesTotal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Roles Filled</p>
                  <p className="font-semibold text-green-600">{project.rolesFilled}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Main Cast</p>
                  <p className="font-semibold">{project.cast}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold">{project.startDate.toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Casting Progress</span>
                  <span className="text-sm text-gray-600">{((project.rolesFilled / project.rolesTotal) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(project.rolesFilled / project.rolesTotal) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/casting/projects/${project.title.toLowerCase().replace(/\s+/g, '-')}`)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Project
                </Button>
                <Button
                  onClick={() => router.push(`/casting/submissions?project=${project.title}`)}
                  variant="default"
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Review Submissions
                </Button>
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
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-heading font-semibold text-lg">{achievement.title}</h4>
                    <Badge variant="secondary">{achievement.year}</Badge>
                  </div>
                  <p className="text-gray-600 mb-1">{achievement.organization}</p>
                  <p className="text-sm font-medium text-blue-600 mb-2">{achievement.project}</p>
                  <p className="text-sm text-gray-700">{achievement.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
  
  const renderTestimonials = () => (
    <div className="space-y-4">
      {formData.clientTestimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{testimonial.client}</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{testimonial.title}</p>
                  <p className="text-xs text-blue-600 mb-3">{testimonial.project}</p>
                  <blockquote className="text-gray-700 italic border-l-4 border-blue-500 pl-4">
                    "{testimonial.quote}"
                  </blockquote>
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
        title="Casting Director Profile"
        subtitle="Manage your professional profile and showcase your work"
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
          {activeTab === 'projects' && renderCurrentProjects()}
          {activeTab === 'achievements' && renderAchievements()}
          {activeTab === 'testimonials' && renderTestimonials()}
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
