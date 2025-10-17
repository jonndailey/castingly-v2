import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { listFiles as listDmapiFiles } from '@/lib/server/dmapi-service'
import type { DmapiFile } from '@/lib/dmapi'

interface AdminMediaFile {
  id: string
  type: 'dmapi' | 'actor_media' | 'submission_media' | 'legacy'
  media_type: string
  media_url: string | null
  signed_url: string | null
  thumbnail_url: string | null
  caption?: string
  is_primary?: boolean
  owner_name: string
  owner_email: string | null
  owner_id: string | null
  created_at: string
  file_size: string
  file_type: string
  visibility: 'public' | 'private'
  metadata: Record<string, unknown>
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    )
    const offset = (page - 1) * limit
    const search = (searchParams.get('search') || '').trim()
    const mediaTypeRaw = (searchParams.get('media_type') || '').trim()
    const mediaType = mediaTypeRaw.toLowerCase()
    const typeFilter = (searchParams.get('type') || '').trim().toLowerCase()

    // Submission media is no longer stored locally once migrated to DMAPI.
    if (typeFilter === 'submission_media') {
      return NextResponse.json(
        await fetchLegacyMedia({
          page,
          limit,
          offset,
          search,
          mediaType: mediaTypeRaw,
          type: typeFilter,
        })
      )
    }

    try {
      const dmapiResult = await fetchDmapiMedia({
        limit,
        offset,
        page,
        search,
        mediaType,
      })

      if (dmapiResult) {
        return NextResponse.json(dmapiResult)
      }
    } catch (error) {
      console.warn('DMAPI media fetch failed, falling back to legacy media:', error)
    }

    return NextResponse.json(
      await fetchLegacyMedia({
        page,
        limit,
        offset,
        search,
        mediaType: mediaTypeRaw,
        type: typeFilter,
      })
    )
  } catch (error) {
    console.error('Failed to fetch DMAPI media files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DMAPI media files' },
      { status: 500 }
    )
  }
}

