'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  Plus,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Send,
  Bookmark,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Film,
  Tv,
  Theater,
  Mic,
  Briefcase,
  Target,
  Zap,
  UserPlus,
  MessageCircle
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock opportunities data for agents
const opportunities = [
  {
    id: '1',
    title: 'Lead Role - Netflix Original Series',
    project: 'Shadow Protocol',
    type: 'TV Series',
    studio: 'Netflix',
    castingDirector: {
      name: 'Sarah Mitchell',
      company: 'Mitchell Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=SM'
    },
    description: 'Seeking a charismatic lead for our new spy thriller series. Must have strong dramatic range and action capabilities. This is a multi-season commitment with significant international exposure.',
    requirements: {
      ageRange: '30-40',
      gender: 'Male',
      ethnicity: 'Any',
      experience: 'Series Regular Experience Required',
      union: 'Must be SAG-AFTRA'
    },
    compensation: {
      type: 'episodic',
      amount: '$150K per episode',
      details: '8-episode commitment, potential for 5 seasons'
    },
    location: 'Los Angeles, CA / Vancouver, BC',
    shootDates: 'June 2024 - December 2024',
    deadline: new Date(Date.now() + 86400000 * 14),
    priority: 'high',
    matchedTalent: 8,
    submittedTalent: 3,
    clientMatches: [
      { name: 'Marcus Johnson', match: 95, status: 'available' },
      { name: 'David Chen', match: 88, status: 'busy' },
      { name: 'James Thompson', match: 92, status: 'available' }
    ],
    budget: '$50M+ Production',
    exclusivity: true,
    bookingProbability: 85
  },
  {
    id: '2',
    title: 'Supporting Lead - Marvel Studios Feature',
    project: 'Classified Marvel Project',
    type: 'Film',
    studio: 'Marvel Studios / Disney',
    castingDirector: {
      name: 'Michael Chen',
      company: 'Marvel Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=MC'
    },
    description: 'Supporting lead role in upcoming Marvel Cinematic Universe film. Character will appear in multiple future projects. Seeking actress with strong physicality and dramatic range.',
    requirements: {
      ageRange: '25-35',
      gender: 'Female',
      ethnicity: 'Asian or Mixed Asian',
      experience: 'Feature Film Experience',
      union: 'Must be SAG-AFTRA'
    },
    compensation: {
      type: 'upfront + backend',
      amount: '$2.5M + profit participation',
      details: 'Multi-picture deal potential'
    },
    location: 'Atlanta, GA / Various International',
    shootDates: 'September 2024 - February 2025',
    deadline: new Date(Date.now() + 86400000 * 7),
    priority: 'urgent',
    matchedTalent: 4,
    submittedTalent: 1,
    clientMatches: [
      { name: 'Maya Patel', match: 96, status: 'available' },
      { name: 'Elena Rodriguez', match: 82, status: 'busy' }
    ],
    budget: '$200M+ Production',
    exclusivity: true,
    bookingProbability: 75
  },
  {
    id: '3',
    title: 'Lead Voice Actor - Animated Feature',
    project: 'Pixar Untitled Project',
    type: 'Voice Over',
    studio: 'Pixar Animation Studios',
    castingDirector: {
      name: 'Jennifer Woods',
      company: 'Pixar Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=JW'
    },
    description: 'Lead voice role for upcoming Pixar animated feature. Character-driven story requiring emotional depth and comedic timing. Extensive ADR and promotional commitments.',
    requirements: {
      ageRange: '25-45',
      gender: 'Any',
      ethnicity: 'Any',
      experience: 'Voice Over Experience Preferred',
      union: 'SAG-AFTRA'
    },
    compensation: {
      type: 'upfront + residuals',
      amount: '$1.5M + residuals',
      details: 'Sequel participation rights'
    },
    location: 'Los Angeles, CA (Recording Studios)',
    shootDates: 'May 2024 - August 2024',
    deadline: new Date(Date.now() + 86400000 * 21),
    priority: 'medium',
    matchedTalent: 12,
    submittedTalent: 5,
    clientMatches: [
      { name: 'Marcus Johnson', match: 89, status: 'available' },
      { name: 'Elena Rodriguez', match: 93, status: 'busy' },
      { name: 'Sarah Williams', match: 78, status: 'available' }
    ],
    budget: '$150M+ Production',
    exclusivity: false,
    bookingProbability: 70
  },
  {
    id: '4',
    title: 'Broadway Revival - Lead Role',
    project: 'Hamilton Revival',
    type: 'Theater',
    studio: 'Broadway Production Group',
    castingDirector: {
      name: 'Robert Hayes',
      company: 'Broadway Casting Collective',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=RH'
    },
    description: 'Lead role in Hamilton Broadway revival. Seeking exceptional singer/actor with strong stage presence. Long-term contract with potential for touring production.',
    requirements: {
      ageRange: '25-40',
      gender: 'Male',
      ethnicity: 'Any',
      experience: 'Broadway Experience Required',
      union: 'Must be AEA'
    },
    compensation: {
      type: 'weekly',
      amount: '$15K per week',
      details: '1-year contract, tour participation'
    },
    location: 'New York, NY',
    shootDates: 'March 2024 - March 2025',
    deadline: new Date(Date.now() + 86400000 * 10),
    priority: 'high',
    matchedTalent: 6,
    submittedTalent: 2,
    clientMatches: [
      { name: 'James Thompson', match: 94, status: 'available' },
      { name: 'Marcus Johnson', match: 87, status: 'busy' }
    ],
    budget: '$20M+ Production',
    exclusivity: true,
    bookingProbability: 80
  },
  {
    id: '5',
    title: 'National Commercial Campaign',
    project: 'Apple - iPhone Pro Series',
    type: 'Commercial',
    studio: 'Apple Inc.',
    castingDirector: {
      name: 'Amy Rodriguez',
      company: 'Commercial Casting Co.',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=AR'
    },
    description: 'National spokesperson for iPhone Pro campaign. Multi-platform content including TV, digital, and social media. Seeking relatable, tech-savvy personality.',
    requirements: {
      ageRange: '28-38',
      gender: 'Any',
      ethnicity: 'Diverse casting preferred',
      experience: 'National Commercial Experience',
      union: 'SAG-AFTRA'
    },
    compensation: {
      type: 'buyout + usage',
      amount: '$500K + usage fees',
      details: '2-year campaign, global distribution'
    },
    location: 'Los Angeles, CA / San Francisco, CA',
    shootDates: 'April 2024 - June 2024',
    deadline: new Date(Date.now() + 86400000 * 5),
    priority: 'urgent',
    matchedTalent: 15,
    submittedTalent: 7,
    clientMatches: [
      { name: 'Sarah Williams', match: 91, status: 'available' },
      { name: 'David Chen', match: 88, status: 'available' },
      { name: 'Maya Patel', match: 85, status: 'busy' }
    ],
    budget: '$50M+ Campaign',
    exclusivity: true,
    bookingProbability: 65
  }
]

