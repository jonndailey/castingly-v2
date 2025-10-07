'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Star,
  Calendar,
  MapPin,
  User,
  Film,
  Tv,
  Theater,
  Mic,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Award,
  Users,
  Send,
  Download,
  BarChart3,
  Target,
  Zap,
  Phone,
  Mail
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock submissions data
const submissions = [
  {
    id: 'sub1',
    talent: {
      id: 'actor1',
      name: 'Marcus Johnson',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=MJ'
    },
    opportunity: {
      id: 'opp1',
      title: 'Lead Role - Netflix Original Series',
      project: 'Shadow Protocol',
      type: 'TV Series',
      studio: 'Netflix'
    },
    castingDirector: {
      name: 'Sarah Mitchell',
      company: 'Mitchell Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=SM'
    },
    submittedAt: new Date(Date.now() - 86400000 * 3),
    status: 'callback',
    viewedAt: new Date(Date.now() - 86400000 * 2),
    callbackDate: new Date(Date.now() + 86400000 * 2),
    materials: ['Self-tape', 'Headshot', 'Resume', 'Reel'],
    notes: 'Excellent audition! Perfect fit for the character. Looking forward to callback.',
    feedback: 'Strong performance, great screen presence. Would like to see more of the emotional range in callback.',
    rating: 4.5,
    matchScore: 95,
    commission: '$22,500', // 15% of $150K episode fee
    potentialValue: '$1.2M', // 8 episodes
    priority: 'high'
  },
  {
    id: 'sub2',
    talent: {
      id: 'actor2',
      name: 'Maya Patel',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=MP'
    },
    opportunity: {
      id: 'opp2',
      title: 'Supporting Lead - Marvel Studios Feature',
      project: 'Classified Marvel Project',
      type: 'Film',
      studio: 'Marvel Studios'
    },
    castingDirector: {
      name: 'Michael Chen',
      company: 'Marvel Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=MC'
    },
    submittedAt: new Date(Date.now() - 86400000 * 5),
    status: 'booked',
    viewedAt: new Date(Date.now() - 86400000 * 4),
    bookingDate: new Date(Date.now() - 86400000 * 1),
    materials: ['Self-tape', 'Headshot', 'Resume', 'Stunt Reel'],
    notes: 'BOOKED! Contract negotiations in progress.',
    feedback: 'Exceptional audition. Exactly what we were looking for. Welcome to the MCU!',
    rating: 5.0,
    matchScore: 96,
    commission: '$375K', // 15% of $2.5M
    potentialValue: '$2.5M',
    priority: 'urgent'
  },
  {
    id: 'sub3',
    talent: {
      id: 'actor3',
      name: 'Elena Rodriguez',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=ER'
    },
    opportunity: {
      id: 'opp3',
      title: 'Lead Voice Actor - Animated Feature',
      project: 'Pixar Untitled Project',
      type: 'Voice Over',
      studio: 'Pixar Animation'
    },
    castingDirector: {
      name: 'Jennifer Woods',
      company: 'Pixar Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=JW'
    },
    submittedAt: new Date(Date.now() - 86400000 * 7),
    status: 'viewed',
    viewedAt: new Date(Date.now() - 86400000 * 5),
    materials: ['Voice Reel', 'Headshot', 'Resume'],
    notes: 'Under consideration. Waiting for director feedback.',
    feedback: 'Beautiful voice quality. Great emotional range. Still reviewing with creative team.',
    rating: 4.2,
    matchScore: 93,
    commission: '$225K', // 15% of $1.5M
    potentialValue: '$1.5M',
    priority: 'medium'
  },
  {
    id: 'sub4',
    talent: {
      id: 'actor4',
      name: 'James Thompson',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=JT'
    },
    opportunity: {
      id: 'opp4',
      title: 'Broadway Revival - Lead Role',
      project: 'Hamilton Revival',
      type: 'Theater',
      studio: 'Broadway Production Group'
    },
    castingDirector: {
      name: 'Robert Hayes',
      company: 'Broadway Casting Collective',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=RH'
    },
    submittedAt: new Date(Date.now() - 86400000 * 10),
    status: 'rejected',
    viewedAt: new Date(Date.now() - 86400000 * 8),
    materials: ['Audition Video', 'Headshot', 'Resume', 'Voice Recording'],
    notes: 'Not selected. Seeking younger demographic for this production.',
    feedback: 'Excellent performance but decided to go with a different age range for this particular revival.',
    rating: 3.8,
    matchScore: 87,
    commission: '$0',
    potentialValue: '$0',
    priority: 'low'
  },
  {
    id: 'sub5',
    talent: {
      id: 'actor5',
      name: 'Sarah Williams',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=SW'
    },
    opportunity: {
      id: 'opp5',
      title: 'National Commercial Campaign',
      project: 'Apple - iPhone Pro Series',
      type: 'Commercial',
      studio: 'Apple Inc.'
    },
    castingDirector: {
      name: 'Amy Rodriguez',
      company: 'Commercial Casting Co.',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=AR'
    },
    submittedAt: new Date(Date.now() - 86400000 * 2),
    status: 'submitted',
    viewedAt: null,
    materials: ['Self-tape', 'Headshot', 'Commercial Reel'],
    notes: 'Submitted. Awaiting initial review.',
    feedback: null,
    rating: null,
    matchScore: 91,
    commission: '$75K', // 15% of $500K if booked
    potentialValue: '$500K',
    priority: 'high'
  },
  {
    id: 'sub6',
    talent: {
      id: 'actor6',
      name: 'David Chen',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=DC'
    },
    opportunity: {
      id: 'opp6',
      title: 'Recurring Character - HBO Drama',
      project: 'The Last Resort',
      type: 'TV Series',
      studio: 'HBO'
    },
    castingDirector: {
      name: 'Lisa Park',
      company: 'HBO Casting',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=LP'
    },
    submittedAt: new Date(Date.now() - 86400000 * 6),
    status: 'callback',
    viewedAt: new Date(Date.now() - 86400000 * 4),
    callbackDate: new Date(Date.now() + 86400000 * 1),
    materials: ['Self-tape', 'Headshot', 'Resume'],
    notes: 'Callback scheduled for tomorrow. Chemistry read with series lead.',
    feedback: 'Great work! Love the character choices. Excited to see more in callback.',
    rating: 4.7,
    matchScore: 89,
    commission: '$45K', // 15% of potential recurring fees
    potentialValue: '$300K',
    priority: 'urgent'
  }
]

