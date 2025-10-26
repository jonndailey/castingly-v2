'use client'

import * as React from 'react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAuthStore from '@/lib/store/auth-store'

type Submission = {
  id: number
  actor_id: number
  actor_name: string
  actor_email: string
  target_type: 'agency' | 'listing'
  target_id: number
  listing_title?: string
  agency_name?: string
  cover_letter?: string
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn'
  created_at: string
}

const statusVariant = (s: Submission['status']) => {
  switch (s) {
    case 'pending': return 'secondary'
    case 'shortlisted': return 'default'
    case 'accepted': return 'success'
    case 'rejected': return 'destructive'
    case 'withdrawn': return 'outline'
    default: return 'secondary'
  }
}

export default function InsideConnectInbox() {
  const { token } = useAuthStore()
  const [submissions, setSubmissions] = React.useState<Submission[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/connect/submissions?mode=agent', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error('Failed to load submissions')
      const j = await res.json()
      setSubmissions(Array.isArray(j.submissions) ? j.submissions : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [token])

  React.useEffect(() => { load() }, [load])

  const setStatus = async (id: number, status: Submission['status']) => {
    try {
      if (!token) return
      const res = await fetch(`/api/connect/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    } catch (e: any) {
      alert(e?.message || 'Failed to update')
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Inside Connect" subtitle="Representation submissions to your agency" />
      <PageContent>
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm mb-3">{error}</div>
        )}
        <div className="space-y-3">
          {submissions.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="text-sm sm:text-base font-medium">{s.actor_name} <span className="text-gray-500 text-xs">({s.actor_email})</span></div>
                    <div className="text-xs text-gray-600">{s.listing_title || s.agency_name || 'General pitch'}</div>
                  </div>
                  <Badge variant={statusVariant(s.status) as any}>{s.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                {s.cover_letter && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 line-clamp-4">{s.cover_letter}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setStatus(s.id, 'shortlisted')}>Shortlist</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(s.id, 'accepted')}>Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, 'rejected')}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {submissions.length === 0 && !loading && (
            <div className="text-sm text-gray-600">No submissions yet.</div>
          )}
        </div>
      </PageContent>
    </AppLayout>
  )
}

