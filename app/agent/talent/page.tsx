'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Plus, MapPin, Grid, List } from 'lucide-react'
import { useActors } from '@/lib/hooks/useActorData'

export default function AgentTalentPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ location: '' })

  const { actors, loading } = useActors({ search: searchQuery, location: filters.location, limit: 100 })

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
                placeholder="Search by name or location..."
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

          {filterOpen && (
            <div className="mt-4 pt-4 border-t grid grid-cols-5 gap-4">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Locations</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Atlanta">Atlanta</option>
              </select>
            </div>
          )}
        </div>

        {/* Talent List (Real Users) */}
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading…</div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {actors.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/talent/${encodeURIComponent(a.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))}`)}
              >
                <div className="flex items-center gap-4">
                  <img
                    className="w-16 h-16 rounded-full object-cover bg-gray-100"
                    src={a.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}`}
                    alt={a.name}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{a.name}</h3>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {a.location || '—'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

