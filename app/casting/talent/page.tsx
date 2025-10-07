'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Filter,
  Star,
  Heart,
  Eye,
  Send,
  Users,
  MapPin,
  Calendar,
  Award,
  Play,
  Grid,
  List,
  Bookmark,
  MessageSquare,
  Download,
  Target,
  Zap,
  TrendingUp,
  Film,
  Tv,
  Theater,
  Mic,
  FilterX,
  CheckCircle,
  Clock,
  DollarSign,
  Globe,
  User
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Generate comprehensive talent data (500+ actors)
const generateTalentDatabase = () => {
  const firstNames = [
    'Marcus', 'Elena', 'David', 'Sarah', 'James', 'Maya', 'Alex', 'Jessica', 'Michael', 'Rachel',
    'Daniel', 'Emma', 'Christopher', 'Isabella', 'Matthew', 'Olivia', 'Anthony', 'Sophia', 'Andrew', 'Ashley',
    'Joshua', 'Emily', 'Ryan', 'Madison', 'Brandon', 'Samantha', 'Tyler', 'Hannah', 'Kevin', 'Alexis',
    'Jordan', 'Grace', 'Nathan', 'Chloe', 'Ethan', 'Mia', 'Jacob', 'Abigail', 'Noah', 'Ava',
    'Logan', 'Lily', 'Lucas', 'Zoe', 'Mason', 'Sofia', 'Alexander', 'Charlotte', 'Benjamin', 'Amelia',
    'William', 'Harper', 'Elijah', 'Evelyn', 'Oliver', 'Luna', 'Henry', 'Victoria', 'Sebastian', 'Aria',
    'Jackson', 'Scarlett', 'Aiden', 'Zoey', 'Owen', 'Penelope', 'Samuel', 'Layla', 'John', 'Lillian'
  ]
  
  const lastNames = [
    'Johnson', 'Rodriguez', 'Chen', 'Williams', 'Thompson', 'Patel', 'Davis', 'Miller', 'Wilson', 'Garcia',
    'Martinez', 'Anderson', 'Brown', 'Jones', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez',
    'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King',
    'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter',
    'Mitchell', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart',
    'Murphy', 'Cook', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres',
    'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett'
  ]
  
  const cities = [
    'Los Angeles, CA', 'New York, NY', 'Atlanta, GA', 'Chicago, IL', 'Vancouver, BC',
    'Toronto, ON', 'Miami, FL', 'Austin, TX', 'Seattle, WA', 'Philadelphia, PA',
    'Boston, MA', 'Denver, CO', 'Nashville, TN', 'Portland, OR', 'San Francisco, CA',
    'Dallas, TX', 'Phoenix, AZ', 'Detroit, MI', 'Minneapolis, MN', 'Las Vegas, NV',
    'Orlando, FL', 'San Diego, CA', 'Montreal, QC', 'Washington, DC', 'Baltimore, MD'
  ]
  
  const unions = ['SAG-AFTRA', 'AEA/SAG-AFTRA', 'ACTRA/SAG-AFTRA', 'Non-union', 'SAG-AFTRA/ACTRA', 'Eligible', 'AFTRA', 'Must Join']
  
  const agents = [
    'CAA', 'WME', 'UTA', 'ICM', 'Gersh', 'APA', 'Paradigm', 'Innovative', 'Abrams',
    'Buchwald', 'Talentworks', 'A3 Artists', 'Stewart Talent', 'DDO Artists', 'Osbrink',
    'CESD', 'Clear Talent', 'Luber Roklin', 'Domain', 'Direct Submission'
  ]
  
  const genders = ['Male', 'Female', 'Non-binary']
  const ethnicities = [
    'Caucasian', 'African American', 'Hispanic/Latino', 'Asian', 'Middle Eastern',
    'Native American', 'Mixed Race', 'Pacific Islander', 'South Asian', 'East Asian',
    'Mediterranean', 'Scandinavian', 'Eastern European', 'Other'
  ]
  
  const experienceLevels = ['Student', 'Emerging', 'Professional', 'Experienced', 'Veteran', 'Master']
  const bodyTypes = ['Slender', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Muscular', 'Lean', 'Stocky', 'Petite']
  
  // Enhanced archetype categories
  const archetypes = {
    'Leading Man': { ageRange: [25, 45], common: true },
    'Leading Woman': { ageRange: [22, 40], common: true },
    'Character Actor': { ageRange: [25, 70], common: true },
    'Villain': { ageRange: [30, 60], common: false },
    'Comic Relief': { ageRange: [20, 50], common: true },
    'Authority Figure': { ageRange: [35, 65], common: true },
    'Young Adult': { ageRange: [18, 28], common: true },
    'Professional': { ageRange: [28, 55], common: true },
    'Blue Collar': { ageRange: [25, 60], common: true },
    'Romantic Lead': { ageRange: [22, 40], common: false },
    'Ensemble': { ageRange: [18, 65], common: true },
    'Specialty': { ageRange: [18, 70], common: false },
    'Ingenue': { ageRange: [18, 25], common: false },
    'Mentor': { ageRange: [45, 70], common: false },
    'Action Hero': { ageRange: [25, 45], common: false },
    'Comedic Lead': { ageRange: [22, 50], common: false },
    'Dramatic Lead': { ageRange: [25, 55], common: false },
    'Child': { ageRange: [8, 17], common: false },
    'Elder': { ageRange: [60, 85], common: false }
  }
  
  const specialties = [
    'Drama', 'Comedy', 'Action', 'Musical Theatre', 'Commercial', 'Voice Over',
    'Improv', 'Shakespeare', 'Contemporary', 'Period Piece', 'Sci-Fi', 'Horror',
    'Sitcom', 'Procedural', 'Soap Opera', 'Reality TV', 'Stand-up', 'Sketch',
    'Motion Capture', 'Green Screen', 'Physical Theatre', 'Mime', 'Clowning'
  ]
  
  const skills = [
    'Martial Arts', 'Dancing', 'Singing', 'Instruments', 'Languages', 'Sports',
    'Accents', 'Stunt Work', 'Magic', 'Stand-up Comedy', 'Horseback Riding', 'Swimming',
    'Rock Climbing', 'Firearms Training', 'Stage Combat', 'Parkour', 'Skateboarding',
    'Driving', 'Motorcycle', 'Ice Skating', 'Gymnastics', 'Yoga', 'Boxing',
    'Fencing', 'Archery', 'Juggling', 'Fire Breathing', 'Aerial Silks', 'Puppetry'
  ]
  
  const languages = [
    'English', 'Spanish', 'French', 'Mandarin', 'Arabic', 'Hindi', 'Portuguese',
    'Russian', 'Japanese', 'German', 'Korean', 'Italian', 'Dutch', 'Polish',
    'Swedish', 'Hebrew', 'Greek', 'Turkish', 'Vietnamese', 'Thai'
  ]
  
  const database = []
  
  // Generate 500 diverse talent profiles
  for (let i = 0; i < 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const gender = genders[Math.floor(Math.random() * genders.length)]
    const ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)]
    
    // Determine age and archetype relationship
    const age = Math.floor(Math.random() * 60) + 18
    const availableArchetypes = Object.entries(archetypes)
      .filter(([_, config]) => age >= config.ageRange[0] && age <= config.ageRange[1])
      .map(([name, config]) => ({ name, ...config }))
    
    const selectedArchetype = availableArchetypes.length > 0
      ? availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)].name
      : 'Character Actor'
    
    const experience = age < 25 ? 'Emerging' : 
                       age < 35 ? experienceLevels[Math.floor(Math.random() * 3) + 1] :
                       age < 50 ? experienceLevels[Math.floor(Math.random() * 3) + 2] :
                       experienceLevels[Math.floor(Math.random() * 2) + 3]
    
    const isAgentRepresented = Math.random() > 0.2
    const agentName = isAgentRepresented
      ? `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} - ${agents[Math.floor(Math.random() * (agents.length - 1))]}`
      : 'Direct Submission'
    
    // Generate specialties
    const numSpecialties = Math.floor(Math.random() * 5) + 2
    const selectedSpecialties = []
    for (let j = 0; j < numSpecialties; j++) {
      const specialty = specialties[Math.floor(Math.random() * specialties.length)]
      if (!selectedSpecialties.includes(specialty)) {
        selectedSpecialties.push(specialty)
      }
    }
    
    // Generate skills
    const numSkills = Math.floor(Math.random() * 7) + 1
    const selectedSkills = []
    for (let j = 0; j < numSkills; j++) {
      const skill = skills[Math.floor(Math.random() * skills.length)]
      if (!selectedSkills.includes(skill)) {
        selectedSkills.push(skill)
      }
    }
    
    // Generate languages
    const numLanguages = Math.floor(Math.random() * 3) + 1
    const selectedLanguages = ['English'] // Everyone speaks English
    for (let j = 1; j < numLanguages; j++) {
      const language = languages[Math.floor(Math.random() * languages.length)]
      if (!selectedLanguages.includes(language)) {
        selectedLanguages.push(language)
      }
    }
    
    const hasReel = Math.random() > 0.15
    const hasHeadshot = Math.random() > 0.05
    const isAvailable = Math.random() > 0.3
    const bookingRate = Math.floor(Math.random() * 40) + 60
    const responseRate = Math.floor(Math.random() * 30) + 70
    const credits = Math.floor(Math.random() * 100) + 1
    
    database.push({
      id: `actor${i + 1}`,
      name: `${firstName} ${lastName}`,
      avatar: `https://placehold.co/150x150/e8d5f2/9c27b0?text=${firstName[0]}${lastName[0]}`,
      age,
      gender,
      ethnicity,
      bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
      height: Math.floor(Math.random() * 20) + 60, // 5'0" to 6'8" in inches
      location: cities[Math.floor(Math.random() * cities.length)],
      union: unions[Math.floor(Math.random() * unions.length)],
      agent: agentName,
      experience,
      archetype: selectedArchetype,
      specialties: selectedSpecialties,
      skills: selectedSkills,
      languages: selectedLanguages,
      credits,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
      reviews: Math.floor(Math.random() * 50) + 1,
      availability: isAvailable ? 'Available' : 'Booked until ' + new Date(Date.now() + Math.random() * 90 * 86400000).toLocaleDateString(),
      dayRate: '$' + (Math.floor(Math.random() * 20) + 5) * 100 + '/day',
      bookingRate,
      responseRate,
      lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
      hasReel,
      hasHeadshot,
      reelDuration: hasReel ? `${Math.floor(Math.random() * 3) + 2}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}` : null,
      isVerified: Math.random() > 0.3,
      isFeatured: Math.random() > 0.9,
      matchScore: Math.floor(Math.random() * 30) + 70
    })
  }
  
  return database
}

