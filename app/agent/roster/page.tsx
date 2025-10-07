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
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  MessageCircle,
  MoreVertical,
  User,
  Award,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Film,
  Tv,
  Theater,
  Mic,
  SortAsc,
  Download,
  UserPlus,
  Zap
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock talent roster data
const talentRoster = [
  {
    id: 'actor1',
    name: 'Marcus Johnson',
    avatar: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=MJ',
    age: 28,
    location: 'Los Angeles, CA',
    specialties: ['Film', 'Television', 'Commercial'],
    status: 'active',
    lastBooking: new Date(Date.now() - 86400000 * 5),
    totalEarnings: '$2.5M',
    yearEarnings: '$890K',
    bookingsThisYear: 12,
    rating: 4.9,
    recentProjects: ['Netflix Lead Series', 'Warner Bros Feature'],
    availability: 'available',
    contractEnd: new Date('2025-06-30'),
    joinDate: new Date('2020-03-15'),
    phoneNumber: '+1 (555) 123-4567',
    email: 'marcus.j@email.com',
    union: 'SAG-AFTRA',
    experience: 'Lead',
    archetype: 'Leading Man'
  },
  {
    id: 'actor2',
    name: 'Elena Rodriguez',
    avatar: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=ER',
    age: 25,
    location: 'New York, NY',
    specialties: ['Theater', 'Film', 'Voice Over'],
    status: 'active',
    lastBooking: new Date(Date.now() - 86400000 * 12),
    totalEarnings: '$1.8M',
    yearEarnings: '$420K',
    bookingsThisYear: 8,
    rating: 4.8,
    recentProjects: ['Broadway Revival', 'HBO Limited Series'],
    availability: 'busy',
    contractEnd: new Date('2024-12-31'),
    joinDate: new Date('2019-08-20'),
    phoneNumber: '+1 (555) 234-5678',
    email: 'elena.r@email.com',
    union: 'AEA/SAG-AFTRA',
    experience: 'Supporting',
    archetype: 'Dramatic Lead'
  },
  {
    id: 'actor3',
    name: 'David Chen',
    avatar: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=DC',
    age: 35,
    location: 'Atlanta, GA',
    specialties: ['Television', 'Commercial', 'Voice Over'],
    status: 'active',
    lastBooking: new Date(Date.now() - 86400000 * 18),
    totalEarnings: '$3.2M',
    yearEarnings: '$1.1M',
    bookingsThisYear: 15,
    rating: 4.7,
    recentProjects: ['Apple TV+ Series', 'Super Bowl Commercial'],
    availability: 'available',
    contractEnd: new Date('2025-08-15'),
    joinDate: new Date('2018-01-10'),
    phoneNumber: '+1 (555) 345-6789',
    email: 'david.c@email.com',
    union: 'SAG-AFTRA',
    experience: 'Lead',
    archetype: 'Character Actor'
  },
  {
    id: 'actor4',
    name: 'Sarah Williams',
    avatar: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=SW',
    age: 22,
    location: 'Los Angeles, CA',
    specialties: ['Film', 'Commercial', 'Social Media'],
    status: 'developing',
    lastBooking: new Date(Date.now() - 86400000 * 45),
    totalEarnings: '$180K',
    yearEarnings: '$65K',
    bookingsThisYear: 4,
    rating: 4.5,
    recentProjects: ['Indie Film Festival Winner', 'Nike Commercial'],
    availability: 'available',
    contractEnd: new Date('2026-02-28'),
    joinDate: new Date('2023-05-12'),
    phoneNumber: '+1 (555) 456-7890',
    email: 'sarah.w@email.com',
    union: 'Non-union',
    experience: 'Emerging',
    archetype: 'Young Adult'
  },
  {
    id: 'actor5',
    name: 'James Thompson',
    avatar: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=JT',
    age: 45,
    location: 'Chicago, IL',
    specialties: ['Theater', 'Film', 'Television'],
    status: 'active',
    lastBooking: new Date(Date.now() - 86400000 * 8),
    totalEarnings: '$4.1M',
    yearEarnings: '$750K',
    bookingsThisYear: 6,
    rating: 4.9,
    recentProjects: ['Steppenwolf Production', 'AMC Drama Series'],
    availability: 'busy',
    contractEnd: new Date('2024-11-30'),
    joinDate: new Date('2015-09-03'),
    phoneNumber: '+1 (555) 567-8901',
    email: 'james.t@email.com',
    union: 'AEA/SAG-AFTRA',
    experience: 'Veteran',
    archetype: 'Character Actor'
  },
  {
    id: 'actor6',
    name: 'Maya Patel',
    avatar: 'https://placehold.co/80x80/e8d5f2/9c27b0?text=MP',
    age: 30,
    location: 'Vancouver, BC',
    specialties: ['Film', 'Television', 'Voice Over'],
    status: 'active',
    lastBooking: new Date(Date.now() - 86400000 * 3),
    totalEarnings: '$2.8M',
    yearEarnings: '$980K',
    bookingsThisYear: 11,
    rating: 4.8,
    recentProjects: ['Marvel Studios Film', 'Prime Video Series'],
    availability: 'busy',
    contractEnd: new Date('2025-04-15'),
    joinDate: new Date('2019-11-22'),
    phoneNumber: '+1 (555) 678-9012',
    email: 'maya.p@email.com',
    union: 'ACTRA/SAG-AFTRA',
    experience: 'Lead',
    archetype: 'Action Hero'
  }
]

