'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  Plus,
  Grid,
  List,
  Star,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Edit2,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Film,
  Tv,
  Theater,
  Mic,
  Briefcase,
  Target,
  PlayCircle,
  PauseCircle,
  Settings,
  Award,
  Building
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/lib/store/auth-store'

// Mock casting projects data
const castingProjects = [
  {
    id: '1',
    title: 'Shadow Protocol - Season 1',
    studio: 'Netflix',
    type: 'TV Series',
    genre: 'Thriller/Drama',
    status: 'active',
    priority: 'high',
    budget: '$25M',
    director: 'Jennifer Kim',
    producer: 'Michael Rodriguez',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-31'),
    castingDeadline: new Date('2024-04-30'),
    logo: 'https://placehold.co/60x60/e50914/ffffff?text=N',
    description: 'High-stakes international espionage thriller following multiple agents across different continents. Requires diverse cast with strong dramatic and action capabilities.',
    rolesTotal: 45,
    rolesFilled: 38,
    rolesRemaining: 7,
    leadRoles: 8,
    supportingRoles: 15,
    dayPlayerRoles: 22,
    submissions: 1247,
    auditionsScheduled: 89,
    callbacksScheduled: 23,
    offersOut: 5,
    keyRoles: [
      { name: 'Agent Sarah Chen', status: 'cast', actor: 'Maya Patel' },
      { name: 'Marcus Stone', status: 'callback', actor: 'Pending' },
      { name: 'Director Williams', status: 'audition', actor: 'Pending' },
      { name: 'Elena Vasquez', status: 'open', actor: 'Open' }
    ],
    lastActivity: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: '2',
    title: 'Breaking Chains',
    studio: 'Warner Bros Pictures',
    type: 'Feature Film',
    genre: 'Drama',
    status: 'completed',
    priority: 'medium',
    budget: '$18M',
    director: 'David Thompson',
    producer: 'Sarah Wilson',
    startDate: new Date('2023-08-20'),
    endDate: new Date('2024-02-15'),
    castingDeadline: new Date('2023-11-30'),
    logo: 'https://placehold.co/60x60/0078d4/ffffff?text=WB',
    description: 'Powerful drama about family reconciliation and personal growth. Award-season contender requiring exceptional dramatic performances.',
    rolesTotal: 25,
    rolesFilled: 25,
    rolesRemaining: 0,
    leadRoles: 5,
    supportingRoles: 8,
    dayPlayerRoles: 12,
    submissions: 856,
    auditionsScheduled: 67,
    callbacksScheduled: 18,
    offersOut: 0,
    keyRoles: [
      { name: 'Daniel Morrison', status: 'cast', actor: 'Marcus Johnson' },
      { name: 'Rebecca Morrison', status: 'cast', actor: 'Elena Rodriguez' },
      { name: 'Dr. Sarah Mitchell', status: 'cast', actor: 'James Thompson' },
      { name: 'Young Daniel', status: 'cast', actor: 'Tommy Wilson' }
    ],
    lastActivity: new Date(Date.now() - 86400000 * 45)
  },
  {
    id: '3',
    title: 'The Last Resort - Limited Series',
    studio: 'HBO',
    type: 'Limited Series',
    genre: 'Mystery/Thriller',
    status: 'pre-production',
    priority: 'urgent',
    budget: '$40M',
    director: 'Alex Chen',
    producer: 'Maria Santos',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-10-31'),
    castingDeadline: new Date('2024-03-15'),
    logo: 'https://placehold.co/60x60/7b2cbf/ffffff?text=HBO',
    description: 'Psychological thriller set in an isolated resort. Ensemble cast piece requiring actors capable of complex emotional range and mystery elements.',
    rolesTotal: 32,
    rolesFilled: 8,
    rolesRemaining: 24,
    leadRoles: 6,
    supportingRoles: 12,
    dayPlayerRoles: 14,
    submissions: 2156,
    auditionsScheduled: 145,
    callbacksScheduled: 34,
    offersOut: 12,
    keyRoles: [
      { name: 'Detective Morgan', status: 'offer', actor: 'Pending Decision' },
      { name: 'Resort Owner Catherine', status: 'callback', actor: 'Pending' },
      { name: 'Dr. Harrison', status: 'audition', actor: 'Pending' },
      { name: 'Mysterious Guest', status: 'open', actor: 'Open' }
    ],
    lastActivity: new Date(Date.now() - 3600000)
  },
  {
    id: '4',
    title: 'Apple - Innovation Campaign',
    studio: 'Apple Inc.',
    type: 'Commercial Campaign',
    genre: 'Technology/Lifestyle',
    status: 'active',
    priority: 'high',
    budget: '$15M',
    director: 'Lisa Park',
    producer: 'Creative Agency Team',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-31'),
    castingDeadline: new Date('2024-03-01'),
    logo: 'https://placehold.co/60x60/007aff/ffffff?text=A',
    description: 'Global campaign showcasing innovation and human connection through technology. Seeking diverse, authentic individuals for lifestyle-focused commercials.',
    rolesTotal: 18,
    rolesFilled: 12,
    rolesRemaining: 6,
    leadRoles: 4,
    supportingRoles: 8,
    dayPlayerRoles: 6,
    submissions: 3245,
    auditionsScheduled: 124,
    callbacksScheduled: 45,
    offersOut: 8,
    keyRoles: [
      { name: 'Tech Professional - Lead', status: 'cast', actor: 'Sarah Williams' },
      { name: 'Creative Professional', status: 'offer', actor: 'Pending' },
      { name: 'Student Innovator', status: 'callback', actor: 'Pending' },
      { name: 'Family Parent', status: 'audition', actor: 'Pending' }
    ],
    lastActivity: new Date(Date.now() - 3600000 * 6)
  },
  {
    id: '5',
    title: 'Hamilton - Broadway Revival',
    studio: 'Broadway Production Group',
    type: 'Theater',
    genre: 'Musical/Historical',
    status: 'casting',
    priority: 'medium',
    budget: '$12M',
    director: 'Robert Hayes',
    producer: 'Broadway Collective',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2025-06-01'),
    castingDeadline: new Date('2024-04-15'),
    logo: 'https://placehold.co/60x60/ffd700/000000?text=H',
    description: 'Broadway revival of the acclaimed musical. Seeking exceptional singer-actors with strong stage presence and musical theater experience.',
    rolesTotal: 24,
    rolesFilled: 18,
    rolesRemaining: 6,
    leadRoles: 8,
    supportingRoles: 10,
    dayPlayerRoles: 6,
    submissions: 1876,
    auditionsScheduled: 234,
    callbacksScheduled: 78,
    offersOut: 15,
    keyRoles: [
      { name: 'Alexander Hamilton', status: 'callback', actor: 'Final 3' },
      { name: 'Aaron Burr', status: 'callback', actor: 'Final 2' },
      { name: 'Eliza Hamilton', status: 'cast', actor: 'Jessica Martinez' },
      { name: 'George Washington', status: 'offer', actor: 'Pending' }
    ],
    lastActivity: new Date(Date.now() - 3600000 * 12)
  },
  {
    id: '6',
    title: 'Voice of Tomorrow - Documentary',
    studio: 'Independent Documentary',
    type: 'Documentary',
    genre: 'Documentary/Social',
    status: 'on-hold',
    priority: 'low',
    budget: '$2M',
    director: 'Amanda Foster',
    producer: 'Documentary Films LLC',
    startDate: new Date('2024-05-15'),
    endDate: new Date('2024-11-30'),
    castingDeadline: new Date('2024-04-01'),
    logo: 'https://placehold.co/60x60/28a745/ffffff?text=D',
    description: 'Documentary featuring real people sharing their stories about climate change and environmental activism. Seeking authentic individuals, not actors.',
    rolesTotal: 12,
    rolesFilled: 3,
    rolesRemaining: 9,
    leadRoles: 0,
    supportingRoles: 12,
    dayPlayerRoles: 0,
    submissions: 456,
    auditionsScheduled: 23,
    callbacksScheduled: 8,
    offersOut: 2,
    keyRoles: [
      { name: 'Environmental Scientist', status: 'cast', actor: 'Dr. Maria Santos' },
      { name: 'Young Activist', status: 'audition', actor: 'Pending' },
      { name: 'Community Leader', status: 'open', actor: 'Open' },
      { name: 'Policy Maker', status: 'open', actor: 'Open' }
    ],
    lastActivity: new Date(Date.now() - 86400000 * 15)
  }
]