function mapDmapiFileToAdmin(file: DmapiFile): AdminMediaFile {
  const metadata = (file.metadata || {}) as Record<string, unknown>
  const actorMetadata = metadata.actor as Record<string, unknown> | undefined

  const ownerFirstName = (actorMetadata?.firstName as string) || ''
  const ownerLastName = (actorMetadata?.lastName as string) || ''
  const ownerEmail = (actorMetadata?.email as string) || null
  const ownerName = [ownerFirstName, ownerLastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ')
  const fallbackOwnerName =
    ownerName ||
    (ownerEmail ? ownerEmail.split('@')[0] : file.original_filename) ||
    'Unknown'

  const category = normalizeCategory(
    (metadata.category as string) ||
      (Array.isArray(metadata.tags) ? (metadata.tags[0] as string) : '') ||
      inferCategoryFromMime(file.mime_type)
  )

  return {
    id: file.id,
    type: 'dmapi',
    media_type: category,
    media_url: file.public_url || null,
    signed_url: file.signed_url || null,
    thumbnail_url:
      file.thumbnail_url ||
      file.thumbnail_signed_url ||
      file.public_url ||
      file.signed_url ||
      null,
    caption:
      (metadata.title as string) ||
      (metadata.description as string) ||
      file.original_filename,
    is_primary: Boolean(metadata.isPrimary),
    owner_name: fallbackOwnerName,
    owner_email: ownerEmail,
    owner_id:
      (metadata.sourceActorId as string | number | undefined)?.toString() ||
      (actorMetadata?.daileyCoreUserId as string | undefined) ||
      null,
    created_at: file.uploaded_at,
    file_size: formatBytes(file.file_size),
    file_type: file.mime_type,
    visibility: file.is_public ? 'public' : 'private',
    metadata,
  }
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = -1
  do {
    value /= 1024
    unitIndex += 1
  } while (value >= 1024 && unitIndex < units.length - 1)
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
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

interface DmapiQueryParams {
  limit: number
  offset: number
  page: number
  search: string
  mediaType: string
}

async function fetchDmapiMedia(params: DmapiQueryParams) {
  const dmapiResponse = await listDmapiFiles({
    limit: params.limit,
    offset: params.offset,
    sort: 'uploaded_at',
    order: 'desc',
    metadata: {
      ...(params.mediaType ? { category: params.mediaType } : {}),
      source: 'castingly-v2-migration',
    },
    search: params.search || undefined,
  })

  const files = (dmapiResponse.files ?? []) as DmapiFile[]
  const filtered =
    params.mediaType.length > 0
      ? files.filter((file) => {
          const metadata = (file.metadata || {}) as Record<string, unknown>
          const category = normalizeCategory(
            (metadata.category as string) ||
              (Array.isArray(metadata.tags) ? (metadata.tags[0] as string) : '') ||
              inferCategoryFromMime(file.mime_type)
          )
          return category === params.mediaType
        })
      : files

  const mapped = filtered.map(mapDmapiFileToAdmin)

  if (mapped.length === 0) {
    return null
  }

  const pagination = dmapiResponse.pagination
  const total =
    pagination?.total ??
    (pagination?.has_more
      ? params.offset + mapped.length + 1
      : params.offset + mapped.length)
  const totalPages =
    pagination?.limit && pagination?.total
      ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
      : Math.max(1, Math.ceil(total / params.limit))
  const hasMore =
    pagination?.has_more ??
    (mapped.length === params.limit || params.offset + mapped.length < total)

  return {
    files: mapped,
    currentPage: params.page,
    totalPages,
    total,
    hasMore,
  }
}

interface LegacyQueryParams {
  limit: number
  offset: number
  page: number
  search: string
  mediaType: string
  type: string
}

async function fetchLegacyMedia(params: LegacyQueryParams) {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const actorParams: Array<string | number> = []
    const submissionParams: Array<string | number> = []

    let actorMediaQuery = `
      SELECT 
        am.id,
        'actor_media' as type,
        am.media_type,
        am.media_url,
        am.caption,
        am.is_primary,
        CONCAT(u.first_name, ' ', u.last_name) as owner_name,
        u.email as owner_email,
        u.id as owner_id,
        am.created_at
      FROM actor_media am
      JOIN actors a ON am.actor_id = a.user_id
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `

    let submissionMediaQuery = `
      SELECT 
        sm.id,
        'submission_media' as type,
        sm.media_type,
        sm.media_url,
        NULL as caption,
        0 as is_primary,
        CONCAT(u.first_name, ' ', u.last_name) as owner_name,
        u.email as owner_email,
        u.id as owner_id,
        sm.created_at
      FROM submission_media sm
      JOIN submissions s ON sm.submission_id = s.id
      JOIN users u ON s.actor_id = u.id
      WHERE 1=1
    `

    if (params.search) {
      actorMediaQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.email LIKE ? OR am.caption LIKE ?)`
      submissionMediaQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.email LIKE ?)`
      actorParams.push(
        `%${params.search}%`,
        `%${params.search}%`,
        `%${params.search}%`
      )
      submissionParams.push(
        `%${params.search}%`,
        `%${params.search}%`
      )
    }

    if (params.mediaType) {
      actorMediaQuery += ` AND am.media_type = ?`
      submissionMediaQuery += ` AND sm.media_type = ?`
      actorParams.push(params.mediaType)
      submissionParams.push(params.mediaType)
    }

    let baseQuery: string
    let queryParams: Array<string | number>
    if (params.type === 'actor_media') {
      baseQuery = actorMediaQuery
      queryParams = actorParams
    } else if (params.type === 'submission_media') {
      baseQuery = submissionMediaQuery
      queryParams = submissionParams
    } else {
      baseQuery = `(${actorMediaQuery}) UNION ALL (${submissionMediaQuery})`
      queryParams = [...actorParams, ...submissionParams]
    }

    const finalQuery = `${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`

    const [rows] = await connection.execute(finalQuery, [
      ...queryParams,
      params.limit,
      params.offset,
    ])

    const files = (rows as any[]).map(mapLegacyRowToAdmin)

    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as media_count`
    const [countRows] = await connection.execute(countQuery, queryParams)
    const total = Number((countRows as any)[0]?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / params.limit))

    return {
      files,
      currentPage: params.page,
      totalPages,
      total,
      hasMore: params.page < totalPages,
    }
  } finally {
    await connection.end()
  }
}

function mapLegacyRowToAdmin(row: any): AdminMediaFile {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString()

  return {
    id: String(row.id),
    type: row.type as AdminMediaFile['type'],
    media_type: String(row.media_type || 'other'),
    media_url: row.media_url || null,
    signed_url: null,
    thumbnail_url: null,
    caption: row.caption || undefined,
    is_primary: Boolean(row.is_primary),
    owner_name: row.owner_name || 'Unknown',
    owner_email: row.owner_email || null,
    owner_id: row.owner_id ? String(row.owner_id) : null,
    created_at: createdAt,
    file_size: '—',
    file_type: inferFileTypeFromUrl(row.media_url),
    visibility: inferLegacyVisibility(row.media_type),
    metadata: {
      source: 'legacy-database',
      legacyType: row.type,
      legacyMediaId: row.id,
    },
  }
}

function inferFileTypeFromUrl(url?: string | null): string {
  if (!url) return 'unknown'
  const extension = url.split('.').pop()?.toLowerCase()
  return extension ? extension : 'unknown'
}

function inferLegacyVisibility(mediaType?: string | null): 'public' | 'private' {
  if (!mediaType) return 'private'
  const normalized = mediaType.toLowerCase()
  if (normalized === 'headshot' || normalized === 'gallery' || normalized === 'reel') {
    return 'public'
  }
  return 'private'
}