const talentDatabase = generateTalentDatabase()

// Quick filter button configurations
const quickFilters = {
  archetype: {
    label: 'Archetype',
    options: [
      { key: 'Leading Man', label: 'Leading Man' },
      { key: 'Leading Woman', label: 'Leading Woman' },
      { key: 'Character Actor', label: 'Character Actor' },
      { key: 'Young Adult', label: 'Young Adult' },
      { key: 'Authority Figure', label: 'Authority' },
      { key: 'Comic Relief', label: 'Comedy' },
      { key: 'Professional', label: 'Professional' },
      { key: 'Blue Collar', label: 'Blue Collar' },
      { key: 'Villain', label: 'Villain' },
      { key: 'Action Hero', label: 'Action' },
      { key: 'Romantic Lead', label: 'Romantic' },
      { key: 'Mentor', label: 'Mentor' }
    ]
  },
  demographics: {
    label: 'Demographics',
    options: [
      { key: 'Male', label: 'Male' },
      { key: 'Female', label: 'Female' },
      { key: 'Non-binary', label: 'Non-binary' },
      { key: '18-25', label: '18-25' },
      { key: '26-35', label: '26-35' },
      { key: '36-45', label: '36-45' },
      { key: '46-55', label: '46-55' },
      { key: '55+', label: '55+' }
    ]
  },
  ethnicity: {
    label: 'Ethnicity',
    options: [
      { key: 'Caucasian', label: 'Caucasian' },
      { key: 'African American', label: 'African American' },
      { key: 'Hispanic/Latino', label: 'Hispanic/Latino' },
      { key: 'Asian', label: 'Asian' },
      { key: 'Middle Eastern', label: 'Middle Eastern' },
      { key: 'Mixed Race', label: 'Mixed Race' }
    ]
  },
  union: {
    label: 'Union Status',
    options: [
      { key: 'SAG-AFTRA', label: 'SAG-AFTRA' },
      { key: 'Non-union', label: 'Non-union' },
      { key: 'Eligible', label: 'Eligible' },
      { key: 'Must Join', label: 'Must Join' }
    ]
  },
  availability: {
    label: 'Availability',
    options: [
      { key: 'Available', label: 'Available Now' },
      { key: 'Booked', label: 'Currently Booked' }
    ]
  },
  experience: {
    label: 'Experience Level',
    options: [
      { key: 'Student', label: 'Student' },
      { key: 'Emerging', label: 'Emerging' },
      { key: 'Professional', label: 'Professional' },
      { key: 'Experienced', label: 'Experienced' },
      { key: 'Veteran', label: 'Veteran' }
    ]
  }
}

