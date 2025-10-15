'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Heart,
  Eye,
  Play,
  Calendar,
  User,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Download,
  MoreVertical,
  Flag,
  Users,
  SortAsc,
  Grid,
  List,
  Zap,
  Target,
  Award,
  FilterX
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Generate comprehensive mock submissions data (500+ submissions)
const generateSubmissions = () => {
  const firstNames = ['Marcus', 'Elena', 'David', 'Sarah', 'James', 'Maya', 'Alex', 'Jessica', 'Michael', 'Rachel', 'Daniel', 'Emma', 'Christopher', 'Isabella', 'Matthew', 'Olivia', 'Anthony', 'Sophia', 'Andrew', 'Ashley', 'Joshua', 'Emily', 'Ryan', 'Madison', 'Brandon', 'Samantha', 'Tyler', 'Hannah', 'Kevin', 'Alexis', 'Jordan', 'Grace', 'Nathan', 'Chloe', 'Ethan', 'Mia', 'Jacob', 'Abigail', 'Noah', 'Ava', 'Logan', 'Lily', 'Lucas', 'Zoe', 'Mason', 'Sofia', 'Alexander', 'Charlotte', 'Benjamin', 'Amelia']
  const lastNames = ['Johnson', 'Rodriguez', 'Chen', 'Williams', 'Thompson', 'Patel', 'Davis', 'Miller', 'Wilson', 'Garcia', 'Martinez', 'Anderson', 'Brown', 'Jones', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart']
  
  const cities = ['Los Angeles, CA', 'New York, NY', 'Atlanta, GA', 'Chicago, IL', 'Vancouver, BC', 'Toronto, ON', 'Miami, FL', 'Austin, TX', 'Seattle, WA', 'Philadelphia, PA', 'Boston, MA', 'Denver, CO', 'Nashville, TN', 'Portland, OR', 'San Francisco, CA', 'Dallas, TX', 'Phoenix, AZ', 'Detroit, MI', 'Minneapolis, MN', 'Las Vegas, NV']
  
  const unions = ['SAG-AFTRA', 'AEA/SAG-AFTRA', 'ACTRA/SAG-AFTRA', 'Non-union', 'SAG-AFTRA/ACTRA', 'Eligible', 'AFTRA']
  
  const agents = ['CAA', 'WME', 'UTA', 'ICM', 'Gersh', 'APA', 'Paradigm', 'Innovative', 'Abrams', 'Buchwald', 'Talentworks', 'Direct Submission']
  
  const projects = [
    { title: 'Shadow Protocol', roles: ['Agent Marcus Stone', 'Dr. Elena Vasquez', 'Agent Sarah Chen', 'Commander Blake', 'Tech Specialist', 'Surveillance Expert', 'Field Operative'] },
    { title: 'The Last Resort', roles: ['Detective Morgan', 'Resort Manager', 'Guest Relations', 'Security Chief', 'Local Guide', 'Concierge', 'Bartender'] },
    { title: 'Apple Campaign', roles: ['Young Professional', 'Tech Executive', 'Creative Director', 'Customer', 'Spokesperson', 'Developer', 'Designer'] },
    { title: 'Hamilton Revival', roles: ['George Washington', 'Alexander Hamilton', 'Aaron Burr', 'Thomas Jefferson', 'Marquis de Lafayette', 'King George', 'Hercules Mulligan'] },
    { title: 'Netflix Drama Series', roles: ['Lead Detective', 'Prosecutor', 'Defense Attorney', 'Judge', 'Court Reporter', 'Witness', 'Jury Foreman'] },
    { title: 'Marvel Studios Film', roles: ['Hero', 'Villain', 'Supporting Character', 'Love Interest', 'Comic Relief', 'Mentor', 'Sidekick'] },
    { title: 'HBO Limited Series', roles: ['Complex Lead', 'Antagonist', 'Family Member', 'Professional', 'Narrator', 'Therapist', 'Teacher'] },
    { title: 'Commercial - Toyota', roles: ['Driver', 'Family Member', 'Salesperson', 'Mechanic', 'Spokesperson', 'Customer', 'Expert'] },
    { title: 'Broadway Musical', roles: ['Lead Vocalist', 'Ensemble', 'Dance Captain', 'Understudy', 'Featured Dancer', 'Chorus', 'Principal'] },
    { title: 'Independent Film', roles: ['Protagonist', 'Best Friend', 'Parent', 'Teacher', 'Local Business Owner', 'Neighbor', 'Stranger'] },
    { title: 'Disney+ Series', roles: ['Young Hero', 'Mentor', 'Comic Sidekick', 'Wise Elder', 'Magical Being', 'Ordinary Person', 'Guardian'] },
    { title: 'Amazon Prime Film', roles: ['Tech Entrepreneur', 'Investor', 'Engineer', 'Marketing Director', 'Customer Service', 'Analyst', 'Consultant'] }
  ]
  
  const statuses = ['new', 'reviewed', 'shortlisted', 'callback', 'offer', 'pass', 'booked']
  const priorities = ['urgent', 'high', 'medium', 'low']
  const ethnicities = ['Caucasian', 'African American', 'Hispanic/Latino', 'Asian', 'Middle Eastern', 'Native American', 'Mixed Race', 'Pacific Islander', 'South Asian', 'Other']
  const genders = ['Male', 'Female', 'Non-binary']
  const experienceLevels = ['Student', 'Emerging', 'Professional', 'Experienced', 'Veteran']
  const bodyTypes = ['Slender', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Muscular', 'Lean']
  
  // Archetype categories for quick filtering
  const archetypes = {
    'Leading Man': ['Hero', 'Protagonist', 'Lead Detective', 'Young Hero', 'Tech Entrepreneur'],
    'Leading Woman': ['Complex Lead', 'Hero', 'Young Hero', 'Lead Vocalist', 'Protagonist'],
    'Character Actor': ['Supporting Character', 'Local Business Owner', 'Teacher', 'Parent', 'Neighbor'],
    'Villain': ['Villain', 'Antagonist'],
    'Comic Relief': ['Comic Relief', 'Comic Sidekick', 'Ensemble'],
    'Authority Figure': ['Judge', 'Commander Blake', 'Security Chief', 'Detective Morgan', 'Director'],
    'Young Adult': ['Young Professional', 'Student', 'Young Hero', 'Tech Executive'],
    'Professional': ['Prosecutor', 'Defense Attorney', 'Doctor', 'Tech Executive', 'Engineer'],
    'Blue Collar': ['Mechanic', 'Driver', 'Security', 'Bartender', 'Local Business Owner'],
    'Romantic Lead': ['Love Interest', 'Romantic Lead'],
    'Ensemble': ['Ensemble', 'Chorus', 'Family Member', 'Jury Foreman'],
    'Specialty': ['Magical Being', 'Wise Elder', 'Mentor', 'Narrator']
  }
  
  const specialties = ['Drama', 'Comedy', 'Action', 'Musical Theatre', 'Commercial', 'Voice Over', 'Improv', 'Shakespeare', 'Contemporary', 'Period Piece', 'Sci-Fi', 'Horror']
  const skills = ['Martial Arts', 'Dancing', 'Singing', 'Instruments', 'Languages', 'Sports', 'Accents', 'Stunt Work', 'Magic', 'Stand-up Comedy', 'Horseback Riding', 'Swimming', 'Rock Climbing', 'Firearms Training']
  
  const submissions = []
  
  for (let i = 0; i < 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const project = projects[Math.floor(Math.random() * projects.length)]
    const role = project.roles[Math.floor(Math.random() * project.roles.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const age = Math.floor(Math.random() * 50) + 18
    const isAgentSubmission = Math.random() > 0.25
    const hasRating = Math.random() > 0.4
    const isShortlisted = Math.random() > 0.8
    const matchScore = Math.floor(Math.random() * 30) + 70
    const viewCount = Math.floor(Math.random() * 12)
    const gender = genders[Math.floor(Math.random() * genders.length)]
    const ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)]
    const experience = experienceLevels[Math.floor(Math.random() * experienceLevels.length)]
    const bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)]
    
    // Determine archetype based on role
    let archetype = 'Character Actor' // default
    for (const [archetypeName, roles] of Object.entries(archetypes)) {
      if (roles.some(r => role.includes(r) || r.includes(role))) {
        archetype = archetypeName
        break
      }
    }
    
    const selectedSpecialties: string[] = []
    const numSpecialties = Math.floor(Math.random() * 4) + 1
    for (let j = 0; j < numSpecialties; j++) {
      const specialty = specialties[Math.floor(Math.random() * specialties.length)]
      if (!selectedSpecialties.includes(specialty)) {
        selectedSpecialties.push(specialty)
      }
    }
    
    const selectedSkills: string[] = []
    const numSkills = Math.floor(Math.random() * 5)
    for (let j = 0; j < numSkills; j++) {
      const skill = skills[Math.floor(Math.random() * skills.length)]
      if (!selectedSkills.includes(skill)) {
        selectedSkills.push(skill)
      }
    }
    
    const agentName = isAgentSubmission ? 
      `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} - ${agents[Math.floor(Math.random() * (agents.length - 1))]}` : 
      'Direct Submission'
    
    const daysAgo = Math.floor(Math.random() * 60) + 1
    const submittedAt = new Date(Date.now() - daysAgo * 86400000)
    
    const notes = status === 'new' ? '' : [
      'Excellent performance in audition materials. Strong emotional depth.',
      'Perfect physical type for the role. Great energy and presence.',
      'Impressive technical skills and character preparation.',
      'Natural charisma and authentic delivery in materials.',
      'Strong vocal abilities and clear diction throughout.',
      'Professional attitude evident in submission quality.',
      'Unique interpretation brings fresh perspective to character.',
      'Compelling screen presence and camera-friendly performance.',
      'Extensive experience shows in polished audition technique.',
      'Great look for the project with strong acting fundamentals.'
    ][Math.floor(Math.random() * 10)]
    
    submissions.push({
      id: `sub${i + 1}`,
      actor: {
        id: `actor${i + 1}`,
        name: `${firstName} ${lastName}`,
        avatar: `https://placehold.co/80x80/e8d5f2/9c27b0?text=${firstName[0]}${lastName[0]}`,
        age,
        gender,
        ethnicity,
        bodyType,
        location: cities[Math.floor(Math.random() * cities.length)],
        union: unions[Math.floor(Math.random() * unions.length)],
        agent: agentName,
        experience,
        specialties: selectedSpecialties,
        skills: selectedSkills,
        height: Math.floor(Math.random() * 12) + 60, // inches
        credits: Math.floor(Math.random() * 50) + 1,
        archetype
      },
      project: {
        id: `proj${Math.floor(Math.random() * projects.length) + 1}`,
        title: project.title,
        role
      },
      submittedAt,
      status,
      priority,
      materials: {
        selfTape: {
          url: `https://example.com/tape${i + 1}`,
          duration: `${Math.floor(Math.random() * 4) + 1}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
          scenes: [`Scene ${Math.floor(Math.random() * 25) + 1}`, `Scene ${Math.floor(Math.random() * 25) + 26}`]
        },
        headshot: `https://placehold.co/400x500/e8d5f2/9c27b0?text=Headshot${i + 1}`,
        resume: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_resume.pdf`,
        reel: Math.random() > 0.2 ? {
          url: `https://example.com/reel${i + 1}`,
          duration: `${Math.floor(Math.random() * 5) + 2}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`
        } : null
      },
      matchScore,
      notes: status !== 'new' ? notes : '',
      rating: hasRating ? Math.floor(Math.random() * 5) + 1 : null,
      tags: status !== 'new' ? selectedSpecialties.slice(0, Math.floor(Math.random() * 3) + 1) : [],
      viewCount,
      lastViewed: viewCount > 0 ? new Date(Date.now() - Math.floor(Math.random() * daysAgo) * 86400000) : null,
      flagged: Math.random() > 0.97,
      shortlisted: isShortlisted,
      agentSubmission: isAgentSubmission,
      directSubmission: !isAgentSubmission,
      callbackDate: status === 'callback' ? new Date(Date.now() + Math.floor(Math.random() * 14) * 86400000) : undefined,
      offerDate: status === 'offer' ? new Date(Date.now() - Math.floor(Math.random() * 5) * 86400000) : undefined
    })
  }
  
  return submissions
}

