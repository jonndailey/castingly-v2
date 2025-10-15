'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, Star, MapPin, Award, Eye, ChevronRight, Grid, List } from 'lucide-react';

type Talent = {
  id: string;
  name: string;
  age: number;
  location: string;
  unionStatus: string;
  specialties: string[];
  rating: number;
  views: number;
  inRoster: boolean;
  image: string | null;
};

const ALL_TALENT: Talent[] = [
  {
    id: '1',
    name: 'Sophia Martinez',
    age: 28,
    location: 'Los Angeles, CA',
    unionStatus: 'SAG-AFTRA',
    specialties: ['Drama', 'Comedy'],
    rating: 4.8,
    views: 245,
    inRoster: true,
    image: null,
  },
  {
    id: '2',
    name: 'David Kim',
    age: 32,
    location: 'New York, NY',
    unionStatus: 'AEA',
    specialties: ['Theater', 'Musical'],
    rating: 4.9,
    views: 189,
    inRoster: false,
    image: null,
  },
  {
    id: '3',
    name: 'Jessica Brown',
    age: 26,
    location: 'Chicago, IL',
    unionStatus: 'Non-Union',
    specialties: ['Commercial', 'Voice Over'],
    rating: 4.6,
    views: 156,
    inRoster: true,
    image: null,
  },
  {
    id: '4',
    name: 'Ryan Thompson',
    age: 30,
    location: 'Atlanta, GA',
    unionStatus: 'SAG-AFTRA',
    specialties: ['Action', 'Drama'],
    rating: 4.7,
    views: 298,
    inRoster: false,
    image: null,
  },
  {
    id: '5',
    name: 'Maria Garcia',
    age: 24,
    location: 'Miami, FL',
    unionStatus: 'Non-Union',
    specialties: ['Comedy', 'Improv'],
    rating: 4.5,
    views: 134,
    inRoster: false,
    image: null,
  },
  {
    id: '6',
    name: 'Alex Chen',
    age: 29,
    location: 'San Francisco, CA',
    unionStatus: 'SAG-AFTRA',
    specialties: ['Drama', 'Sci-Fi'],
    rating: 4.8,
    views: 267,
    inRoster: true,
    image: null,
  },
  {
    id: '7',
    name: 'Emma Wilson',
    age: 27,
    location: 'Seattle, WA',
    unionStatus: 'AEA',
    specialties: ['Theater', 'Classical'],
    rating: 4.9,
    views: 201,
    inRoster: false,
    image: null,
  },
  {
    id: '8',
    name: 'Marcus Johnson',
    age: 35,
    location: 'Boston, MA',
    unionStatus: 'SAG-AFTRA',
    specialties: ['Drama', 'Historical'],
    rating: 4.7,
    views: 312,
    inRoster: true,
    image: null,
  },
];

export default function AgentTalentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    ageRange: '',
    unionStatus: '',
    gender: '',
    ethnicity: '',
  });

  const [talent, setTalent] = useState<Talent[]>(ALL_TALENT);

  useEffect(() => {
    // Filter talent based on search and filters
    let filtered = ALL_TALENT;
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(t => t.location.includes(filters.location));
    }

    if (filters.unionStatus) {
      filtered = filtered.filter(t => t.unionStatus === filters.unionStatus);
    }

    setTalent(filtered);
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Talent Directory</h1>
            <p className="text-gray-600 mt-1">Discover and manage talent for your productions</p>
          </div>
          <button
            onClick={() => router.push('/agent/talent/add')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Talent
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, location, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <div className="flex gap-2 border-l pl-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <div className="mt-4 pt-4 border-t grid grid-cols-5 gap-4">
              <select
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Locations</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Atlanta">Atlanta</option>
              </select>
              <select
                value={filters.ageRange}
                onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Ages</option>
                <option value="18-25">18-25</option>
                <option value="26-35">26-35</option>
                <option value="36-45">36-45</option>
                <option value="46+">46+</option>
              </select>
              <select
                value={filters.unionStatus}
                onChange={(e) => setFilters({...filters, unionStatus: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Union Status</option>
                <option value="SAG-AFTRA">SAG-AFTRA</option>
                <option value="AEA">AEA</option>
                <option value="Non-Union">Non-Union</option>
              </select>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
              </select>
              <select
                value={filters.ethnicity}
                onChange={(e) => setFilters({...filters, ethnicity: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Ethnicities</option>
                <option value="Caucasian">Caucasian</option>
                <option value="African American">African American</option>
                <option value="Latino/Hispanic">Latino/Hispanic</option>
                <option value="Asian">Asian</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Talent</p>
            <p className="text-2xl font-bold text-gray-900">{talent.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">In Your Roster</p>
            <p className="text-2xl font-bold text-gray-900">{talent.filter(t => t.inRoster).length}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Available</p>
            <p className="text-2xl font-bold text-gray-900">{talent.filter(t => !t.inRoster).length}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">New This Week</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
        </div>

        {/* Talent Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {talent.map((person) => (
              <div
                key={person.id}
                onClick={() => router.push(`/agent/talent/${person.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-[3/4] bg-gray-200 rounded-t-lg relative">
                  {person.inRoster && (
                    <span className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                      In Roster
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{person.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-3 h-3" />
                    {person.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Award className="w-3 h-3" />
                    {person.unionStatus}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {person.specialties.map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{person.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{person.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            {talent.map((person, index) => (
              <div
                key={person.id}
                onClick={() => router.push(`/agent/talent/${person.id}`)}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer ${
                  index !== talent.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{person.name}</h3>
                    {person.inRoster && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        In Roster
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {person.location}
                    </span>
                    <span>Age {person.age}</span>
                    <span>{person.unionStatus}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {person.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{person.rating}</span>
                    </div>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{person.views}</p>
                    <p className="text-xs text-gray-600">Views</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
