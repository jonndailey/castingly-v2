'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Grid, List } from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { useActors } from '@/lib/hooks/useActorData'

export default function CastingTalentPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { actors, loading } = useActors({ search: query, limit: 100 })

  return (
    <AppLayout>
      <PageHeader
        title="Talent Discovery"
        subtitle="Explore and shortlist real talent"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 border rounded-lg ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 border rounded-lg ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <PageContent>
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

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
      </PageContent>
    </AppLayout>
  )
}

