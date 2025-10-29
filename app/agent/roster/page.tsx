'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Upload, MapPin } from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { useActors } from '@/lib/hooks/useActorData'
import useAuthStore from '@/lib/store/auth-store'

type UploadState = {
  [actorId: string]: { uploading: boolean; category: 'headshot' | 'reel' | 'resume' | 'self_tape' | 'voice_over' | 'document' | 'other' }
}

export default function AgentRosterPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const { actors, loading } = useActors({ search: searchQuery, location: locationFilter, limit: 100 })
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const [upload, setUpload] = useState<UploadState>({})
  const [message, setMessage] = useState<Record<string, string>>({})

  const startUpload = (actorId: string) => {
    if (!fileInputs.current[actorId]) return
    fileInputs.current[actorId]!.click()
  }

  const onFileSelected = async (actorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return
    const category = upload[actorId]?.category || 'headshot'
    setUpload((s) => ({ ...s, [actorId]: { uploading: true, category } }))
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name)
      form.append('category', category)
      const res = await fetch(`/api/media/actor/${actorId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Upload failed')
      }
      setMessage((m) => ({ ...m, [actorId]: 'Uploaded successfully' }))
      setTimeout(() => setMessage((m) => ({ ...m, [actorId]: '' })), 3000)
    } catch (err: any) {
      setMessage((m) => ({ ...m, [actorId]: err?.message || 'Upload failed' }))
      setTimeout(() => setMessage((m) => ({ ...m, [actorId]: '' })), 3000)
    } finally {
      setUpload((s) => ({ ...s, [actorId]: { uploading: false, category: s[actorId]?.category || 'headshot' } }))
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Talent Roster"
        subtitle="Manage your represented actors and their media"
        actions={<button className="px-3 py-2 border rounded-lg" onClick={() => router.push('/agent/talent/add')}>Add New Talent</button>}
      />
      <PageContent>
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Locations</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Atlanta">Atlanta</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading…</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {actors.map((a) => (
              <div key={a.id} className="bg-white rounded-lg border p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ActorPrimaryHeadshot actorId={a.id} fallback={a.avatar_url} name={a.name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-xs text-gray-500 truncate">{a.email}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="px-2 py-1 border rounded-lg text-sm"
                    value={upload[a.id]?.category || 'headshot'}
                    onChange={(e) => setUpload((s) => ({ ...s, [a.id]: { uploading: false, category: e.target.value as any } }))}
                  >
                    <option value="headshot">Headshot</option>
                    <option value="reel">Demo Reel</option>
                    <option value="resume">Resume</option>
                    <option value="self_tape">Self-Tape</option>
                    <option value="voice_over">Voice Over</option>
                    <option value="document">Document</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    className="px-3 py-1 border rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => startUpload(a.id)}
                    disabled={!token || upload[a.id]?.uploading}
                  >
                    <Upload className="w-4 h-4" />
                    {upload[a.id]?.uploading ? 'Uploading…' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    ref={(el) => { fileInputs.current[a.id] = el }}
                    className="hidden"
                    onChange={(e) => onFileSelected(a.id, e)}
                  />
                  <button
                    className="ml-auto text-sm text-primary-600 hover:text-primary-700"
                    onClick={() => router.push(`/agent/roster/${a.id}`)}
                  >
                    Manage
                  </button>
                </div>
                {message[a.id] && (
                  <div className="text-xs text-gray-500">{message[a.id]}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}

function ActorPrimaryHeadshot({ actorId, fallback, name }: { actorId: string; fallback?: string | null; name: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const loadedRef = useRef(false)
  const { token } = useAuthStore()
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      try {
        const res = await fetch(`/api/actors/${actorId}?media=1`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined as any)
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        const headshots = data?.media?.headshots || []
        const first = headshots[0]
        // Prefer edge-cached serve URL (first.url) when available; then thumbnail; then signed; then public
        const preferred = first?.url || first?.thumbnail_url || first?.signed_url || first?.public_url || null
        const display = versionedUrl(preferred, first?.uploaded_at)
        setSrc(display)
      } catch {
        setSrc(null)
      }
    })()
  }, [actorId])
  const display = src || fallback || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
  return <img className="w-12 h-12 rounded-full object-cover bg-gray-100" src={display} alt={name} />
}

function versionedUrl(u?: string | null, uploadedAt?: string) {
  if (!u) return u || null
  const isSigned = /[?&]X-Amz-(Signature|Credential)=/i.test(u)
  if (isSigned) return u
  if (!uploadedAt) return u
  const ts = Date.parse(uploadedAt)
  if (Number.isNaN(ts)) return u
  const sep = u.includes('?') ? '&' : '?'
  return `${u}${sep}v=${ts}`
}