const submissions = generateSubmissions()

const statusConfig = {
  new: { label: 'New', color: 'default', icon: <Clock className="w-4 h-4" /> },
  reviewed: { label: 'Reviewed', color: 'secondary', icon: <Eye className="w-4 h-4" /> },
  shortlisted: { label: 'Shortlisted', color: 'warning', icon: <Heart className="w-4 h-4" /> },
  callback: { label: 'Callback', color: 'success', icon: <Star className="w-4 h-4" /> },
  offer: { label: 'Offer Extended', color: 'success', icon: <CheckCircle className="w-4 h-4" /> },
  pass: { label: 'Pass', color: 'error', icon: <XCircle className="w-4 h-4" /> },
  booked: { label: 'Booked', color: 'success', icon: <Award className="w-4 h-4" /> }
}

// Quick filter button configurations
const quickFilters = {
  status: {
    label: 'Status',
    options: [
      { key: 'new', label: 'New', count: 0 },
      { key: 'reviewed', label: 'Reviewed', count: 0 },
      { key: 'shortlisted', label: 'Shortlisted', count: 0 },
      { key: 'callback', label: 'Callback', count: 0 },
      { key: 'offer', label: 'Offer', count: 0 },
      { key: 'pass', label: 'Pass', count: 0 },
      { key: 'booked', label: 'Booked', count: 0 }
    ]
  },
  archetype: {
    label: 'Archetype',
    options: [
      { key: 'Leading Man', label: 'Leading Man', count: 0 },
      { key: 'Leading Woman', label: 'Leading Woman', count: 0 },
      { key: 'Character Actor', label: 'Character Actor', count: 0 },
      { key: 'Villain', label: 'Villain', count: 0 },
      { key: 'Comic Relief', label: 'Comic Relief', count: 0 },
      { key: 'Authority Figure', label: 'Authority Figure', count: 0 },
      { key: 'Young Adult', label: 'Young Adult', count: 0 },
      { key: 'Professional', label: 'Professional', count: 0 },
      { key: 'Blue Collar', label: 'Blue Collar', count: 0 },
      { key: 'Romantic Lead', label: 'Romantic Lead', count: 0 }
    ]
  },
  demographics: {
    label: 'Demographics',
    options: [
      { key: 'Male', label: 'Male', count: 0 },
      { key: 'Female', label: 'Female', count: 0 },
      { key: 'Non-binary', label: 'Non-binary', count: 0 },
      { key: '18-25', label: '18-25', count: 0 },
      { key: '26-35', label: '26-35', count: 0 },
      { key: '36-45', label: '36-45', count: 0 },
      { key: '46+', label: '46+', count: 0 }
    ]
  },
  union: {
    label: 'Union Status',
    options: [
      { key: 'SAG-AFTRA', label: 'SAG-AFTRA', count: 0 },
      { key: 'Non-union', label: 'Non-union', count: 0 },
      { key: 'Eligible', label: 'Eligible', count: 0 }
    ]
  }
}

