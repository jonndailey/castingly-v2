import { NextResponse } from 'next/server'
import { listFiles as listDmapiFiles } from '@/lib/server/dmapi-service'
import type { DmapiFile } from '@/lib/dmapi'

const RECENT_WINDOW_DAYS = 7
const BYTES_IN_MB = 1024 * 1024

export async function GET() {
  try {
    const response = await listDmapiFiles({
      limit: 500,
      sort: 'uploaded_at',
      order: 'desc',
    })

    const files = (response.files ?? []) as DmapiFile[]
    const total = response.pagination?.total ?? files.length
    const totalSizeBytes = files.reduce(
      (acc, file) => acc + (file.file_size || 0),
      0
    )

    const headshots = countByCategory(files, 'headshot')
    const reels = countByCategory(files, 'reel')
    const resumes = countByCategory(files, 'resume')
    const voiceOver = countByCategory(files, 'voice_over')

    const recentUploads = files.filter((file) => {
      const uploadedAt = new Date(file.uploaded_at)
      if (Number.isNaN(uploadedAt.getTime())) return false
      const diff =
        Date.now() - uploadedAt.getTime()
      const days = diff / (1000 * 60 * 60 * 24)
      return days <= RECENT_WINDOW_DAYS
    }).length

    const stats = {
      totalFiles: total,
      totalSize: formatMegabytes(totalSizeBytes),
      actorMedia: total,
      submissionMedia: 0,
      headshots,
      videos: reels,
      reels,
      resumes,
      voiceOver,
      recentUploads,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch DMAPI media stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media stats' },
      { status: 500 }
    )
  }
}

function countByCategory(files: DmapiFile[], category: string) {
  return files.filter((file) => {
    const metadata = (file.metadata || {}) as Record<string, unknown>
    const metaCategory = normalizeCategory(
      (metadata.category as string) ||
        (Array.isArray(metadata.tags) ? (metadata.tags[0] as string) : '') ||
        inferCategoryFromMime(file.mime_type)
    )
    return metaCategory === category
  }).length
}

function normalizeCategory(value?: string | null): string {
  if (!value) return 'other'
  const normalized = value.toLowerCase()
  switch (normalized) {
    case 'headshot':
    case 'reel':
    case 'resume':
    case 'self_tape':
    case 'voice_over':
    case 'document':
    case 'other':
      return normalized
    case 'self-tape':
      return 'self_tape'
    case 'voiceover':
      return 'voice_over'
    case 'pdf':
      return 'resume'
    default:
      return normalized
  }
}

function inferCategoryFromMime(mime: string): string {
  if (!mime) return 'other'
  if (mime.startsWith('image/')) return 'headshot'
  if (mime.startsWith('video/')) return 'reel'
  if (mime.startsWith('audio/')) return 'voice_over'
  if (
    mime === 'application/pdf' ||
    mime === 'application/msword' ||
    mime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'resume'
  }
  return 'other'
}

function formatMegabytes(bytes: number) {
  if (!bytes || Number.isNaN(bytes)) return '0 MB'
  const megabytes = bytes / BYTES_IN_MB
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
}
