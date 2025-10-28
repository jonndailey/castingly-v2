import { NextRequest, NextResponse } from 'next/server'
import { actors, auth as legacyAuth } from '@/lib/db_existing'
import { resolveWebAvatarUrl } from '@/lib/image-url'
import { validateUserToken, type DmapiFile, listFiles as listUserFiles } from '@/lib/dmapi'
import { listActorFiles as listActorDmapiFiles, listFiles as listDmapiFiles, listBucketFolder } from '@/lib/server/dmapi-service'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'

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
  gallery: SimplifiedMedia[]
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

// Simple in-process micro-cache to smooth bursts
type CacheEntry = { body: any; expires: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 15_000

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeMediaParam = searchParams.get('media') || searchParams.get('includeMedia')
    const includeMedia = includeMediaParam === '1' || includeMediaParam === 'true'
    const { id } = await context.params
    let actor: any = null
    // Try DB first but do not fail hard if DB is unavailable
    try {
      actor = await actors.getById(id)
    } catch (e) {
      try { console.warn('[actors/:id] DB lookup failed, will try token/minimal fallback:', (e as any)?.message || e) } catch {}
    }

    // Secondary attempt: any-role fetch by id (owner/admin views or non-actor roles)
    if (!actor) {
      try {
        actor = await actors.getByIdAnyRole(id)
      } catch {}
    }

    // Fallback: if no actor row (or requester is self with non-actor role), try token + any-role profile
    if (!actor) {
      try {
        const authHeader = request.headers.get('authorization')
        const authInfo = await validateUserToken(authHeader)
        if (authInfo?.email) {
          const legacyUser = await legacyAuth.findByEmail(authInfo.email)
          if (legacyUser?.id) {
            // If self, allow any-role profile (so profile updates appear immediately for non-actor roles)
            const isSelf = String(legacyUser.id) === String(id)
            actor = isSelf ? await actors.getByIdAnyRole(String(legacyUser.id)) : await actors.getById(String(legacyUser.id))
          }
        }
      } catch {
        // ignore and continue to 404 below
      }
    }

    // Last-resort: build a minimal actor from Core token so profile can render
    let profileSource: 'db' | 'fallback' = 'db'
    if (!actor) {
      profileSource = 'fallback'
      try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
        if (token) {
          const validated = await daileyCoreAuth.validateToken(token)
          if (validated?.valid && validated.user) {
            // If requester is self, ensure a minimal DB row exists so we can return from DB path next
            try {
              const isSelf = String(validated.user.id) === String(id)
              if (isSelf) {
                const email = String(validated.user.email || '')
                const name = typeof validated.user.name === 'string' && validated.user.name
                  ? validated.user.name
                  : (email.split('@')[0] || String(id))
                await import('@/lib/db_existing').then(async ({ query }) => {
                  try {
                    await query(
                      'INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, 1, 1) ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name)',
                      [String(id), email || `${id}@castingly.local`, 'core-linked', name, 'actor']
                    )
                  } catch {}
                  try {
                    await query('INSERT INTO profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id', [String(id)])
                  } catch {}
                })
                try {
                  const ensured = await actors.getByIdAnyRole(String(id))
                  if (ensured) {
                    actor = ensured
                    profileSource = 'db'
                  }
                } catch {}
              }
            } catch {}
            if (!actor) {
            const u = validated.user
            actor = {
              id: String(u.id),
              email: String(u.email),
              name: typeof u.name === 'string' && u.name ? u.name : String(u.email).split('@')[0],
              role: 'actor',
              profile_image: u.profile_image || null,
              bio: null,
              skills: null,
              height: null,
              eye_color: null,
              hair_color: null,
              location: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any
            }
          }
        }
      } catch {
        // ignore
      }
      // Dev-only fallback: if DB is down and Core validation unavailable, allow minimal actor by requested id
      if (!actor && process.env.NODE_ENV !== 'production') {
        actor = {
          id: String(id),
          email: `${String(id)}@local.dev`,
          name: `Actor ${String(id).slice(0, 6)}`,
          role: 'actor',
          profile_image: null,
          bio: null,
          skills: null,
          height: null,
          eye_color: null,
          hair_color: null,
          location: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any
      }
    }

    if (!actor) {
      return NextResponse.json(
        { error: 'Actor not found' },
        { status: 404 }
      )
    }

    let legacyMedia: LegacyMediaRecord[] = []
    try {
      legacyMedia = (await actors.getMedia(String((actor as any).id))) as LegacyMediaRecord[]
    } catch (e) {
      try { console.warn('[actors/:id] DB media lookup failed, continuing with DMAPI/empty legacy media:', (e as any)?.message || e) } catch {}
      legacyMedia = []
    }

    const skillsArray = parseSkills(actor.skills)

    const authHeader = request.headers.get('authorization')
    const authResult = await validateUserToken(authHeader)
    const includePrivate = authResult?.userId === actor.id

    // Serve from cache quickly if available and safe
    const cacheKey = `${actor.id}|m=${includeMedia?'1':'0'}|p=${includePrivate?'1':'0'}`
    const nowTs = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > nowTs) {
      const hdrs = new Headers()
      hdrs.set('Cache-Control', includeMedia ? 'private, max-age=20' : (includePrivate ? 'private, no-store' : 'private, max-age=60'))
      hdrs.set('Vary', 'Authorization')
      hdrs.set('X-Profile-Source', 'cache')
      return NextResponse.json(cached.body, { headers: hdrs })
    }

    let dmapiFiles: DmapiFile[] = []
    const seenKeys = new Set<string>()
  let metaCount = 0
  let folderCount = 0
  if (includeMedia) {
    try {
        // Headshots: include both private and public by metadata; keep public folder as fallback
        const listUserId = String(actor.id)
        // Prefer metadata search (includes private with signed_url)
        try {
          const byMeta = await listActorDmapiFiles(actor.id, { limit: 400, metadata: { category: 'headshot' } }) as any
          const files = Array.isArray(byMeta?.files) ? byMeta.files : []
          metaCount += files.length
          for (const f of files) {
            const key = String(f.id || f.original_filename || f.name || '')
            if (key && !seenKeys.has(key)) {
              seenKeys.add(key)
              dmapiFiles.push(f)
            }
          }
        } catch {}
        // Also try public folder listing as a backstop (older uploads)
        if (listUserId) {
          try {
            const folder = await listBucketFolder({
              bucketId: 'castingly-public',
              userId: String(listUserId),
              path: `actors/${actor.id}/headshots`,
            })
            const base = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
          const mapped: DmapiFile[] = ((folder as any).files || []).map((it: any) => {
              const name: string = String(it.name || '')
              const path: string = String(it.path || '')
              const ext = name.toLowerCase().split('.').pop() || ''
              const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'application/octet-stream'
              const tail = path.replace(/^.*?\//, '')
              const publicUrl = base ? `${base}/api/serve/files/${encodeURIComponent(String(listUserId))}/castingly-public/${tail ? tail + '/' : ''}${encodeURIComponent(name)}` : null
              return {
                id: String(it.id || `${actor.id}-${name}-${Math.random().toString(36).slice(2,8)}`),
                original_filename: name,
                file_size: Number(it.size || 0),
                mime_type: mime,
                file_extension: ext,
                uploaded_at: new Date().toISOString(),
                public_url: publicUrl,
                signed_url: null,
                thumbnail_url: publicUrl,
                metadata: {
                  bucketId: 'castingly-public',
                  folderPath: `actors/${actor.id}/headshots`,
                  source: 'castingly',
                }
              } as unknown as DmapiFile
            })
            for (const f of mapped) {
              const key = String((f as any).id || (f as any).original_filename || '')
              if (key && !seenKeys.has(key)) {
                seenKeys.add(key)
                dmapiFiles.push(f)
              }
            }
            folderCount += mapped.length
          } catch {}
        }
        // Fetch non-headshot categories via metadata filter in small batches
        try {
          const categories = ['gallery', 'resume', 'reel', 'self_tape', 'voice_over', 'document']
          for (const cat of categories) {
            try {
              const res = await listActorDmapiFiles(actor.id, { limit: 200, metadata: { category: cat } }) as any
              const files = Array.isArray(res?.files) ? res.files : []
              metaCount += files.length
              for (const f of files) {
                const key = String(f.id || f.original_filename || f.name || '')
                if (key && !seenKeys.has(key)) {
                  seenKeys.add(key)
                  dmapiFiles.push(f)
                }
              }
            } catch {}
          }
        } catch {}

        // Folder fallbacks by category (public and private) to surface legacy imports without metadata
        async function pushFolder(bucketId: string, subpath: string, catHint: string) {
          try {
            const folder = await listBucketFolder({ bucketId, userId: String(listUserId), path: subpath })
            const files = Array.isArray(folder?.files) ? folder.files : []
            for (const it of files as any[]) {
              const name = String((it as any).name || (it as any).original_filename || (it as any).filename || '')
              const f: any = {
                id: String((it as any).id || `${actor.id}-${(name||'unknown')}`),
                original_filename: name,
                file_size: Number((it as any).size || 0),
                mime_type: inferMimeFromPath(String((it as any).public_url || (it as any).signed_url || (it as any).url || '')),
                file_extension: String((name || '').split('.').pop() || ''),
                uploaded_at: new Date().toISOString(),
                public_url: (bucketId === 'castingly-public') ? ((it as any).public_url || (it as any).url || null) : null,
                signed_url: (bucketId === 'castingly-private') ? ((it as any).signed_url || (it as any).url || null) : null,
                thumbnail_url: (it as any).thumbnail_signed_url || (it as any).thumbnail_url || (bucketId === 'castingly-public' ? ((it as any).public_url || null) : null),
                metadata: { bucketId, folderPath: subpath, category: catHint, source: 'castingly' },
              }
              const key = String(f.id || f.original_filename || '')
              if (key && !seenKeys.has(key)) {
                seenKeys.add(key)
                dmapiFiles.push(f)
              }
            }
            folderCount += files.length
          } catch {}
        }

        await pushFolder('castingly-public', `actors/${actor.id}/gallery`, 'gallery')
        await pushFolder('castingly-private', `actors/${actor.id}/gallery`, 'gallery')
        await pushFolder('castingly-public', `actors/${actor.id}/reels`, 'reel')
        await pushFolder('castingly-private', `actors/${actor.id}/reels`, 'reel')
        await pushFolder('castingly-private', `actors/${actor.id}/resumes`, 'resume')
        await pushFolder('castingly-private', `actors/${actor.id}/self-tapes`, 'self_tape')
        await pushFolder('castingly-public', `actors/${actor.id}/voice-over`, 'voice_over')
        await pushFolder('castingly-private', `actors/${actor.id}/documents`, 'document')

        // Public folder fallback for headshots (older imports without metadata)
        try {
          const folder = await listBucketFolder({
            bucketId: 'castingly-public',
            userId: String(listUserId),
            path: `actors/${actor.id}/headshots`,
          })
          const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
          for (const it of files as any[]) {
            const name = String((it as any).name || (it as any).original_filename || (it as any).filename || '')
            const f: any = {
              id: String((it as any).id || `${actor.id}-${(name||'unknown')}`),
              original_filename: name,
              file_size: Number((it as any).size || 0),
              mime_type: inferMimeFromPath(String((it as any).public_url || (it as any).signed_url || (it as any).url || '')),
              file_extension: String((name || '').split('.').pop() || ''),
              uploaded_at: new Date().toISOString(),
              public_url: (it as any).public_url || (it as any).url || null,
              signed_url: null,
              thumbnail_url: (it as any).thumbnail_signed_url || (it as any).thumbnail_url || (it as any).public_url || null,
              metadata: { bucketId: 'castingly-public', folderPath: `actors/${actor.id}/headshots`, category: 'headshot', source: 'castingly' },
            }
            const key = String(f.id || f.original_filename || '')
            if (key && !seenKeys.has(key)) {
              seenKeys.add(key)
              dmapiFiles.push(f)
            }
          }
          folderCount += files.length
        } catch {}

        // Private folder fallback for headshots (older imports without metadata)
        try {
          const folder = await listBucketFolder({
            bucketId: 'castingly-private',
            userId: String(listUserId),
            path: `actors/${actor.id}/headshots`,
          })
          const mapped: DmapiFile[] = ((folder as any).files || []).map((it: any) => ({
            id: String(it.id || `${actor.id}-${String(it.name||'unknown')}`),
            original_filename: String(it.name || ''),
            file_size: Number(it.size || 0),
            mime_type: inferMimeFromPath(String(it.public_url || it.signed_url || it.url || '')),
            file_extension: String(String(it.name || '').split('.').pop() || ''),
            uploaded_at: new Date().toISOString(),
            public_url: null,
            signed_url: (it as any).signed_url || (it as any).url || null,
            thumbnail_url: (it as any).thumbnail_signed_url || (it as any).thumbnail_url || null,
            metadata: {
              bucketId: 'castingly-private',
              folderPath: `actors/${actor.id}/headshots`,
              source: 'castingly',
              category: 'headshot',
            }
          }) as unknown as DmapiFile[])
          for (const f of mapped) {
            const key = String((f as any).id || (f as any).original_filename || '')
            if (key && !seenKeys.has(key)) {
              seenKeys.add(key)
              dmapiFiles.push(f)
            }
          }
          folderCount += mapped.length
        } catch {}
      } catch (error) {
        console.error('Failed to fetch DMAPI media for actor:', error)
      }
    }

    let media: CategorisedMedia
    if (includeMedia && dmapiFiles.length > 0) {
      const categorised = categoriseDmapiFiles(dmapiFiles, String(actor.id))
      media = includePrivate
        ? categorised
        : filterToPublicMedia(categorised)
    } else {
      media = categoriseLegacyMedia(legacyMedia)
    }

    let avatarFromDmapi = media.headshots?.[0]?.url || media.headshots?.[0]?.signed_url
    if (!avatarFromDmapi) {
      try {
        // Lightweight headshot lookup even when includeMedia=false
        const quick = await listActorDmapiFiles(String(actor.id), { limit: 1, category: 'headshot', order: 'desc', sort: 'uploaded_at' })
        const f: any = Array.isArray((quick as any)?.files) && (quick as any).files[0]
        if (f) {
          avatarFromDmapi = f.signed_url || f.public_url || f.url || null
        }
      } catch {}
    }

    const legacyHeadshots = legacyMedia.filter(
      (record) => record.media_type === 'headshot'
    )
    const primaryLegacyHeadshot =
      legacyHeadshots.find((record) => Boolean(record.is_primary)) ||
      legacyHeadshots[0] ||
      null
    let legacyAvatar: string | null =
      primaryLegacyHeadshot?.media_url || actor.profile_image || null

    // If the stored avatar is our proxy without a presigned URL, try to attach one using the caller's token
    try {
      const vr = await validateUserToken(authHeader)
      const needsSign = typeof legacyAvatar === 'string' && legacyAvatar.includes('/api/media/proxy?') && !legacyAvatar.includes('signed=')
      if (vr?.token && needsSign) {
        const u = new URL(legacyAvatar!, 'https://castingly.dailey.dev')
        const name = u.searchParams.get('name') || ''
        const folder = u.searchParams.get('path') || ''
        const listed = await listUserFiles(vr.token, { limit: 500 })
        const files = Array.isArray(listed?.files) ? listed.files : []
        const match = files.find((f: any) => {
          const fname = String(f.original_filename || f.name || f.id || '')
          const fpath = String(f.folder_path || (f.metadata && (f.metadata as any).folderPath) || '')
          return fname === name && (!folder || fpath.includes(folder))
        })
        const signed = (match as any)?.signed_url as string | undefined
        if (signed) {
          u.searchParams.set('signed', signed)
          legacyAvatar = u.pathname + '?' + u.searchParams.toString()
        }
      }
    } catch {}

    // Compute real profile completion
    const hasBio = typeof actor.bio === 'string' && actor.bio.trim().length > 0
    const hasLocation = typeof actor.location === 'string' && actor.location.trim().length > 0
    const hasHeight = typeof actor.height === 'string' && actor.height.trim().length > 0
    const hasEye = typeof actor.eye_color === 'string' && actor.eye_color.trim().length > 0
    const hasHair = typeof actor.hair_color === 'string' && actor.hair_color.trim().length > 0
    const hasSkills = Array.isArray(skillsArray) && skillsArray.length > 0
    const hasHeadshot = Array.isArray(media.headshots) && media.headshots.length > 0
    const galleryImages = (media.other || []).filter((m) => typeof m.mime_type === 'string' && m.mime_type.startsWith('image/'))
    const hasGallery = galleryImages.length > 0
    const checklist = [hasBio, hasLocation, hasHeight, hasEye, hasHair, hasSkills, hasHeadshot, hasGallery]
    const met = checklist.reduce((acc, v) => acc + (v ? 1 : 0), 0)
    const profileCompletion = Math.max(0, Math.min(100, Math.round((met / checklist.length) * 100)))

    // Read preferences from profile metadata if available
    let preferences: any = {}
    try {
      const metaRaw = (actor as any).profile_metadata
      if (metaRaw) {
        const metaObj = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw
        if (metaObj && typeof metaObj === 'object') {
          preferences.hideProfileCompletion = Boolean(metaObj?.preferences?.hideProfileCompletion)
        }
      }
    } catch {}

    // Build response
    const responseBody = {
      id: actor.id,
      email: actor.email,
      name: actor.name,
      role: actor.role,
      // Prefer DMAPI-derived direct URL (signed/public) to avoid proxy redirects
      avatar_url: avatarFromDmapi || legacyAvatar,
      bio: actor.bio,
      skills: skillsArray,
      phone: (actor as any).phone || null,
      website: (actor as any).website || null,
      instagram: (actor as any).instagram || null,
      twitter: (actor as any).twitter || null,
      age_range: (actor as any).age_range || null,
      height: actor.height,
      eye_color: actor.eye_color,
      hair_color: actor.hair_color,
      profile_image: resolveWebAvatarUrl(legacyAvatar, actor.name),
      resume_url: actor.resume_url,
      location: actor.location || 'Los Angeles',
      media,
      profile_completion: profileCompletion,
      preferences,
      created_at: actor.created_at,
      updated_at: actor.updated_at,
    }

    // Cache small window for speed unless includePrivate requested
    if (!includePrivate) {
      const now = Date.now()
      cache.set(cacheKey, { body: responseBody, expires: now + CACHE_TTL_MS })
    }
    {
      const hdrs = new Headers()
      // For owner/self views, avoid any caching to ensure immediate reflection after edits/uploads
      if (includePrivate) {
        hdrs.set('Cache-Control', 'private, no-store')
      } else if (includeMedia) {
        hdrs.set('Cache-Control', 'private, max-age=20')
      } else {
        hdrs.set('Cache-Control', 'private, max-age=60')
      }
      hdrs.set('Vary', 'Authorization')
      hdrs.set('X-Profile-Source', profileSource)
      if (includeMedia) {
        try { console.info('[actors/:id] media counters', { actorId: actor.id, metaCount, folderCount, includePrivate }) } catch {}
        hdrs.set('X-Media-Meta-Count', String(metaCount))
        hdrs.set('X-Media-Folder-Count', String(folderCount))
      }
      return NextResponse.json(responseBody, { headers: hdrs })
    }
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

  // Match by folder path if present: actors/{id}/...
  const folder = String((metadata as any).folderPath || (metadata as any).folder_path || '').toLowerCase()
  const matchesFolder = folder.includes(`/actors/${String(actor.id).toLowerCase()}/`) || folder.endsWith(`/actors/${String(actor.id).toLowerCase()}`) || folder.includes(`actors/${String(actor.id).toLowerCase()}/`)

  return matchesLegacyId || matchesEmail || matchesFolder || !metadata.sourceActorId
}

function categoriseDmapiFiles(files: DmapiFile[], actorId?: string): CategorisedMedia {
  const initial: CategorisedMedia = {
    headshots: [],
    gallery: [],
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
    const metaCat = normalizeCategory((metadata.category as string) || null)
    const tagCat = normalizeCategory(
      Array.isArray(metadata.tags) && metadata.tags.length > 0
        ? (metadata.tags[0] as string)
        : null
    )
    const folderCat = inferCategoryFromFolder(metadata)
    const mimeCat = inferCategoryFromMime(file.mime_type)
    // Prefer folder/tag/mime over generic categories like 'other' or raw 'image'
    const category =
      (folderCat && normalizeCategory(folderCat)) ||
      (tagCat && tagCat !== 'other' ? tagCat : null) ||
      ((metaCat && metaCat !== 'other' && metaCat !== 'image') ? metaCat : null) ||
      mimeCat

    // Prefer our proxy URL so we can robustly resolve and redirect
    const bucketId = String((metadata.bucketId || (metadata as any).bucket_id || '') || '').trim()
    const folderPath = String((metadata.folderPath || (metadata as any).folder_path || '') || '').trim()
    const originalName = String(file.original_filename || '').trim()
    const storageKey: string | undefined = (file as any)?.storage_key
    const storageName = typeof storageKey === 'string' && storageKey.includes('/')
      ? storageKey.split('/').pop() || ''
      : ''
    // Prefer storage object name for robust proxying; fall back to original filename
    const proxyName = (storageName || originalName || '').trim()
    const proxyUrl = bucketId && actorId && proxyName
      ? `/api/media/proxy?bucket=${encodeURIComponent(bucketId)}&userId=${encodeURIComponent(String(actorId))}` +
        (folderPath ? `&path=${encodeURIComponent(folderPath)}` : '') +
        `&name=${encodeURIComponent(proxyName)}`
      : null

    // Detect mismatched direct URLs (signed/public) that point to original filename when
    // the stored object name differs (common in migrated data). If detected, prefer proxy.
    const directUrlCandidate: string | null = (file as any)?.signed_url || (file as any)?.public_url || null
    const lastSegment = (u?: string | null) => {
      if (!u || typeof u !== 'string') return ''
      try {
        const q = u.split('?')[0]
        return q.substring(q.lastIndexOf('/') + 1)
      } catch { return '' }
    }
    const directName = lastSegment(directUrlCandidate).toLowerCase()
    const storageLower = (storageName || '').toLowerCase()
    const originalLower = (originalName || '').toLowerCase()
    const directLooksLikeOriginalButNotStorage = Boolean(
      directUrlCandidate && originalLower && directName === originalLower && storageLower && directName !== storageLower
    )

    // Prefer stable edge-cached URL for public items in castingly-public via DMAPI /api/serve
    let preferredUrl: string | null = null
    const isPublic = resolveVisibility(file, metadata) === 'public'
    if (isPublic && bucketId && bucketId.toLowerCase() === 'castingly-public' && actorId) {
      try {
        const base = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
        if (base) {
          const tail = folderPath ? `${folderPath.replace(/^\/+|\/+$/g, '')}/` : ''
          const objName = encodeURIComponent(proxyName || originalName)
          preferredUrl = `${base}/api/serve/files/${encodeURIComponent(String(actorId))}/castingly-public/${tail}${objName}`
        }
      } catch {}
    }

    const simplified: SimplifiedMedia = {
      id: file.id,
      // Prefer serve URL for public files; else direct; else proxy on mismatch
      url: preferredUrl || (directLooksLikeOriginalButNotStorage ? (proxyUrl || null) : (directUrlCandidate || proxyUrl || null)),
      signed_url: directLooksLikeOriginalButNotStorage ? null : ((file as any)?.signed_url || null),
      thumbnail_url:
        (file as any)?.thumbnail_signed_url ||
        (file as any)?.thumbnail_url ||
        preferredUrl ||
        (directLooksLikeOriginalButNotStorage ? null : (file as any)?.public_url) ||
        proxyUrl ||
        null,
      name: file.original_filename,
      size: file.file_size,
      mime_type: file.mime_type,
      category,
      uploaded_at: file.uploaded_at,
      metadata,
      visibility: isPublic ? 'public' : 'private',
    }

    initial.all.push(simplified)

    switch (category) {
      case 'headshot':
        initial.headshots.push(simplified)
        break
      case 'gallery':
        initial.gallery.push(simplified)
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
    gallery: [],
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
      case 'gallery':
        initial.gallery.push(simplified)
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
  const gallery = filterList(media.gallery)
  const reels = filterList(media.reels)
  const voiceOver = filterList(media.voice_over)
  const otherPublic = filterList(media.other)

  return {
    headshots,
    gallery,
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

  if (access === 'public') return 'public'

  // Treat files in the public bucket as public (DMAPI may default access flags)
  const bucketId = String((metadata as any).bucketId || (metadata as any).bucket_id || '').toLowerCase()
  if (bucketId === 'castingly-public') return 'public'

  return 'private'
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
    case 'gallery':
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

function inferCategoryFromFolder(metadata: Record<string, unknown>): string | undefined {
  const folder = String(
    (metadata as any).folderPath || (metadata as any).folder_path || ''
  ).toLowerCase()
  if (!folder) return undefined
  if (folder.includes('gallery')) return 'gallery'
  if (folder.includes('headshot')) return 'headshot'
  if (folder.includes('reel')) return 'reel'
  if (folder.includes('voice')) return 'voice_over'
  if (folder.includes('resume')) return 'resume'
  if (folder.includes('self-tape') || folder.includes('self_tape')) return 'self_tape'
  if (folder.includes('document')) return 'document'
  return undefined
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
