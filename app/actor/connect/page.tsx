'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/lib/store/auth-store'

type Listing = {
  id: number
  title: string
  description?: string
  criteria?: any
  status: 'open' | 'closed'
  agency: { id: number; name: string; location?: string; website?: string; focus_tags?: string[]; is_verified?: boolean }
}

export default function InsideConnectDiscover() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [q, setQ] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [union, setUnion] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [listings, setListings] = React.useState<Listing[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [pitching, setPitching] = React.useState<number | null>(null)
  const [coverLetter, setCoverLetter] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (location) params.set('location', location)
      if (union) params.set('union', union)
      const res = await fetch(`/api/connect/listings?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load listings')
      const j = await res.json()
      setListings(Array.isArray(j.listings) ? j.listings : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [q, location, union])

  React.useEffect(() => {
    load()
  }, [load])

  const submitPitch = async (listingId: number) => {
    try {
      if (!token) throw new Error('Please log in')
      const res = await fetch('/api/connect/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_type: 'listing', target_id: listingId, cover_letter: coverLetter }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setPitching(null)
      setCoverLetter('')
      alert('Submitted! You can track responses in your submissions.')
    } catch (e: any) {
      alert(e?.message || 'Failed to submit')
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Inside Connect" subtitle="Find agencies and pitch yourself" />
      <PageContent>
        <Card className="mb-4">
          <CardContent className="p-4 grid sm:grid-cols-4 gap-3">
            <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Agency or listing" />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or state" />
            <Input label="Union" value={union} onChange={(e) => setUnion(e.target.value)} placeholder="SAG-AFTRA, AEA" />
            <div className="flex items-end">
              <Button onClick={load} fullWidth loading={loading}>Search</Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm mb-3">{error}</div>
        )}

        <div className="space-y-3">
          {listings.map((l) => (
            <Card key={l.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="text-base sm:text-lg">{l.title}</div>
                    <CardDescription>{l.agency.name}{l.agency.location ? ` • ${l.agency.location}` : ''}</CardDescription>
                  </div>
                  {Array.isArray(l.agency.focus_tags) && (
                    <div className="hidden sm:flex gap-1 flex-wrap max-w-[50%] justify-end">
                      {l.agency.focus_tags.slice(0, 4).map((t: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{String(t)}</Badge>
                      ))}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{l.description}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setPitching(l.id)}>Pitch Yourself</Button>
                  {l.agency.website && (
                    <Button size="sm" variant="outline" onClick={() => window.open(l.agency.website!, '_blank')}>Agency Website</Button>
                  )}
                </div>

                {pitching === l.id && (
                  <div className="mt-3 border rounded-md p-3">
                    <label className="block text-sm text-gray-700 mb-1">Cover Letter</label>
                    <textarea className="w-full border rounded-md p-2 text-sm" rows={4} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => submitPitch(l.id)}>Submit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setPitching(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {listings.length === 0 && !loading && (
            <div className="text-sm text-gray-600">No open listings found. Try adjusting filters.</div>
          )}
        </div>
      </PageContent>
    </AppLayout>
  )
}

