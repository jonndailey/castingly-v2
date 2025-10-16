import { NextRequest, NextResponse } from 'next/server'
import { actors } from '@/lib/db_existing'
import {
  listFiles,
  validateUserToken,
  type DmapiFile,
} from '@/lib/dmapi'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const actor = await actors.getById(id)

    if (!actor) {
      return NextResponse.json(
        { error: 'Actor not found' },
        { status: 404 }
      )
    }

    // Base media from legacy database (fallback)
    const media = (await actors.getMedia(id)) as any[]

    // Process skills - they're stored as comma-separated strings in existing DB
    let skillsArray = []
    if (actor.skills && typeof actor.skills === 'string') {
      skillsArray = actor.skills
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }

    // Organize legacy media by type (fallback)
    const headshots = media.filter((m) => m.media_type === 'headshot')
    const resumes = media.filter((m) => m.media_type === 'resume')
    const reels = media.filter((m) => m.media_type === 'reel')

    // Prepare DMAPI media if token provided and matches actor
    const authResult = await validateUserToken(
      request.headers.get('authorization')
    )

    let dmapiMedia: CategorisedMedia | null = null

    if (authResult && authResult.userId === actor.id) {
      try {
        const dmapiResponse = await listFiles(authResult.token, {
          limit: 200,
          offset: 0,
        })

        dmapiMedia = categoriseDmapiFiles(dmapiResponse.files ?? [])
      } catch (error) {
        console.error('Failed to fetch DMAPI media for actor:', error)
      }
    }

    // Select avatar priority: DMAPI headshot -> legacy headshot -> profile image
    const avatarFromDmapi =
      dmapiMedia?.headshots?.[0]?.url || dmapiMedia?.headshots?.[0]?.signed_url
    const primaryHeadshot =
      headshots.find((h) => h.is_primary) || headshots[0] || null
    const legacyAvatar = primaryHeadshot?.media_url || actor.profile_image || null
    const avatar_url = avatarFromDmapi || legacyAvatar

    return NextResponse.json({
      id: actor.id,
      email: actor.email,
      name: actor.name,
      role: actor.role,
      avatar_url,
      bio: actor.bio,
      skills: skillsArray,
      height: actor.height,
      eye_color: actor.eye_color,
      hair_color: actor.hair_color,
      profile_image: actor.profile_image,
      resume_url: actor.resume_url,
      location: actor.location || 'Los Angeles', // Default location
      media: dmapiMedia ?? {
        headshots,
        resumes,
        reels,
        all: media,
      },
      // Additional computed fields
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

  const add = (category: keyof CategorisedMedia, media: SimplifiedMedia) => {
    if (category === 'all') return
    initial[category].push(media)
  }

  for (const file of files) {
    const metadata = (file.metadata || {}) as Record<string, unknown>
    const category = String(
      metadata.category ||
        metadata.tags?.[0] ||
        inferCategoryFromMime(file.mime_type)
    ).toLowerCase()

    const simplified: SimplifiedMedia = {
      id: file.id,
      url: file.public_url || null,
      signed_url: file.signed_url || null,
      thumbnail_url:
        file.thumbnail_url || file.thumbnail_signed_url || file.public_url || null,
      name: file.original_filename,
      size: file.file_size,
      mime_type: file.mime_type,
      category,
      uploaded_at: file.uploaded_at,
      metadata,
    }

    initial.all.push(simplified)

    switch (category) {
      case 'headshot':
        add('headshots', simplified)
        break
      case 'resume':
        add('resumes', simplified)
        break
      case 'reel':
        add('reels', simplified)
        break
      case 'self_tape':
        add('self_tapes', simplified)
        break
      case 'voice_over':
        add('voice_over', simplified)
        break
      case 'document':
        add('documents', simplified)
        break
      default:
        add('other', simplified)
        break
    }
  }

  return initial
}

function inferCategoryFromMime(mime: string): string {
  if (!mime) return 'other'
  if (mime.startsWith('image/')) return 'headshot'
  if (mime.startsWith('video/')) return 'reel'
  if (mime.startsWith('audio/')) return 'voice_over'
  if (mime === 'application/pdf') return 'document'
  return 'other'
}
