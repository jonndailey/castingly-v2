'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Video,
  Image as ImageIcon,
  FileText,
  Music,
  Trash2,
  Eye,
  Download,
  Grid,
  List,
  Search,
  RefreshCw,
  Loader2,
  Shield,
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useAuthStore from '@/lib/store/auth-store'
import type { MediaCategory } from '@/lib/dmapi'

type MediaItem = {
  id: string
  name: string
  category: MediaCategory
  size: number
  mime_type: string
  uploaded_at: string
  url: string | null
  signed_url: string | null
  thumbnail_url: string | null
  is_public: boolean
  metadata: Record<string, unknown>
}

const CATEGORY_LABELS: Record<MediaCategory | 'all', string> = {
  all: 'All Media',
  headshot: 'Headshots',
  gallery: 'Gallery',
  reel: 'Reels',
  self_tape: 'Self-Tapes',
  voice_over: 'Voice Over',
  resume: 'Resumes',
  document: 'Documents',
  other: 'Other',
}

const DEFAULT_UPLOAD_CATEGORY: MediaCategory = 'headshot'
const UPLOADABLE_CATEGORIES: MediaCategory[] = [
  'headshot',
  'gallery',
  'reel',
  'self_tape',
  'voice_over',
  'resume',
  'document',
]

export default function ActorMedia() {
  const { token } = useAuthStore()
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<'all' | MediaCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadCategory, setUploadCategory] =
    useState<MediaCategory>(DEFAULT_UPLOAD_CATEGORY)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchMedia = useCallback(async () => {
    if (!token) {
      setError('You need to re-authenticate before managing media.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/media/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to load media library')
      }

      const payload = await response.json()
      const files = Array.isArray(payload.files) ? payload.files : []

      setMediaItems(
        files.map((file: any) => mapToMediaItem(file as Record<string, unknown>))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const filteredMedia = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return mediaItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory

      const matchesSearch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.mime_type.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [mediaItems, searchQuery, selectedCategory])

  const stats = useMemo(() => {
    const bytes = mediaItems.reduce((sum, item) => sum + item.size, 0)
    return {
      total: mediaItems.length,
      storageUsed: formatFileSize(bytes),
      publicCount: mediaItems.filter((item) => item.is_public).length,
      privateCount: mediaItems.filter((item) => !item.is_public).length,
    }
  }, [mediaItems])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !token) {
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', file.name)
      form.append('category', uploadCategory)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Upload failed')
      }

      await fetchMedia()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!token) return
    if (!confirm('Remove this media file permanently?')) return

    try {
      const response = await fetch(`/api/media/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Delete failed')
      }

      await fetchMedia()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete media')
    }
  }

  const handleDownload = (item: MediaItem) => {
    const link = item.url || item.signed_url
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  const handlePreview = (item: MediaItem) => {
    const link = item.url || item.signed_url
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  const categories = useMemo(() => {
    const unique = new Set<MediaCategory>()
    mediaItems.forEach((item) => unique.add(item.category))
    return ['all', ...Array.from(unique)] as Array<'all' | MediaCategory>
  }, [mediaItems])

  return (
    <AppLayout>
      <PageHeader
        title="Media Library"
        subtitle="Manage headshots, reels, self-tapes, resumes, and other professional assets."
        actions={
          <div className="flex items-center gap-3">
            <select
              value={uploadCategory}
              onChange={(event) =>
                setUploadCategory(event.target.value as MediaCategory)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              aria-label="Select upload category"
            >
              {UPLOADABLE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  Upload to {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <Button onClick={handleUploadClick} disabled={isUploading || !token}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Media
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelection}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
          </div>
        }
      />

      <PageContent>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Total Assets</CardTitle>
              <CardDescription>All files in your media library</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.total.toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Storage Used</CardTitle>
              <CardDescription>Across public and private files</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {stats.storageUsed}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Public vs private media</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Public {stats.publicCount}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Private {stats.privateCount}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={fetchMedia} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search media"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as 'all' | MediaCategory)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              aria-label="Filter category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  No media found
                </p>
                <p className="text-sm text-gray-500">
                  Upload your first {CATEGORY_LABELS[uploadCategory]} file to get started.
                </p>
              </div>
              <Button onClick={handleUploadClick}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  <MediaPreview item={item} />
                  <div className="absolute left-2 top-2">
                    <Badge variant={item.is_public ? 'secondary' : 'outline'}>
                      {item.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {CATEGORY_LABELS[item.category]}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(item.size)}</span>
                    <span>{formatDate(item.uploaded_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(item)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(item)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[640px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    File
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredMedia.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100">
                          {getTypeIcon(item.mime_type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.mime_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatFileSize(item.size)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.is_public ? 'secondary' : 'outline'}>
                        {item.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{formatDate(item.uploaded_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}

function mapToMediaItem(file: Record<string, unknown>): MediaItem {
  const metadata = (file.metadata || {}) as Record<string, unknown>
  const categoryRaw =
    (metadata.category as string | undefined) ||
    ((metadata.tags as string[] | undefined)?.[0] ?? 'other')
  const normalizedCategory = (categoryRaw || 'other').toLowerCase()
  const resolvedCategory = isKnownCategory(normalizedCategory)
    ? normalizedCategory
    : 'other'

  return {
    id: String(file.id),
    name: String(file.original_filename || 'Untitled'),
    category: resolvedCategory,
    size: Number(file.file_size || 0),
    mime_type: String(file.mime_type || 'application/octet-stream'),
    uploaded_at: String(file.uploaded_at || new Date().toISOString()),
    url: (file.public_url as string | null) ?? null,
    signed_url: (file.signed_url as string | null) ?? null,
    thumbnail_url:
      (file.thumbnail_url as string | null) ??
      (file.thumbnail_signed_url as string | null) ??
      ((file.public_url as string | null) ?? null),
    is_public: Boolean(file.is_public),
    metadata,
  }
}

function isKnownCategory(value: string): value is MediaCategory {
  return [
    'headshot',
    'reel',
    'self_tape',
    'voice_over',
    'resume',
    'document',
    'other',
  ].includes(value)
}

function MediaPreview({ item }: { item: MediaItem }) {
  const thumbnail = item.thumbnail_url || item.url || item.signed_url

  if (thumbnail && item.mime_type.startsWith('image/')) {
    return (
      <img
        src={thumbnail}
        alt={item.name}
        className="h-48 w-full object-cover"
        loading="lazy"
      />
    )
  }

  return (
    <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-gray-400">
      {getTypeIcon(item.mime_type, 'h-10 w-10')}
    </div>
  )
}

function getTypeIcon(mime: string, className = 'h-4 w-4') {
  if (mime.startsWith('video/')) {
    return <Video className={className} />
  }
  if (mime.startsWith('image/')) {
    return <ImageIcon className={className} />
  }
  if (mime.startsWith('audio/')) {
    return <Music className={className} />
  }
  return <FileText className={className} />
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