export default function CastingSubmissions() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState('submittedAt')
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  
  // Calculate filter counts and filtered results
  const { filteredSubmissions, filterCounts } = useMemo(() => {
    let filtered = [...submissions]
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.project.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.actor.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.actor.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sub.actor.archetype.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply active filters
    Object.entries(activeFilters).forEach(([category, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(sub => {
          switch (category) {
            case 'status':
              return values.includes(sub.status)
            case 'archetype':
              return values.includes(sub.actor.archetype)
            case 'demographics':
              return values.some(value => {
                if (['Male', 'Female', 'Non-binary'].includes(value)) {
                  return sub.actor.gender === value
                }
                if (value === '18-25') return sub.actor.age >= 18 && sub.actor.age <= 25
                if (value === '26-35') return sub.actor.age >= 26 && sub.actor.age <= 35
                if (value === '36-45') return sub.actor.age >= 36 && sub.actor.age <= 45
                if (value === '46+') return sub.actor.age >= 46
                return false
              })
            case 'union':
              return values.some(value => sub.actor.union.includes(value))
            default:
              return true
          }
        })
      }
    })
    
    // Sort filtered results
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'matchScore':
          return b.matchScore - a.matchScore
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
        default:
          return b.submittedAt.getTime() - a.submittedAt.getTime()
      }
    })
    
    // Calculate counts for each filter option
    const counts: Record<string, Record<string, number>> = {}
    Object.keys(quickFilters).forEach(category => {
      counts[category] = {}
      quickFilters[category as keyof typeof quickFilters].options.forEach(option => {
        counts[category][option.key] = submissions.filter(sub => {
          switch (category) {
            case 'status':
              return sub.status === option.key
            case 'archetype':
              return sub.actor.archetype === option.key
            case 'demographics':
              if (['Male', 'Female', 'Non-binary'].includes(option.key)) {
                return sub.actor.gender === option.key
              }
              if (option.key === '18-25') return sub.actor.age >= 18 && sub.actor.age <= 25
              if (option.key === '26-35') return sub.actor.age >= 26 && sub.actor.age <= 35
              if (option.key === '36-45') return sub.actor.age >= 36 && sub.actor.age <= 45
              if (option.key === '46+') return sub.actor.age >= 46
              return false
            case 'union':
              return sub.actor.union.includes(option.key)
            default:
              return false
          }
        }).length
      })
    })
    
    return { filteredSubmissions: filtered, filterCounts: counts }
  }, [searchQuery, activeFilters, sortBy])
  
  const stats = useMemo(() => ({
    total: submissions.length,
    filtered: filteredSubmissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    callbacks: submissions.filter(s => s.status === 'callback').length,
    offers: submissions.filter(s => s.status === 'offer').length,
    shortlisted: submissions.filter(s => s.shortlisted).length,
    avgRating: submissions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / submissions.filter(s => s.rating).length || 0
  }), [filteredSubmissions.length])
  
  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || []
      const isActive = current.includes(value)
      
      if (isActive) {
        return {
          ...prev,
          [category]: current.filter(v => v !== value)
        }
      } else {
        return {
          ...prev,
          [category]: [...current, value]
        }
      }
    })
  }
  
  const clearAllFilters = () => {
    setActiveFilters({})
    setSearchQuery('')
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
  
  const handleStatusChange = (submissionId: string, newStatus: string) => {
    console.log('Status change:', submissionId, newStatus)
  }
  
  const handleRating = (submissionId: string, rating: number) => {
    console.log('Rating:', submissionId, rating)
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Submissions Review"
        subtitle={`Review and manage ${stats.total.toLocaleString()} actor submissions`}
        actions={
          <div className="flex gap-2">
            {selectedSubmissions.length > 0 && (
              <>
                <Badge variant="secondary" className="py-2 px-3">
                  {selectedSubmissions.length} selected
                </Badge>
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-2" />
                  Shortlist All
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Bulk Schedule
                </Button>
              </>
            )}
            <Button onClick={clearAllFilters} variant="outline" size="sm">
              <FilterX className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Filtered</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.filtered.toLocaleString()}</p>
                </div>
                <Filter className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.new}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Callbacks</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.callbacks}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Offers</p>
                  <p className="text-2xl font-bold text-green-600">{stats.offers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.avgRating.toFixed(1)}</p>
                </div>
                <Award className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, role, project, archetype, or specialty..."
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
              <option value="matchScore">Best Matches</option>
              <option value="rating">Highest Rated</option>
              <option value="priority">Priority</option>
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
        
        {/* Quick Filter Buttons */}
        <div className="space-y-4 mb-8">
          {Object.entries(quickFilters).map(([category, config]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{config.label}</h3>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {config.options.map((option) => {
                    const isActive = activeFilters[category]?.includes(option.key) || false
                    const count = filterCounts[category]?.[option.key] || 0
                    
                    return (
                      <motion.div
                        key={option.key}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          onClick={() => toggleFilter(category, option.key)}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`transition-all duration-200 ${isActive ? 'ring-2 ring-primary-500/20' : 'hover:border-primary-300'}`}
                        >
                          {option.label}
                          {count > 0 && (
                            <Badge 
                              variant="secondary" 
                              className={`ml-2 ${isActive ? 'bg-white text-primary-600' : ''}`}
                            >
                              {count}
                            </Badge>
                          )}
                        </Button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
        
        {/* Active Filters Summary */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Active Filters</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(activeFilters).map(([category, values]) =>
                    values.map(value => (
                      <Badge key={`${category}-${value}`} variant="secondary" className="bg-blue-100 text-blue-800">
                        {value}
                        <button
                          onClick={() => toggleFilter(category, value)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <Button onClick={clearAllFilters} variant="ghost" size="sm">
                Clear All
              </Button>
            </div>
          </div>
        )}
        
        {/* Submissions List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredSubmissions.slice(0, 50).map((submission, index) => {
              const status = statusConfig[submission.status as keyof typeof statusConfig]
              
              return (
                <motion.div
                  key={submission.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Actor Information */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <Avatar className="w-20 h-20">
                                  <img 
                                    src={submission.actor.avatar} 
                                    alt={submission.actor.name}
                                    className="w-full h-full object-cover"
                                  />
                                </Avatar>
                                {submission.shortlisted && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <Heart className="w-3 h-3 fill-white text-white" />
                                  </div>
                                )}
                                {submission.flagged && (
                                  <div className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <Flag className="w-3 h-3 fill-white text-white" />
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant={status.color as any}
                                    className="flex items-center gap-1"
                                  >
                                    {status.icon}
                                    {status.label}
                                  </Badge>
                                  <Badge 
                                    className={`${getPriorityColor(submission.priority)} border`}
                                    size="sm"
                                  >
                                    {submission.priority.toUpperCase()}
                                  </Badge>
                                  <Badge variant="outline" size="sm">
                                    {submission.actor.archetype}
                                  </Badge>
                                  {submission.matchScore >= 90 && (
                                    <Badge variant="success" size="sm">
                                      <Target className="w-3 h-3 mr-1" />
                                      {submission.matchScore}% Match
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-xl font-heading font-semibold">
                                  {submission.actor.name}
                                </h3>
                                <p className="text-gray-600 mb-1">
                                  {submission.project.title} - <span className="font-medium">{submission.project.role}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                  {submission.actor.age} years • {submission.actor.gender} • {submission.actor.ethnicity} • {submission.actor.location}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {submission.actor.union} • {submission.actor.experience} • {submission.actor.credits} credits
                                </p>
                                <p className="text-sm text-blue-600 mt-1">{submission.actor.agent}</p>
                              </div>
                            </div>
                            
                            {/* Rating */}
                            {submission.rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 cursor-pointer ${
                                      i < (submission.rating ?? 0)
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-gray-300 hover:text-yellow-400'
                                    }`}
                                    onClick={() => handleRating(submission.id, i + 1)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Specialties & Skills */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {submission.actor.specialties.map(specialty => (
                                <Badge key={specialty} variant="outline" size="sm">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                            {submission.actor.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {submission.actor.skills.slice(0, 4).map(skill => (
                                  <Badge key={skill} variant="secondary" size="sm">
                                    {skill}
                                  </Badge>
                                ))}
                                {submission.actor.skills.length > 4 && (
                                  <Badge variant="secondary" size="sm">
                                    +{submission.actor.skills.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Materials */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Materials</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" size="sm" className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                Self-Tape ({submission.materials.selfTape.duration})
                              </Badge>
                              <Badge variant="outline" size="sm">
                                Headshot
                              </Badge>
                              <Badge variant="outline" size="sm">
                                Resume
                              </Badge>
                              {submission.materials.reel && (
                                <Badge variant="outline" size="sm" className="flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  Reel ({submission.materials.reel.duration})
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Notes */}
                          {submission.notes && (
                            <div className="p-3 bg-gray-50 rounded-lg mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">Casting Notes</p>
                              <p className="text-sm text-gray-600">{submission.notes}</p>
                            </div>
                          )}
                          
                          {/* Timeline */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {submission.submittedAt.toLocaleDateString()}
                            </div>
                            {submission.lastViewed && (
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                Viewed {submission.viewCount}x
                              </div>
                            )}
                            {submission.callbackDate && (
                              <div className="flex items-center gap-1 text-purple-600 font-medium">
                                <Calendar className="w-4 h-4" />
                                Callback {submission.callbackDate.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="lg:w-48 space-y-2">
                          <Button
                            onClick={() => router.push(`/casting/submissions/${submission.id}`)}
                            variant="default"
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                          
                          {submission.status === 'new' && (
                            <>
                              <Button
                                onClick={() => handleStatusChange(submission.id, 'callback')}
                                variant="success"
                                size="sm"
                                className="w-full"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Callback
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(submission.id, 'pass')}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Pass
                              </Button>
                            </>
                          )}
                          
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="flex-1">
                              <Bookmark className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        
        {/* Show More Button */}
        {filteredSubmissions.length > 50 && (
          <div className="text-center py-8">
            <Button variant="outline">
              Show More ({filteredSubmissions.length - 50} remaining)
            </Button>
          </div>
        )}
        
        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No submissions match your filters
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or removing some filters
            </p>
            <Button onClick={clearAllFilters} variant="outline">
              Clear All Filters
            </Button>
          </motion.div>
        )}
      </PageContent>
    </AppLayout>
  )
}
