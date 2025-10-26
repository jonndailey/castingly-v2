'use client'

import * as React from 'react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/lib/store/auth-store'

export default function ManageListings() {
  const { token } = useAuthStore()
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  const create = async () => {
    try {
      setCreating(true)
      setMessage(null)
      const res = await fetch('/api/connect/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, description }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || 'Failed to create listing')
      setTitle('')
      setDescription('')
      setMessage('Listing created')
    } catch (e: any) {
      setMessage(e?.message || 'Failed to create listing')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Inside Connect" subtitle="Open calls for representation" />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>Create Open Call</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Commercial Department: New Talent" />
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea className="w-full border rounded-md p-2 text-sm" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {message && (
              <div className="text-sm text-gray-700">{message}</div>
            )}
            <div className="flex gap-2">
              <Button onClick={create} loading={creating}>Create Listing</Button>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </AppLayout>
  )
}