const statusConfig = {
  active: {
    label: 'Active Casting',
    color: 'success',
    icon: <PlayCircle className="w-4 h-4" />,
    description: 'Currently casting roles'
  },
  'pre-production': {
    label: 'Pre-Production',
    color: 'warning',
    icon: <Clock className="w-4 h-4" />,
    description: 'Preparing to start casting'
  },
  casting: {
    label: 'Casting',
    color: 'default',
    icon: <Users className="w-4 h-4" />,
    description: 'Active casting process'
  },
  completed: {
    label: 'Completed',
    color: 'secondary',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Casting completed'
  },
  'on-hold': {
    label: 'On Hold',
    color: 'error',
    icon: <PauseCircle className="w-4 h-4" />,
    description: 'Project temporarily paused'
  }
}

const filterOptions = {
  status: ['All', 'Active', 'Pre-Production', 'Casting', 'Completed', 'On Hold'],
  type: ['All', 'Feature Film', 'TV Series', 'Limited Series', 'Commercial Campaign', 'Theater', 'Documentary'],
  priority: ['All', 'Urgent', 'High', 'Medium', 'Low']
}

export default function CastingProjects() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'All',
    type: 'All',
    priority: 'All'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('lastActivity')
  
  const filteredProjects = castingProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.studio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.director.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedFilters.status === 'All' || project.status === selectedFilters.status.toLowerCase().replace(' ', '-')
    const matchesType = selectedFilters.type === 'All' || project.type === selectedFilters.type
    const matchesPriority = selectedFilters.priority === 'All' || project.priority === selectedFilters.priority.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })
  
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch(sortBy) {
      case 'budget':
        return parseFloat(b.budget.replace(/[$M,]/g, '')) - parseFloat(a.budget.replace(/[$M,]/g, ''))
      case 'deadline':
        return a.castingDeadline.getTime() - b.castingDeadline.getTime()
      case 'progress':
        return (b.rolesFilled / b.rolesTotal) - (a.rolesFilled / a.rolesTotal)
      default:
        return b.lastActivity.getTime() - a.lastActivity.getTime()
    }
  })
  
  const stats = {
    total: castingProjects.length,
    active: castingProjects.filter(p => p.status === 'active').length,
    completed: castingProjects.filter(p => p.status === 'completed').length,
    totalBudget: castingProjects.reduce((sum, p) => sum + parseFloat(p.budget.replace(/[$M,]/g, '')), 0),
    totalRoles: castingProjects.reduce((sum, p) => sum + p.rolesTotal, 0),
    totalSubmissions: castingProjects.reduce((sum, p) => sum + p.submissions, 0)
  }
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Feature Film': return <Film className="w-4 h-4" />
      case 'TV Series': return <Tv className="w-4 h-4" />
      case 'Limited Series': return <Tv className="w-4 h-4" />
      case 'Commercial Campaign': return <Mic className="w-4 h-4" />
      case 'Theater': return <Theater className="w-4 h-4" />
      case 'Documentary': return <Film className="w-4 h-4" />
      default: return <Briefcase className="w-4 h-4" />
    }
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Casting Projects"
        subtitle="Manage all your active and completed casting projects"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              New Project
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
                  <p className="text-sm text-gray-600">Total Projects</p>
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
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <PlayCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-purple-600">${stats.totalBudget}M</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalRoles}</p>
                </div>
                <Users className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-indigo-600">{(stats.totalSubmissions / 1000).toFixed(1)}K</p>
                </div>
                <Target className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search projects by title, studio, or director..."
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
              <option value="lastActivity">Recent Activity</option>
              <option value="deadline">Casting Deadline</option>
              <option value="budget">Budget (High to Low)</option>
              <option value="progress">Casting Progress</option>
            </select>
            
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      priority: 'All'
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
        
        {/* Projects Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((project, index) => {
              const status = statusConfig[project.status as keyof typeof statusConfig]
              const progress = (project.rolesFilled / project.rolesTotal) * 100
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={project.logo} 
                            alt={project.studio}
                            className="w-12 h-12 rounded-lg"
                          />
                          <div>
                            <Badge 
                              variant={status.color as any}
                              className="mb-1"
                            >
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
                            </Badge>
                            <Badge 
                              className={`${getPriorityColor(project.priority)} text-xs`}
                              variant="outline"
                            >
                              {project.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Project Info */}
                      <div className="mb-4">
                        <h3 className="font-heading font-semibold text-lg mb-1 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-1">{project.studio}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {getTypeIcon(project.type)}
                          <span>{project.type}</span>
                          <span>•</span>
                          <span>{project.genre}</span>
                        </div>
                      </div>
                      
                      {/* Key Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500">Budget</p>
                          <p className="font-semibold text-green-600">{project.budget}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Deadline</p>
                          <p className="font-semibold">{project.castingDeadline.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Submissions</p>
                          <p className="font-semibold">{project.submissions}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Roles Filled</p>
                          <p className="font-semibold">{project.rolesFilled}/{project.rolesTotal}</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Casting Progress</span>
                          <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Key Roles Status */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Key Roles Status</p>
                        <div className="space-y-1">
                          {project.keyRoles.slice(0, 2).map((role, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="truncate">{role.name}</span>
                              <Badge 
                                variant={role.status === 'cast' ? 'success' : role.status === 'offer' ? 'warning' : 'secondary'}
                                size="sm"
                              >
                                {role.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/casting/projects/${project.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          onClick={() => router.push(`/casting/submissions?project=${project.id}`)}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Cast
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProjects.map((project, index) => {
              const status = statusConfig[project.status as keyof typeof statusConfig]
              const progress = (project.rolesFilled / project.rolesTotal) * 100
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Logo & Status */}
                        <div className="flex items-center gap-3">
                          <img 
                            src={project.logo} 
                            alt={project.studio}
                            className="w-16 h-16 rounded-lg"
                          />
                          <div className="space-y-1">
                            <Badge variant={status.color as any} size="sm">
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
                            </Badge>
                            <Badge 
                              className={`${getPriorityColor(project.priority)} text-xs`}
                              variant="outline"
                              size="sm"
                            >
                              {project.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Project Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-heading font-semibold text-lg">{project.title}</h3>
                              <p className="text-gray-600">{project.studio}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                {getTypeIcon(project.type)}
                                <span>{project.type}</span>
                                <span>•</span>
                                <span>{project.genre}</span>
                                <span>•</span>
                                <span>Dir: {project.director}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{project.budget}</p>
                              <p className="text-sm text-gray-500">Budget</p>
                            </div>
                          </div>
                          
                          {/* Progress and Stats */}
                          <div className="grid grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Roles</p>
                              <p className="font-semibold">{project.rolesFilled}/{project.rolesTotal}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Submissions</p>
                              <p className="font-semibold">{project.submissions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Auditions</p>
                              <p className="font-semibold">{project.auditionsScheduled}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Deadline</p>
                              <p className="font-semibold">{project.castingDeadline.toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/casting/projects/${project.id}`)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => router.push(`/casting/submissions?project=${project.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
        
        {/* Empty State */}
        {sortedProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects found
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
                  priority: 'All'
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