const statusConfig = {
  submitted: {
    label: 'Submitted',
    color: 'secondary',
    icon: <Clock className="w-4 h-4" />,
    description: 'Awaiting review'
  },
  viewed: {
    label: 'Viewed',
    color: 'warning',
    icon: <Eye className="w-4 h-4" />,
    description: 'Under consideration'
  },
  callback: {
    label: 'Callback!',
    color: 'success',
    icon: <Star className="w-4 h-4" />,
    description: 'Invited for callback'
  },
  rejected: {
    label: 'Not Selected',
    color: 'error',
    icon: <XCircle className="w-4 h-4" />,
    description: 'Not selected for role'
  },
  booked: {
    label: 'BOOKED!',
    color: 'success',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Role secured'
  }
}

const filterOptions = {
  status: ['All', 'Submitted', 'Viewed', 'Callback', 'Booked', 'Rejected'],
  type: ['All', 'Film', 'TV Series', 'Theater', 'Commercial', 'Voice Over'],
  priority: ['All', 'Urgent', 'High', 'Medium', 'Low'],
  talent: ['All', ...Array.from(new Set(submissions.map(s => s.talent.name)))]
}

export default function AgentSubmissions() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'All',
    type: 'All',
    priority: 'All',
    talent: 'All'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('submittedAt')
  
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.opportunity.project.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedFilters.status === 'All' || sub.status === selectedFilters.status.toLowerCase()
    const matchesType = selectedFilters.type === 'All' || sub.opportunity.type === selectedFilters.type
    const matchesPriority = selectedFilters.priority === 'All' || sub.priority === selectedFilters.priority.toLowerCase()
    const matchesTalent = selectedFilters.talent === 'All' || sub.talent.name === selectedFilters.talent
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesTalent
  })
  
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch(sortBy) {
      case 'potentialValue':
        return parseFloat(b.potentialValue.replace(/[$MK,]/g, '')) - parseFloat(a.potentialValue.replace(/[$MK,]/g, ''))
      case 'matchScore':
        return b.matchScore - a.matchScore
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      default:
        return b.submittedAt.getTime() - a.submittedAt.getTime()
    }
  })
  
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => ['submitted', 'viewed'].includes(s.status)).length,
    callbacks: submissions.filter(s => s.status === 'callback').length,
    booked: submissions.filter(s => s.status === 'booked').length,
    totalCommission: submissions.reduce((sum, s) => {
      const commission = parseFloat(s.commission.replace(/[$MK,]/g, ''))
      return sum + (s.status === 'booked' ? commission : 0)
    }, 0),
    potentialCommission: submissions.reduce((sum, s) => {
      const commission = parseFloat(s.commission.replace(/[$MK,]/g, ''))
      return sum + (s.status !== 'rejected' ? commission : 0)
    }, 0)
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Film': return <Film className="w-4 h-4" />
      case 'TV Series': return <Tv className="w-4 h-4" />
      case 'Commercial': return <Mic className="w-4 h-4" />
      case 'Theater': return <Theater className="w-4 h-4" />
      case 'Voice Over': return <Mic className="w-4 h-4" />
      default: return <Film className="w-4 h-4" />
    }
  }
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Submissions Management"
        subtitle="Track all talent submissions and their progress"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="default">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Send className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Callbacks</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.callbacks}</p>
                </div>
                <Star className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Booked</p>
                  <p className="text-2xl font-bold text-green-600">{stats.booked}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Earned</p>
                  <p className="text-2xl font-bold text-green-600">${(stats.totalCommission / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Potential</p>
                  <p className="text-2xl font-bold text-blue-600">${(stats.potentialCommission / 1000).toFixed(0)}K</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by talent name, project, or casting director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="submittedAt">Recent First</option>
              <option value="potentialValue">Highest Value</option>
              <option value="matchScore">Best Matches</option>
              <option value="priority">Priority</option>
            </select>
          </div>
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
                      status: 'All',
                      type: 'All',
                      priority: 'All',
                      talent: 'All'
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
        
        {/* Submissions List */}
        <div className="space-y-4">
          {sortedSubmissions.map((submission, index) => {
            const status = statusConfig[submission.status as keyof typeof statusConfig]
            
            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            {/* Talent Avatar */}
                            <Avatar className="w-16 h-16">
                              <img 
                                src={submission.talent.avatar} 
                                alt={submission.talent.name}
                                className="w-full h-full object-cover"
                              />
                            </Avatar>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={status.color as any}
                                  className="flex items-center gap-1"
                                >
                                  {status.icon}
                                  {status.label}
                                </Badge>
                                <Badge 
                                  className={`${getPriorityColor(submission.priority)} border-0`}
                                  size="sm"
                                >
                                  {submission.priority.toUpperCase()}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium">{submission.matchScore}% match</span>
                                </div>
                              </div>
                              <h3 className="text-xl font-heading font-semibold">
                                {submission.talent.name}
                              </h3>
                              <p className="text-gray-600">
                                {submission.opportunity.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {submission.opportunity.project} • {submission.opportunity.studio}
                              </p>
                            </div>
                          </div>
                          
                          {/* Value Display */}
                          <div className="text-right">
                            <div className="mb-2">
                              <p className="text-sm text-gray-500">Potential Commission</p>
                              <p className="text-xl font-bold text-green-600">{submission.commission}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Deal Value</p>
                              <p className="text-lg font-medium">{submission.potentialValue}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timeline */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Send className="w-4 h-4" />
                            Submitted {submission.submittedAt.toLocaleDateString()}
                          </div>
                          {submission.viewedAt && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              Viewed {submission.viewedAt.toLocaleDateString()}
                            </div>
                          )}
                          {submission.callbackDate && (
                            <div className="flex items-center gap-1 text-purple-600 font-medium">
                              <Calendar className="w-4 h-4" />
                              Callback {submission.callbackDate.toLocaleDateString()}
                            </div>
                          )}
                          {submission.bookingDate && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Booked {submission.bookingDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        {/* Project Details */}
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            {getTypeIcon(submission.opportunity.type)}
                            {submission.opportunity.type}
                          </div>
                        </div>
                        
                        {/* Materials */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {submission.materials.map((material) => (
                            <Badge key={material} variant="outline" size="sm">
                              {material}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Feedback */}
                        {submission.feedback && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <img 
                                  src={submission.castingDirector.avatar} 
                                  alt={submission.castingDirector.name}
                                  className="w-full h-full object-cover"
                                />
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium">{submission.castingDirector.name}</p>
                                  {submission.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                      <span className="text-sm font-medium">{submission.rating}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{submission.castingDirector.company}</p>
                                <p className="text-sm text-gray-700 mt-2">{submission.feedback}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Notes */}
                        {submission.notes && (
                          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-blue-700">Agent Notes</p>
                              <p className="text-sm text-blue-800">{submission.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions Sidebar */}
                      <div className="lg:w-64 space-y-3">
                        {/* Casting Director Info */}
                        <Card className="bg-gray-50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="w-10 h-10">
                                <img 
                                  src={submission.castingDirector.avatar} 
                                  alt={submission.castingDirector.name}
                                  className="w-full h-full object-cover"
                                />
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{submission.castingDirector.name}</p>
                                <p className="text-xs text-gray-600">{submission.castingDirector.company}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Quick Actions */}
                        <div className="space-y-2">
                          <Button
                            onClick={() => router.push(`/agent/submissions/${submission.id}`)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          <Button
                            onClick={() => router.push(`/messages?contact=${submission.castingDirector.name}`)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message CD
                          </Button>
                          
                          <Button
                            onClick={() => router.push(`/agent/roster/${submission.talent.id}`)}
                            variant="ghost"
                            size="sm"
                            className="w-full"
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Talent
                          </Button>
                        </div>
                        
                        {/* Status-specific Actions */}
                        {submission.status === 'callback' && submission.callbackDate && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-xs font-medium text-purple-700 mb-2">Callback Scheduled</p>
                            <p className="text-sm text-purple-800 mb-2">
                              {submission.callbackDate.toLocaleDateString()} at 2:30 PM
                            </p>
                            <Button variant="success" size="sm" className="w-full">
                              <Calendar className="w-4 h-4 mr-2" />
                              Add to Calendar
                            </Button>
                          </div>
                        )}
                        
                        {submission.status === 'booked' && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-medium text-green-700 mb-2">CONGRATULATIONS!</p>
                            <p className="text-sm text-green-800 mb-2">Role successfully booked</p>
                            <Button variant="success" size="sm" className="w-full">
                              <Award className="w-4 h-4 mr-2" />
                              View Contract
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* Empty State */}
        {sortedSubmissions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No submissions found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilters({
                  status: 'All',
                  type: 'All',
                  priority: 'All',
                  talent: 'All'
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