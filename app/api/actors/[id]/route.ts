import { NextRequest, NextResponse } from 'next/server'
import { actors } from '@/lib/db_existing'
import { validateUserToken, type DmapiFile } from '@/lib/dmapi'
import { listActorFiles as listActorDmapiFiles } from '@/lib/server/dmapi-service'

type LegacyMediaRecord = {
  id?: number | string
  media_type?: string
  media_url?: string | null
  is_primary?: number | boolean
  caption?: string | null
  created_at?: string | Date | null
  file_size?: number | null
  [key: string]: unknown
}

type CategorisedMedia = {
  headshots: SimplifiedMedia[]
  resumes: SimplifiedMedia[]
  reels: SimplifiedMedia[]
  self_tapes: SimplifiedMedia[]
  voice_over: SimplifiedMedia[]
  documents: SimplifiedMedia[]
  other: SimplifiedMedia[]
  all: SimplifiedMedia[]
}

type SimplifiedMedia = {
  id: string
  url: string | null
  signed_url: string | null
  thumbnail_url: string | null
  name: string
  size: number
  mime_type: string
  category: string
  uploaded_at: string
  metadata: Record<string, unknown>
  visibility: 'public' | 'private'
}

const PUBLIC_MEDIA_CATEGORIES = new Set(['headshot', 'reel', 'voice_over'])

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const actor = await actors.getById(id)

    if (!actor) {
      return NextResponse.json(
        { error: 'Actor not found' },
        { status: 404 }
      )
    }

    const legacyMedia = (await actors.getMedia(id)) as LegacyMediaRecord[]

    const skillsArray = parseSkills(actor.skills)

    const authResult = await validateUserToken(
      request.headers.get('authorization')
    )
    const includePrivate = authResult?.userId === actor.id

    let dmapiFiles: DmapiFile[] = []
    try {
      const dmapiResponse = await listActorDmapiFiles(actor.id, {
        limit: 500,
        sort: 'uploaded_at',
        order: 'desc',
      })
      dmapiFiles = (dmapiResponse.files ?? []).filter((file) =>
        matchesActor(file, actor)
      )
    } catch (error) {
      console.error('Failed to fetch DMAPI media for actor:', error)
    }

    let media: CategorisedMedia
    if (dmapiFiles.length > 0) {
      const categorised = categoriseDmapiFiles(dmapiFiles)
      media = includePrivate
        ? categorised
        : filterToPublicMedia(categorised)
    } else {
      media = categoriseLegacyMedia(legacyMedia)
    }

    const avatarFromDmapi =
      media.headshots?.[0]?.url || media.headshots?.[0]?.signed_url

    const legacyHeadshots = legacyMedia.filter(
      (record) => record.media_type === 'headshot'
    )
    const primaryLegacyHeadshot =
      legacyHeadshots.find((record) => Boolean(record.is_primary)) ||
      legacyHeadshots[0] ||
      null
    const legacyAvatar =
      primaryLegacyHeadshot?.media_url || actor.profile_image || null

    return NextResponse.json({
      id: actor.id,
      email: actor.email,
      name: actor.name,
      role: actor.role,
      avatar_url: avatarFromDmapi || legacyAvatar,
      bio: actor.bio,
      skills: skillsArray,
      height: actor.height,
      eye_color: actor.eye_color,
      hair_color: actor.hair_color,
      profile_image: actor.profile_image,
      resume_url: actor.resume_url,
      location: actor.location || 'Los Angeles',
      media,
      profile_completion: actor.bio ? 75 : 25,
      created_at: actor.created_at,
      updated_at: actor.updated_at,
    })
  } catch (error) {
    console.error('Error fetching actor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch actor details' },
      { status: 500 }
    )
  }
}

function parseSkills(skills?: string | null): string[] {
  if (!skills || typeof skills !== 'string') return []
  return skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
}

function matchesActor(file: DmapiFile, actor: any) {
  const metadata = (file.metadata || {}) as Record<string, unknown>
  const actorMetadata = metadata.actor as Record<string, unknown> | undefined

  const matchesLegacyId =
    metadata.sourceActorId &&
    String(metadata.sourceActorId) === String(actor.id)

  const matchesEmail =
    actorMetadata?.email &&
    actor?.email &&
    String(actorMetadata.email).toLowerCase() ===
      String(actor.email).toLowerCase()

  return matchesLegacyId || matchesEmail || !metadata.sourceActorId
}