export default function TalentDiscovery() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('matchScore')
  const [selectedTalent, setSelectedTalent] = useState<string[]>([])
  
  // Calculate filter counts and filtered results
  const { filteredTalent, filterCounts } = useMemo(() => {
    let filtered = [...talentDatabase]
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(actor =>
        actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.specialties.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase())) ||
        actor.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        actor.archetype.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply active filters
    Object.entries(activeFilters).forEach(([category, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(actor => {
          switch (category) {
            case 'archetype':
              return values.includes(actor.archetype)
            case 'demographics':
              return values.some(value => {
                if (['Male', 'Female', 'Non-binary'].includes(value)) {
                  return actor.gender === value
                }
                if (value === '18-25') return actor.age >= 18 && actor.age <= 25
                if (value === '26-35') return actor.age >= 26 && actor.age <= 35
                if (value === '36-45') return actor.age >= 36 && actor.age <= 45
                if (value === '46-55') return actor.age >= 46 && actor.age <= 55
                if (value === '55+') return actor.age >= 55
                return false
              })
            case 'ethnicity':
              return values.includes(actor.ethnicity)
            case 'union':
              return values.some(value => actor.union.includes(value))
            case 'availability':
              return values.some(value => {
                if (value === 'Available') return actor.availability === 'Available'
                if (value === 'Booked') return actor.availability !== 'Available'
                return false
              })
            case 'experience':
              return values.includes(actor.experience)
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
          return parseFloat(b.rating) - parseFloat(a.rating)
        case 'bookingRate':
          return b.bookingRate - a.bookingRate
        case 'credits':
          return b.credits - a.credits
        case 'age':
          return a.age - b.age
        default:
          return 0
      }
    })
    
    // Calculate counts for each filter option
    const counts: Record<string, Record<string, number>> = {}
    Object.keys(quickFilters).forEach(category => {
      counts[category] = {}
      quickFilters[category as keyof typeof quickFilters].options.forEach(option => {
        counts[category][option.key] = talentDatabase.filter(actor => {
          switch (category) {
            case 'archetype':
              return actor.archetype === option.key
            case 'demographics':
              if (['Male', 'Female', 'Non-binary'].includes(option.key)) {
                return actor.gender === option.key
              }
              if (option.key === '18-25') return actor.age >= 18 && actor.age <= 25
              if (option.key === '26-35') return actor.age >= 26 && actor.age <= 35
              if (option.key === '36-45') return actor.age >= 36 && actor.age <= 45
              if (option.key === '46-55') return actor.age >= 46 && actor.age <= 55
              if (option.key === '55+') return actor.age >= 55
              return false
            case 'ethnicity':
              return actor.ethnicity === option.key
            case 'union':
              return actor.union.includes(option.key)
            case 'availability':
              if (option.key === 'Available') return actor.availability === 'Available'
              if (option.key === 'Booked') return actor.availability !== 'Available'
              return false
            case 'experience':
              return actor.experience === option.key
            default:
              return false
          }
        }).length
      })
    })
    
    return { filteredTalent: filtered, filterCounts: counts }
  }, [searchQuery, activeFilters, sortBy])
  
  const stats = useMemo(() => ({
    total: talentDatabase.length,
    filtered: filteredTalent.length,
    available: talentDatabase.filter(a => a.availability === 'Available').length,
    sagAftra: talentDatabase.filter(a => a.union.includes('SAG-AFTRA')).length,
    verified: talentDatabase.filter(a => a.isVerified).length,
    featured: talentDatabase.filter(a => a.isFeatured).length
  }), [filteredTalent.length])
  
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
  
  const toggleSelection = (talentId: string) => {
    setSelectedTalent(prev =>
      prev.includes(talentId)
        ? prev.filter(id => id !== talentId)
        : [...prev, talentId]
    )
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Talent Discovery"
        subtitle={`Discover and connect with ${stats.total.toLocaleString()} verified actors`}
        actions={
          <div className="flex gap-2">
            {selectedTalent.length > 0 && (
              <>
                <Badge variant="secondary" className="py-2 px-3">
                  {selectedTalent.length} selected
                </Badge>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact All
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save List
                </Button>
              </>
            )}
            <Button onClick={clearAllFilters} variant="outline" size="sm">
              <FilterX className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
            <Button variant="default">
              <Send className="w-4 h-4 mr-2" />
              Send Invites
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
                  <p className="text-sm text-gray-600">Total Talent</p>
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
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">SAG-AFTRA</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.sagAftra}</p>
                </div>
                <Award className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.verified}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.featured}</p>
                </div>
                <Star className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, location, skills, specialties, or archetype..."
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
              <option value="matchScore">Best Match</option>
              <option value="rating">Highest Rated</option>
              <option value="bookingRate">Booking Rate</option>
              <option value="credits">Most Credits</option>
              <option value="age">Age (Young to Old)</option>
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
        
        {/* Talent Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          <AnimatePresence mode="popLayout">
            {filteredTalent.slice(0, 60).map((actor, index) => (
              <motion.div
                key={actor.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 relative">
                  {actor.isFeatured && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge variant="warning" className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="relative inline-block">
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                          <img src={actor.avatar} alt={actor.name} className="w-full h-full object-cover" />
                        </Avatar>
                        {actor.isVerified && (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-heading font-semibold text-lg">{actor.name}</h3>
                      <p className="text-gray-600 text-sm">{actor.age} years • {actor.location}</p>
                      
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{actor.rating}</span>
                        <span className="text-gray-500 text-sm">({actor.reviews})</span>
                      </div>
                      
                      <Badge variant="outline" className="mt-2">
                        {actor.archetype}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Specialties</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {actor.specialties.slice(0, 3).map(spec => (
                            <Badge key={spec} variant="secondary" size="sm">{spec}</Badge>
                          ))}
                          {actor.specialties.length > 3 && (
                            <Badge variant="secondary" size="sm">+{actor.specialties.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Union</p>
                          <p className="font-medium truncate">{actor.union}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Credits</p>
                          <p className="font-medium">{actor.credits}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          {actor.availability === 'Available' ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600 font-medium">Available</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500 text-xs truncate">{actor.availability}</span>
                            </>
                          )}
                        </div>
                        <Badge variant="success" size="sm">
                          {actor.matchScore}% Match
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => router.push(`/casting/talent/${actor.id}`)}
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button variant="default" size="sm" className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        Send Invite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Show More Button */}
        {filteredTalent.length > 60 && (
          <div className="text-center py-8">
            <Button variant="outline">
              Show More ({filteredTalent.length - 60} remaining)
            </Button>
          </div>
        )}
        
        {/* Empty State */}
        {filteredTalent.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No talent matches your filters
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