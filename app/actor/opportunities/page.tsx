'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  Film,
  Tv,
  Theater,
  Mic,
  Star,
  Clock,
  ChevronRight,
  Heart,
  Send,
  X,
  SlidersHorizontal
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/lib/store/auth-store'

// Mock opportunities data
const opportunities = [
  {
    id: '1',
    title: 'Lead Role in Indie Drama',
    project: 'Breaking Chains',
    type: 'Film',
    role: 'Daniel',
    description: 'A complex character dealing with family trauma and redemption. Looking for someone who can bring depth and authenticity to this emotionally challenging role.',
    requirements: {
      ageRange: '25-35',
      gender: 'Male',
      ethnicity: 'Any',
      union: 'SAG-AFTRA preferred'
    },
    location: 'Los Angeles, CA',
    dates: 'March 15 - April 30, 2024',
    compensation: 'SAG Scale',
    deadline: new Date(Date.now() + 86400000 * 7),
    submissions: 127,
    saved: false,
    applied: false,
    matchScore: 95
  },
  {
    id: '2',
    title: 'Recurring Role in Netflix Series',
    project: 'City Lights Season 2',
    type: 'TV Series',
    role: 'Detective Marcus',
    description: 'Seeking a charismatic actor for a recurring detective role. Must have strong presence and ability to handle both dramatic and comedic moments.',
    requirements: {
      ageRange: '30-40',
      gender: 'Male',
      ethnicity: 'African American',
      union: 'Must be SAG-AFTRA'
    },
    location: 'Atlanta, GA',
    dates: 'February - June 2024',
    compensation: '$2,500/day',
    deadline: new Date(Date.now() + 86400000 * 5),
    submissions: 245,
    saved: true,
    applied: false,
    matchScore: 88
  },
  {
    id: '3',
    title: 'National Commercial',
    project: 'Nike - Just Do It Campaign',
    type: 'Commercial',
    role: 'Basketball Player',
    description: 'Athletic build required. Must be able to play basketball at a high level. Speaking role with potential for campaign extension.',
    requirements: {
      ageRange: '20-30',
      gender: 'Any',
      ethnicity: 'Any',
      union: 'Non-union OK'
    },
    location: 'Miami, FL',
    dates: 'January 20-22, 2024',
    compensation: '$5,000 + residuals',
    deadline: new Date(Date.now() + 86400000 * 3),
    submissions: 89,
    saved: false,
    applied: true,
    matchScore: 92
  },
  {
    id: '4',
    title: 'Shakespeare in the Park',
    project: 'Hamlet',
    type: 'Theater',
    role: 'Hamlet',
    description: 'Classical training preferred. Must be comfortable with Shakespeare and outdoor performance. This is a physically demanding role.',
    requirements: {
      ageRange: '25-40',
      gender: 'Male',
      ethnicity: 'Any',
      union: 'AEA preferred'
    },
    location: 'New York, NY',
    dates: 'May - August 2024',
    compensation: 'AEA Scale',
    deadline: new Date(Date.now() + 86400000 * 14),
    submissions: 67,
    saved: false,
    applied: false,
    matchScore: 78
  }
]

const filterOptions = {
  type: ['All', 'Film', 'TV Series', 'Commercial', 'Theater', 'Voice Over'],
  location: ['All', 'Los Angeles', 'New York', 'Atlanta', 'Chicago', 'Remote'],
  compensation: ['All', 'Paid', 'Deferred', 'Copy/Credit/Meals'],
  union: ['All', 'SAG-AFTRA', 'AEA', 'Non-union']
}

export default function ActorOpportunities() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'All',
    location: 'All',
    compensation: 'All',
    union: 'All'
  })
  const [savedOpportunities, setSavedOpportunities] = useState<string[]>(['2'])
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>(['3'])
  
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.role.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedFilters.type === 'All' || opp.type === selectedFilters.type
    const matchesLocation = selectedFilters.location === 'All' || opp.location.includes(selectedFilters.location)
    
    return matchesSearch && matchesType && matchesLocation
  })
  
  const handleSave = (oppId: string) => {
    setSavedOpportunities(prev => 
      prev.includes(oppId) 
        ? prev.filter(id => id !== oppId)
        : [...prev, oppId]
    )
  }
  
  const handleApply = (oppId: string) => {
    router.push(`/actor/submit?opportunity=${oppId}`)
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Film': return <Film className="w-4 h-4" />
      case 'TV Series': return <Tv className="w-4 h-4" />
      case 'Commercial': return <Mic className="w-4 h-4" />
      case 'Theater': return <Theater className="w-4 h-4" />
      default: return <Film className="w-4 h-4" />
    }
  }
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Film': return 'bg-purple-100 text-purple-700'
      case 'TV Series': return 'bg-blue-100 text-blue-700'
      case 'Commercial': return 'bg-green-100 text-green-700'
      case 'Theater': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Casting Opportunities"
        subtitle="Find your next role"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/actor/submissions')}
              variant="outline"
            >
              My Submissions
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search roles, projects, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
              className="pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Badge variant="secondary">
                {filteredOpportunities.length} roles
              </Badge>
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
                      location: 'All',
                      compensation: 'All',
                      union: 'All'
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
        <div className="space-y-4">
          {filteredOpportunities.map((opp, index) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getTypeColor(opp.type)}>
                              <span className="flex items-center gap-1">
                                {getTypeIcon(opp.type)}
                                {opp.type}
                              </span>
                            </Badge>
                            {opp.matchScore >= 90 && (
                              <Badge variant="success">
                                <Star className="w-3 h-3 mr-1" />
                                {opp.matchScore}% Match
                              </Badge>
                            )}
                            {appliedOpportunities.includes(opp.id) && (
                              <Badge variant="secondary">Applied</Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-heading font-semibold">
                            {opp.title}
                          </h3>
                          <p className="text-gray-600">
                            {opp.project} • Role: {opp.role}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSave(opp.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className={cn(
                            'w-5 h-5',
                            savedOpportunities.includes(opp.id) && 'fill-current text-red-500'
                          )} />
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {opp.description}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{opp.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{opp.dates}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{opp.compensation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Due {opp.deadline.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {opp.requirements.ageRange} years
                          </Badge>
                          <Badge variant="outline">
                            {opp.requirements.gender}
                          </Badge>
                          <Badge variant="outline">
                            {opp.requirements.union}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {opp.submissions} submissions
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 md:justify-center">
                      <Button
                        onClick={() => router.push(`/actor/opportunities/${opp.id}`)}
                        variant="outline"
                        className="flex-1 md:flex-initial"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        onClick={() => handleApply(opp.id)}
                        variant="default"
                        className="flex-1 md:flex-initial"
                        disabled={appliedOpportunities.includes(opp.id)}
                      >
                        {appliedOpportunities.includes(opp.id) ? (
                          <>Applied</>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Apply Now
                          </>
                        )}
                      </Button>
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
              Try adjusting your filters or search query
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilters({
                  type: 'All',
                  location: 'All',
                  compensation: 'All',
                  union: 'All'
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}