function categoriseDmapiFiles(files: DmapiFile[]): CategorisedMedia {
  const initial: CategorisedMedia = {
    headshots: [],
    resumes: [],
    reels: [],
    self_tapes: [],
    voice_over: [],
    documents: [],
    other: [],
    all: [],
  }

  for (const file of files) {
    const metadata = (file.metadata || {}) as Record<string, unknown>
    const category = normalizeCategory(
      (metadata.category as string) ||
        (Array.isArray(metadata.tags) ? (metadata.tags[0] as string) : '') ||
        inferCategoryFromMime(file.mime_type)
    )

    const simplified: SimplifiedMedia = {
      id: file.id,
      url: file.public_url || null,
      signed_url: file.signed_url || null,
      thumbnail_url:
        file.thumbnail_url ||
        file.thumbnail_signed_url ||
        file.public_url ||
        null,
      name: file.original_filename,
      size: file.file_size,
      mime_type: file.mime_type,
      category,
      uploaded_at: file.uploaded_at,
      metadata,
      visibility: resolveVisibility(file, metadata),
    }

    initial.all.push(simplified)

    switch (category) {
      case 'headshot':
        initial.headshots.push(simplified)
        break
      case 'resume':
        initial.resumes.push(simplified)
        break
      case 'reel':
        initial.reels.push(simplified)
        break
      case 'self_tape':
        initial.self_tapes.push(simplified)
        break
      case 'voice_over':
        initial.voice_over.push(simplified)
        break
      case 'document':
        initial.documents.push(simplified)
        break
      default:
        initial.other.push(simplified)
        break
    }
  }

  return initial
}

function categoriseLegacyMedia(records: LegacyMediaRecord[]): CategorisedMedia {
  const initial: CategorisedMedia = {
    headshots: [],
    resumes: [],
    reels: [],
    self_tapes: [],
    voice_over: [],
    documents: [],
    other: [],
    all: [],
  }

  for (const record of records) {
    const simplified = mapLegacyRecord(record)
    initial.all.push(simplified)

    switch (simplified.category) {
      case 'headshot':
        initial.headshots.push(simplified)
        break
      case 'resume':
        initial.resumes.push(simplified)
        break
      case 'reel':
        initial.reels.push(simplified)
        break
      case 'self_tape':
        initial.self_tapes.push(simplified)
        break
      case 'voice_over':
        initial.voice_over.push(simplified)
        break
      case 'document':
        initial.documents.push(simplified)
        break
      default:
        initial.other.push(simplified)
        break
    }
  }

  return initial
}

function mapLegacyRecord(record: LegacyMediaRecord): SimplifiedMedia {
  const url = typeof record.media_url === 'string' ? record.media_url : null
  const category = normalizeCategory(record.media_type)
  const filename = extractFilename(url)
  const isPrimary = Boolean(record.is_primary)

  return {
    id: `legacy-${record.id ?? filename}`,
    url,
    signed_url: url,
    thumbnail_url: url,
    name: record.caption || filename || 'Legacy Media',
    size: Number(record.file_size ?? 0),
    mime_type: inferMimeFromPath(url),
    category,
    uploaded_at: normalizeDate(record.created_at),
    metadata: {
      legacy: true,
      source: 'castingly-legacy',
      actorMediaId: record.id ?? null,
      media_type: record.media_type,
      is_primary: isPrimary,
    },
    visibility: determineLegacyVisibility(category),
  }
}

function filterToPublicMedia(media: CategorisedMedia): CategorisedMedia {
  const filterList = (items: SimplifiedMedia[]) =>
    items.filter(
      (item) =>
        item.visibility === 'public' &&
        PUBLIC_MEDIA_CATEGORIES.has(item.category)
    )

  const headshots = filterList(media.headshots)
  const reels = filterList(media.reels)
  const voiceOver = filterList(media.voice_over)
  const otherPublic = filterList(media.other)

  return {
    headshots,
    reels,
    voice_over: voiceOver,
    self_tapes: [],
    resumes: [],
    documents: [],
    other: otherPublic,
    all: filterList(media.all),
  }
}

function resolveVisibility(
  file: DmapiFile,
  metadata: Record<string, unknown>
): 'public' | 'private' {
  if (file.is_public) return 'public'

  const access = String(
    metadata.access ||
      metadata.bucketAccess ||
      metadata.visibility ||
      metadata.privacy ||
      ''
  ).toLowerCase()

  return access === 'public' ? 'public' : 'private'
}

function determineLegacyVisibility(category: string): 'public' | 'private' {
  if (PUBLIC_MEDIA_CATEGORIES.has(category)) {
    return 'public'
  }
  return 'private'
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

function inferMimeFromPath(url: string | null): string {
  if (!url) return 'application/octet-stream'

  const extMatch = url.toLowerCase().match(/\.([a-z0-9]+)(\?|$)/)
  const ext = extMatch ? extMatch[1] : ''

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'mp4':
      return 'video/mp4'
    case 'mov':
      return 'video/quicktime'
    case 'm4v':
      return 'video/x-m4v'
    case 'mpg':
    case 'mpeg':
      return 'video/mpeg'
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default:
      return 'application/octet-stream'
  }
}

function extractFilename(url: string | null): string {
  if (!url) return ''
  try {
    const parsed = new URL(url, 'https://example.com')
    const segments = parsed.pathname.split('/')
    return segments.pop() || ''
  } catch {
    const parts = url.split('/')
    return parts.pop() || ''
  }
}

function normalizeDate(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString()
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}
