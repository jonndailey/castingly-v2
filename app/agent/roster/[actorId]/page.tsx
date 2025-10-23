'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Upload, Trash2, Download } from 'lucide-react'
import useAuthStore from '@/lib/store/auth-store'

type MediaItem = {
  id: string
  name: string
  category: string
  url: string | null
  signed_url: string | null
  thumbnail_url: string | null
  mime_type: string
  uploaded_at: string
}

export default function AgentRosterActorPage() {
  const router = useRouter()
  const params = useParams()
  const actorId = String(params.actorId)
  const { token } = useAuthStore()
  const [actor, setActor] = useState<any>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<'headshot' | 'reel' | 'resume' | 'self_tape' | 'voice_over' | 'document' | 'other'>('headshot')
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/actors/${actorId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined as any)
      const data = await res.json()
      setActor(data)
      const all: MediaItem[] = (data?.media?.all || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        url: m.url,
        signed_url: m.signed_url,
        thumbnail_url: m.thumbnail_url,
        mime_type: m.mime_type,
        uploaded_at: m.uploaded_at,
      }))
      setMedia(all)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [actorId])

  const beginUpload = () => fileInput.current?.click()

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return
    setUploading(true)
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
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Upload failed')
      }
      await load()
      setMessage('Uploaded successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(err?.message || 'Upload failed')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (fileId: string) => {
    if (!token) return
    if (!confirm('Delete this file permanently?')) return
    const res = await fetch(`/api/media/actor/${actorId}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setMessage(j.error || 'Delete failed')
      setTimeout(() => setMessage(''), 3000)
      return
    }
    await load()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/agent/roster')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Roster
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <img className="w-20 h-20 rounded-full object-cover bg-gray-100" src={actor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor?.name || '')}`} alt={actor?.name} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{actor?.name}</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" /> {actor?.location || '—'}</p>
            </div>
          </div>
        </div>

        {/* Upload for actor */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Upload Media for {actor?.name}</h2>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 border rounded-lg" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="headshot">Headshot</option>
              <option value="reel">Demo Reel</option>
              <option value="resume">Resume</option>
              <option value="self_tape">Self-Tape</option>
              <option value="voice_over">Voice Over</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
            <button onClick={beginUpload} disabled={uploading} className="px-3 py-2 border rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50">
              <Upload className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input ref={fileInput} onChange={onFileSelected} type="file" className="hidden" />
          </div>
          {message && <div className="mt-2 text-sm text-gray-500">{message}</div>}
        </div>

        {/* Media list */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Media</h2>
          {media.length === 0 ? (
            <div className="text-sm text-gray-500">No media uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {media.map((m) => (
                <div key={m.id} className="border rounded-lg p-3">
                  <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                    {m.thumbnail_url ? (
                      <img src={m.thumbnail_url} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">No preview</span>
                    )}
                  </div>
                  <div className="text-sm font-medium truncate" title={m.name}>{m.name}</div>
                  <div className="text-xs text-gray-500">{m.category}</div>
                  <div className="mt-2 flex items-center gap-2">
                    {(m.url || m.signed_url) && (
                      <a className="px-2 py-1 border rounded text-sm flex items-center gap-1" href={m.url || m.signed_url || '#'} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4" /> View
                      </a>
                    )}
                    <button className="ml-auto px-2 py-1 border rounded text-sm text-red-600 flex items-center gap-1" onClick={() => removeFile(m.id)}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