const filterOptions = {
  type: ['All', 'Film', 'TV Series', 'Theater', 'Commercial', 'Voice Over'],
  priority: ['All', 'Urgent', 'High', 'Medium', 'Low'],
  compensation: ['All', '$1M+', '$500K-$1M', '$100K-$500K', 'Under $100K'],
  deadline: ['All', 'This Week', 'Next 2 Weeks', 'This Month', 'Later']
}

export default function AgentOpportunities() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'All',
    priority: 'All',
    compensation: 'All',
    deadline: 'All'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'matched'>('all')
  
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          opp.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          opp.studio.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedFilters.type === 'All' || opp.type === selectedFilters.type
    const matchesPriority = selectedFilters.priority === 'All' || opp.priority === selectedFilters.priority.toLowerCase()
    
    return matchesSearch && matchesType && matchesPriority
  })
  
  const stats = {
    total: opportunities.length,
    urgent: opportunities.filter(o => o.priority === 'urgent').length,
    highMatch: opportunities.filter(o => o.clientMatches.some(c => c.match >= 90)).length,
    submitted: opportunities.reduce((sum, o) => sum + o.submittedTalent, 0),
    potentialValue: opportunities.reduce((sum, o) => {
      const amount = parseFloat(o.compensation.amount.replace(/[$MK,]/g, ''))
      return sum + (amount * 1000000 * (o.bookingProbability / 100))
    }, 0)
  }
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'secondary'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Film': return <Film className="w-4 h-4" />
      case 'TV Series': return <Tv className="w-4 h-4" />
      case 'Commercial': return <Mic className="w-4 h-4" />
      case 'Theater': return <Theater className="w-4 h-4" />
      case 'Voice Over': return <Mic className="w-4 h-4" />
      default: return <Briefcase className="w-4 h-4" />
    }
  }
  
  const handleSubmitTalent = (oppId: string) => {
    router.push(`/agent/opportunities/${oppId}/submit`)
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Casting Opportunities"
        subtitle="Find the perfect roles for your talent"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode(viewMode === 'all' ? 'matched' : 'all')}
              variant="outline"
            >
              <Target className="w-4 h-4 mr-2" />
              {viewMode === 'all' ? 'Show Matches Only' : 'Show All'}
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Opportunities</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Matches</p>
                  <p className="text-2xl font-bold text-green-600">{stats.highMatch}</p>
                </div>
                <Star className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
                <Send className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Potential Value</p>
                  <p className="text-2xl font-bold text-green-600">${(stats.potentialValue / 1000000).toFixed(1)}M</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search opportunities by title, project, or studio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        
        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(filterOptions).map(([key, options]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key}
                      </label>
                      <select
                        value={selectedFilters[key as keyof typeof selectedFilters]}
                        onChange={(e) => setSelectedFilters({
                          ...selectedFilters,
                          [key]: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={() => setSelectedFilters({
                      type: 'All',
                      priority: 'All',
                      compensation: 'All',
                      deadline: 'All'
                    })}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    size="sm"
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Opportunities List */}
        <div className="space-y-6">
          {filteredOpportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
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
                            <Badge 
                              variant={getPriorityColor(opportunity.priority) as any}
                              className="flex items-center gap-1"
                            >
                              {opportunity.priority === 'urgent' && <Zap className="w-3 h-3" />}
                              {opportunity.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getTypeIcon(opportunity.type)}
                              {opportunity.type}
                            </Badge>
                            {opportunity.exclusivity && (
                              <Badge variant="secondary">Exclusive</Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-heading font-semibold mb-1">
                            {opportunity.title}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {opportunity.project} • {opportunity.studio}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Deadline: {opportunity.deadline.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {opportunity.matchedTalent} matches, {opportunity.submittedTalent} submitted
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Booking Probability</p>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 transition-all"
                                  style={{ width: `${opportunity.bookingProbability}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{opportunity.bookingProbability}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {opportunity.description}
                      </p>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{opportunity.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span>{opportunity.compensation.amount}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{opportunity.shootDates}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{Math.ceil((opportunity.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left</span>
                        </div>
                      </div>
                      
                      {/* Requirements */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" size="sm">
                          {opportunity.requirements.ageRange} years
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {opportunity.requirements.gender}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {opportunity.requirements.ethnicity}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {opportunity.requirements.union}
                        </Badge>
                      </div>
                      
                      {/* Client Matches */}
                      {opportunity.clientMatches.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Top Client Matches ({opportunity.clientMatches.length})
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {opportunity.clientMatches.slice(0, 3).map(match => (
                              <div 
                                key={match.name}
                                className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                              >
                                <Avatar className="w-8 h-8">
                                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                      {match.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{match.name}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                      <span className="text-xs">{match.match}% match</span>
                                    </div>
                                    <Badge 
                                      variant={match.status === 'available' ? 'success' : 'warning'} 
                                      size="sm"
                                    >
                                      {match.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions Sidebar */}
                    <div className="lg:w-64 space-y-3">
                      {/* Casting Director */}
                      <Card className="bg-gray-50">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <img 
                                src={opportunity.castingDirector.avatar} 
                                alt={opportunity.castingDirector.name}
                                className="w-full h-full object-cover"
                              />
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{opportunity.castingDirector.name}</p>
                              <p className="text-xs text-gray-600">{opportunity.castingDirector.company}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleSubmitTalent(opportunity.id)}
                          variant="default"
                          className="w-full"
                          disabled={opportunity.clientMatches.length === 0}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit Talent ({opportunity.clientMatches.length})
                        </Button>
                        
                        <Button
                          onClick={() => router.push(`/agent/opportunities/${opportunity.id}`)}
                          variant="outline"
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        
                        <Button
                          onClick={() => router.push(`/messages?contact=${opportunity.castingDirector.name}`)}
                          variant="outline"
                          className="w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact CD
                        </Button>
                        
                        <Button
                          variant="ghost"
                          className="w-full"
                        >
                          <Bookmark className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Budget:</span>
                          <span className="font-medium">{opportunity.budget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Competition:</span>
                          <span className="font-medium">{opportunity.submittedTalent + 50}+ submissions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No opportunities found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilters({
                  type: 'All',
                  priority: 'All',
                  compensation: 'All',
                  deadline: 'All'
                })
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}