const filterOptions = {
  status: ['All', 'Active', 'Developing', 'Inactive'],
  availability: ['All', 'Available', 'Busy', 'On Hold'],
  specialty: ['All', 'Film', 'Television', 'Theater', 'Commercial', 'Voice Over'],
  experience: ['All', 'Emerging', 'Supporting', 'Lead', 'Veteran'],
  location: ['All', 'Los Angeles', 'New York', 'Atlanta', 'Chicago', 'Vancouver']
}

export default function AgentRoster() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'All',
    availability: 'All',
    specialty: 'All',
    experience: 'All',
    location: 'All'
  })
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTalent, setSelectedTalent] = useState<string[]>([])
  
  const filteredTalent = talentRoster.filter(talent => {
    const matchesSearch = talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          talent.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          talent.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedFilters.status === 'All' || talent.status === selectedFilters.status.toLowerCase()
    const matchesAvailability = selectedFilters.availability === 'All' || talent.availability === selectedFilters.availability.toLowerCase()
    const matchesSpecialty = selectedFilters.specialty === 'All' || talent.specialties.includes(selectedFilters.specialty)
    const matchesExperience = selectedFilters.experience === 'All' || talent.experience === selectedFilters.experience
    const matchesLocation = selectedFilters.location === 'All' || talent.location.includes(selectedFilters.location)
    
    return matchesSearch && matchesStatus && matchesAvailability && matchesSpecialty && matchesExperience && matchesLocation
  })
  
  const sortedTalent = [...filteredTalent].sort((a, b) => {
    switch(sortBy) {
      case 'earnings':
        return parseInt(b.yearEarnings.replace(/[$K,M]/g, '')) - parseInt(a.yearEarnings.replace(/[$K,M]/g, ''))
      case 'bookings':
        return b.bookingsThisYear - a.bookingsThisYear
      case 'rating':
        return b.rating - a.rating
      case 'lastBooking':
        return b.lastBooking.getTime() - a.lastBooking.getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })
  
  const stats = {
    total: talentRoster.length,
    active: talentRoster.filter(t => t.status === 'active').length,
    available: talentRoster.filter(t => t.availability === 'available').length,
    totalEarnings: talentRoster.reduce((sum, t) => sum + parseInt(t.yearEarnings.replace(/[$K,M]/g, '')), 0),
    avgRating: talentRoster.reduce((sum, t) => sum + t.rating, 0) / talentRoster.length
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'success'
      case 'developing': return 'warning'
      case 'inactive': return 'error'
      default: return 'secondary'
    }
  }
  
  const getAvailabilityColor = (availability: string) => {
    switch(availability) {
      case 'available': return 'success'
      case 'busy': return 'warning'
      case 'on hold': return 'error'
      default: return 'secondary'
    }
  }
  
  const getSpecialtyIcon = (specialty: string) => {
    switch(specialty) {
      case 'Film': return <Film className="w-3 h-3" />
      case 'Television': return <Tv className="w-3 h-3" />
      case 'Theater': return <Theater className="w-3 h-3" />
      case 'Commercial': return <Mic className="w-3 h-3" />
      case 'Voice Over': return <Mic className="w-3 h-3" />
      default: return <User className="w-3 h-3" />
    }
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
        title="Talent Roster"
        subtitle={`Managing ${stats.total} talented individuals`}
        actions={
          <div className="flex gap-2">
            {selectedTalent.length > 0 && (
              <>
                <Badge variant="secondary" className="py-2">
                  {selectedTalent.length} selected
                </Badge>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Add Talent
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
                  <p className="text-sm text-gray-600">Total Talent</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold">{stats.available}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">${stats.totalEarnings}M+</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search talent by name, specialty, or location..."
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
              <option value="name">Sort by Name</option>
              <option value="earnings">Sort by Earnings</option>
              <option value="bookings">Sort by Bookings</option>
              <option value="rating">Sort by Rating</option>
              <option value="lastBooking">Sort by Last Booking</option>
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                      availability: 'All',
                      specialty: 'All',
                      experience: 'All',
                      location: 'All'
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
        
        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing {sortedTalent.length} of {talentRoster.length} talent
          </p>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export List
          </Button>
        </div>
        
        {/* Talent Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTalent.map((talent, index) => (
              <motion.div
                key={talent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-lg transition-all cursor-pointer ${
                  selectedTalent.includes(talent.id) ? 'ring-2 ring-primary-500' : ''
                }`}>
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-16 h-16">
                          <img 
                            src={talent.avatar} 
                            alt={talent.name}
                            className="w-full h-full object-cover"
                          />
                        </Avatar>
                        <div>
                          <h3 className="font-heading font-semibold">{talent.name}</h3>
                          <p className="text-sm text-gray-600">{talent.age} years • {talent.experience}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-medium">{talent.rating}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSelection(talent.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex gap-2 mb-4">
                      <Badge variant={getStatusColor(talent.status) as any} size="sm">
                        {talent.status}
                      </Badge>
                      <Badge variant={getAvailabilityColor(talent.availability) as any} size="sm">
                        {talent.availability}
                      </Badge>
                    </div>
                    
                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {talent.specialties.map(specialty => (
                        <Badge key={specialty} variant="outline" size="sm">
                          <span className="flex items-center gap-1">
                            {getSpecialtyIcon(specialty)}
                            {specialty}
                          </span>
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">2024 Earnings</p>
                        <p className="font-semibold text-green-600">{talent.yearEarnings}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Bookings</p>
                        <p className="font-semibold">{talent.bookingsThisYear}</p>
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      {talent.location}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/agent/roster/${talent.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        onClick={() => router.push(`/messages?contact=${talent.id}`)}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTalent.map((talent, index) => (
              <motion.div
                key={talent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-all ${
                  selectedTalent.includes(talent.id) ? 'ring-2 ring-primary-500' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <img 
                          src={talent.avatar} 
                          alt={talent.name}
                          className="w-full h-full object-cover"
                        />
                      </Avatar>
                      
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{talent.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{talent.age} years</span>
                              <span>•</span>
                              <span>{talent.experience}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                <span>{talent.rating}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(talent.status) as any} size="sm">
                              {talent.status}
                            </Badge>
                            <Badge variant={getAvailabilityColor(talent.availability) as any} size="sm">
                              {talent.availability}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {talent.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {talent.yearEarnings} (2024)
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {talent.bookingsThisYear} bookings
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/agent/roster/${talent.id}`)}
                              variant="ghost"
                              size="sm"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => router.push(`/messages?contact=${talent.id}`)}
                              variant="ghost"
                              size="sm"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {sortedTalent.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No talent found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilters({
                  status: 'All',
                  availability: 'All',
                  specialty: 'All',
                  experience: 'All',
                  location: 'All'
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