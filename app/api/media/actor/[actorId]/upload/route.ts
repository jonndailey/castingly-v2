import { NextRequest, NextResponse } from 'next/server'
import { uploadFileForActor, listActorFiles, getFile as getDmapiFile, listFiles as listDmapiFilesServer, listBucketFolder } from '@/lib/server/dmapi-service'
import { query } from '@/lib/db_existing'
import { uploadFileToDmapi, resolveStorageLocation, listFiles as listUserFiles } from '@/lib/dmapi'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'
import { type MediaCategory } from '@/lib/dmapi'
import { actors as legacyActors } from '@/lib/db_existing'
import { maxBytesFor, maxCountFor, simplifyFileResponse } from '@/lib/server/upload-policy'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function toCategory(value?: string | null): MediaCategory {
  switch ((value || '').toLowerCase()) {
    case 'headshot':
    case 'gallery':
    case 'reel':
    case 'resume':
    case 'self_tape':
    case 'voice_over':
    case 'document':
      return value as MediaCategory
    default:
      return 'other'
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ actorId: string }> }
) {
  try {
    const { actorId } = await context.params
    if (!actorId) {
      return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })
    }

    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = auth.slice('Bearer '.length)
    let allowed = false
    let isSelf = false
    try {
      const validation = await daileyCoreAuth.validateToken(token)
      if (validation?.valid) {
        const roles = (validation.roles || []).map((r) => r.toLowerCase())
        isSelf = !!(validation.user?.id && String(validation.user.id) === String(actorId))
        allowed = isSelf || roles.includes('admin') || roles.includes('agent') || roles.includes('casting_director')
      }
    } catch {}

    if (!allowed) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any
        const role = String(payload?.role || '').toLowerCase()
        const requesterId = String(payload?.id || '')
        const isSelf = requesterId === String(actorId)
        allowed = isSelf || ['admin', 'agent', 'casting_director'].includes(role)
      } catch {}
    }

    if (!allowed && process.env.NODE_ENV !== 'production' && (token.startsWith('demo-token') || token.startsWith('dev-impersonation-'))) {
      allowed = true
    }

    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const form = await request.formData()
    const file = form.get('file')
    // Avoid referencing global File if not defined in this runtime
    if (!file || (typeof File !== 'undefined' && !(file instanceof File))) {
      return NextResponse.json({ error: 'File missing' }, { status: 400 })
    }
    const category = toCategory(form.get('category')?.toString())

    // Enforce size limit
    const bytes = (file as any)?.size ?? 0
    const maxBytes = maxBytesFor(category)
    if (bytes > maxBytes) {
      return NextResponse.json(
        { error: 'File too large', message: `Max size for ${category} is ${Math.round(maxBytes / (1024 * 1024))}MB` },
        { status: 413 }
      )
    }

    // Enrich metadata with actor reference
    let actorEmail: string | undefined
    try {
      const actor = await legacyActors.getById(actorId)
      actorEmail = actor?.email
    } catch {}

    const metadata = {
      actor: {
        id: String(actorId),
        email: actorEmail,
      },
    }

    const filename = (form.get('title')?.toString() || (file as any).name) as string

    // Enforce count limit per category (can be disabled via DISABLE_IMAGE_LIMITS)
    const disableImageLimits = String(process.env.DISABLE_IMAGE_LIMITS || '').toLowerCase() === 'true'
    if (!disableImageLimits || (category !== 'headshot' && category !== 'gallery')) {
      try {
        const allowed = maxCountFor(category)
        let files: any[] = []
        if (isSelf) {
          const list = await listUserFiles(token, { limit: 1000, metadata: { category } })
          files = Array.isArray(list?.files) ? list.files : []
        } else {
          const list = await listActorFiles(actorId, { limit: 1000, metadata: { category } }) as any
          files = Array.isArray(list?.files) ? list.files : []
        }
        const candidateFiles = files.filter((f: any) => {
          const metaCat = String(f?.metadata?.category || '').toLowerCase()
          const folder = (f?.metadata?.folderPath || f?.folder_path || f?.path || '').toString().toLowerCase()
          const byMeta = metaCat === String(category)
          let byPath = false
          switch (category) {
            case 'headshot': byPath = /\/headshots\/?$/i.test(folder) || folder.includes('/headshots'); break
            case 'gallery': byPath = folder.includes('/gallery'); break
            case 'reel': byPath = folder.includes('/reels'); break
            case 'resume': byPath = folder.includes('/resumes'); break
            case 'self_tape': byPath = folder.includes('/self-tapes'); break
            case 'voice_over': byPath = folder.includes('/voice-over'); break
            case 'document': byPath = folder.includes('/documents'); break
            default: byPath = true; break
          }
          const isPublic = f?.is_public === true || String(f?.metadata?.access || '').toLowerCase() === 'public'
          if (category === 'headshot' || category === 'gallery') {
            return (byMeta || byPath) && isPublic
          }
          return byMeta || byPath
        })
      // Dedupe image variants (_large/_medium/_small) so one uploaded image counts once
      const variantKey = (n: string) => n.toLowerCase().replace(/_(large|medium|small)(?=\.[^.]+$)/i, '')
      const seen = new Set<string>()
      for (const f of candidateFiles) {
        const name = String(f?.original_filename || f?.name || '')
        const key = variantKey(name || 'unknown')
        seen.add(key)
      }
      const current = seen.size
        if (current >= allowed) {
          try {
            console.warn('[media/actor/upload] limit reached', {
              actorId,
              category,
              current,
              allowed,
              self: isSelf,
            })
          } catch {}
          return NextResponse.json(
            { error: 'Limit reached', message: `You can have up to ${allowed} ${category}${allowed === 1 ? '' : 's'}` },
            { status: 409 }
          )
        }
      } catch {
        // non-fatal; continue
      }
    }

    // Prefer user-token upload when the requester is the same actor
    if (isSelf) {
      const { bucketId, folderPath, access } = resolveStorageLocation(String(actorId), category)
      let dmapiResponse: any = null
      try {
        dmapiResponse = await uploadFileToDmapi({
          token,
          file: file as unknown as Blob,
          filename,
          bucketId,
          folderPath,
          access,
          category,
          metadata,
        })
      } catch (e) {
        // Fallback on duplicate/hash or transient failures: list folder and return latest
        try {
          const folder = await listBucketFolder({
            bucketId,
            userId: String(actorId),
            path: folderPath,
          })
          const files = Array.isArray(folder?.files) ? folder.files : []
          // Prefer 'large' image variant, then medium/small, else any
          const pick = (arr: any[]) =>
            arr.find((f) => /large\./i.test(String(f.name || ''))) ||
            arr.find((f) => /medium\./i.test(String(f.name || ''))) ||
            arr.find((f) => /small\./i.test(String(f.name || ''))) ||
            arr[0]
          const latest = pick(files)
          if (latest) {
            const simple = simplifyFileResponse(latest)
            let proxy_url: string | null = null
            try {
              const nameFromSigned = (latest?.signed_url || '').split('?')[0].split('/')
              const storedName = nameFromSigned[nameFromSigned.length - 1] || null
              if (storedName) {
                const qp = new URLSearchParams()
                qp.set('bucket', bucketId)
                qp.set('userId', String(actorId))
                qp.set('path', folderPath)
                qp.set('name', storedName)
                if ((latest as any)?.signed_url) qp.set('signed', (latest as any).signed_url)
                proxy_url = `/api/media/proxy?${qp.toString()}`
              }
            } catch {}
            return NextResponse.json({ success: true, file: { ...simple, proxy_url }, id: null })
          }
        } catch {}
        // If fallback fails, rethrow original error
        throw e
      }
      let fileRecord: any = (dmapiResponse as any)?.file || null
      const dmapiId: string | null = (dmapiResponse as any)?.mediaId || fileRecord?.id || null
      if (dmapiId) {
        try {
          const full = await getDmapiFile(dmapiId)
          fileRecord = full || fileRecord
        } catch {}
      }
      if (!fileRecord || !fileRecord.public_url) {
        try {
          const list = await listUserFiles(token, { limit: 1000, metadata: { category } })
          const candidates = Array.isArray(list?.files) ? list.files : []
          const pathMatch = (v: any) => {
            const p = (v?.folder_path || v?.metadata?.folderPath || '').toString()
            return category === 'headshot' ? p.includes('/headshots') : category === 'gallery' ? p.includes('/gallery') : true
          }
          const latest = candidates.filter(pathMatch).sort((a: any,b: any)=> new Date(b.uploaded_at||0).getTime()-new Date(a.uploaded_at||0).getTime())[0]
          if (latest) fileRecord = latest
        } catch {}
      }
      const simple = simplifyFileResponse(fileRecord)
      let proxy_url: string | null = null
      let storedName: string | null = null
      try {
        const nameFromSigned = (fileRecord?.signed_url || '').split('?')[0].split('/')
        storedName = nameFromSigned[nameFromSigned.length - 1] || null
        if (storedName) {
          const qp = new URLSearchParams()
          qp.set('bucket', 'castingly-public')
          qp.set('userId', String(actorId))
          qp.set('path', folderPath)
          qp.set('name', storedName)
          if ((fileRecord as any)?.signed_url) qp.set('signed', (fileRecord as any).signed_url)
          proxy_url = `/api/media/proxy?${qp.toString()}`
        }
      } catch {}
      // Persist avatar_url for convenience when the category is headshot
      try {
        if (proxy_url && category === 'headshot') {
          await query('UPDATE users SET avatar_url = ? WHERE id = ?', [proxy_url, actorId])
          if (storedName) {
            await query(
              `UPDATE profiles 
               SET metadata = JSON_SET(
                 COALESCE(metadata, JSON_OBJECT()),
                 '$.avatar', JSON_OBJECT('bucket', ?, 'userId', ?, 'path', ?, 'name', ?)
               )
               WHERE user_id = ?`,
              ['castingly-public', String(actorId), String(folderPath || `actors/${actorId}/headshots`), storedName, String(actorId)]
            )
          }
        }
      } catch {}
      return NextResponse.json({ success: true, file: { ...simple, proxy_url }, id: dmapiId })
    }

    // Fallback: privileged upload using service token (agents/admins)
    let dmapiResponse: any = null
    try {
      dmapiResponse = await uploadFileForActor({
        actorId,
        file: file as unknown as Blob,
        filename,
        category,
        metadata,
      })
    } catch (e) {
      // Fallback: list by bucket folder and pick latest
      try {
        const { bucketId, folderPath } = resolveStorageLocation(String(actorId), category)
        const folder = await listBucketFolder({
          bucketId,
          userId: String(actorId),
          path: folderPath,
        })
        const files = Array.isArray(folder?.files) ? folder.files : []
        const pick = (arr: any[]) =>
          arr.find((f) => /large\./i.test(String(f.name || ''))) ||
          arr.find((f) => /medium\./i.test(String(f.name || ''))) ||
          arr.find((f) => /small\./i.test(String(f.name || ''))) ||
          arr[0]
        const latest = pick(files)
        if (latest) {
          const simple = simplifyFileResponse(latest)
          let proxy_url: string | null = null
          try {
            const nameFromSigned = (latest?.signed_url || '').split('?')[0].split('/')
            const storedName = nameFromSigned[nameFromSigned.length - 1] || null
            if (storedName) {
              const qp = new URLSearchParams()
              qp.set('bucket', 'castingly-public')
              qp.set('userId', String(actorId))
              qp.set('path', folderPath)
              qp.set('name', storedName)
              if ((latest as any)?.signed_url) qp.set('signed', (latest as any).signed_url)
              proxy_url = `/api/media/proxy?${qp.toString()}`
            }
          } catch {}
          return NextResponse.json({ success: true, file: { ...simple, proxy_url }, id: null })
        }
      } catch {}
      throw e
    }
    let fileRecord: any = (dmapiResponse as any)?.file || null
    const dmapiId: string | null = (dmapiResponse as any)?.mediaId || fileRecord?.id || null
    if (dmapiId) {
      try {
        const full = await getDmapiFile(dmapiId)
        fileRecord = full || fileRecord
      } catch {}
    }
    if (!fileRecord || !fileRecord.public_url) {
      try {
        const list = await listDmapiFilesServer({ limit: 1000, userId: String(actorId), metadata: { category } }) as any
        const candidates = Array.isArray(list?.files) ? list.files : []
        const pathMatch = (v: any) => {
          const p = (v?.folder_path || v?.metadata?.folderPath || '').toString()
          return category === 'headshot' ? p.includes('/headshots') : category === 'gallery' ? p.includes('/gallery') : true
        }
        const latest = candidates.filter(pathMatch).sort((a: any,b: any)=> new Date(b.uploaded_at||0).getTime()-new Date(a.uploaded_at||0).getTime())[0]
        if (latest) fileRecord = latest
      } catch {}
    }
    const simple = simplifyFileResponse(fileRecord)
    let proxy_url: string | null = null
    let storedName: string | null = null
    try {
      const nameFromSigned = (fileRecord?.signed_url || '').split('?')[0].split('/')
      storedName = nameFromSigned[nameFromSigned.length - 1] || null
      if (storedName) {
        const qp = new URLSearchParams()
        qp.set('bucket', 'castingly-public')
        qp.set('userId', String(actorId))
        qp.set('path', `actors/${actorId}/headshots`)
        qp.set('name', storedName)
        if ((fileRecord as any)?.signed_url) qp.set('signed', (fileRecord as any).signed_url)
        proxy_url = `/api/media/proxy?${qp.toString()}`
      }
    } catch {}
    // Persist avatar_url for convenience when the category is headshot
    try {
      if (proxy_url && category === 'headshot') {
        await query('UPDATE users SET avatar_url = ? WHERE id = ?', [proxy_url, actorId])
        if (storedName) {
          await query(
            `UPDATE profiles 
             SET metadata = JSON_SET(
               COALESCE(metadata, JSON_OBJECT()),
               '$.avatar', JSON_OBJECT('bucket', ?, 'userId', ?, 'path', ?, 'name', ?)
             )
             WHERE user_id = ?`,
            ['castingly-public', String(actorId), `actors/${actorId}/headshots`, storedName, String(actorId)]
          )
        }
      }
    } catch {}
    return NextResponse.json({ success: true, file: { ...simple, proxy_url }, id: dmapiId })
  } catch (error) {
    console.error('Actor DMAPI upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
