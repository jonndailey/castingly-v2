import { NextRequest } from 'next/server'
import { query } from '@/lib/db_existing'
import { listBucketFolder } from '@/lib/server/dmapi-service'

export async function GET(request: NextRequest, context: { params: Promise<{ actorId: string }> }) {
  try {
    const { actorId } = await context.params
    if (!actorId) return new Response('Actor ID required', { status: 400 })

    // Try user profile image first (local schema)
    let row: { avatar_url: string | null; name: string | null } | undefined
    try {
      // Try modern schema columns first (avatar_url, name)
      const rowsModern = (await query(
        `SELECT avatar_url AS avatar_url, name FROM users WHERE id = ? LIMIT 1`,
        [actorId]
      )) as Array<{ avatar_url: string | null; name: string | null }>
      row = rowsModern?.[0]
      if (!row || (row.avatar_url == null && (row.name == null || String(row.name).trim() === ''))) {
        // Fallback to legacy columns (profile_image, first_name/last_name)
        const rowsLegacy = (await query(
          `SELECT COALESCE(profile_image, NULL) AS avatar_url, CONCAT_WS(' ', first_name, last_name) AS name FROM users WHERE id = ? LIMIT 1`,
          [actorId]
        )) as Array<{ avatar_url: string | null; name: string | null }>
        row = rowsLegacy?.[0]
      }
    } catch {
      // As last resort, ignore row; we'll use the UI avatar fallback
      row = undefined
    }
    const name = (row?.name && row.name.trim().length > 0) ? row.name : String(actorId)
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9C27B0&color=fff`

    let url: string | null = row?.avatar_url || null
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=1800',
      Vary: 'Authorization',
    }
    if (url && url.startsWith('/')) {
      // Use relative Location so reverse proxies don't rewrite to localhost
      return new Response(null, { status: 302, headers: { Location: url, ...cacheHeaders } })
    }
    if (url && /^https?:\/\//i.test(url)) {
      return new Response(null, { status: 302, headers: { Location: url, ...cacheHeaders } })
    }

    // Fallback to DMAPI proxy location if available via a metadata table (optional)
    try {
      // Support optional profiles table if present; ignore if missing in local schema
      const metaRows = (await query(
        'SELECT JSON_EXTRACT(metadata, $.avatar) as avatar FROM profiles WHERE user_id = ? LIMIT 1',
        [actorId]
      )) as Array<{ avatar: string | null }>
      const metaStr = metaRows?.[0]?.avatar || null
      if (metaStr) {
        const meta = JSON.parse(metaStr)
        const bucket = meta?.bucket
        const userId = meta?.userId || actorId
        const path = meta?.path || ''
        const namePart = meta?.name
        if (bucket && userId && namePart) {
          const qp = new URLSearchParams()
          qp.set('bucket', bucket)
          qp.set('userId', String(userId))
          if (path) qp.set('path', String(path))
          qp.set('name', String(namePart))
          const proxy = `/api/media/proxy?${qp.toString()}`
          return new Response(null, { status: 302, headers: { Location: proxy, ...cacheHeaders } })
        }
      }
    } catch {}

    // Fallback to DMAPI: try to find a headshot in the public bucket
    try {
      const folder = await listBucketFolder({
        bucketId: 'castingly-public',
        userId: String(actorId),
        path: `actors/${actorId}/headshots`,
      })
      const files = Array.isArray(folder?.files) ? folder.files : []
      if (files.length > 0) {
        // Prefer large/medium/small, else first
        const pick = (arr: any[]) =>
          arr.find((f) => /large\./i.test(String(f.name || ''))) ||
          arr.find((f) => /medium\./i.test(String(f.name || ''))) ||
          arr.find((f) => /small\./i.test(String(f.name || ''))) ||
          arr[0]
        const chosen: any = pick(files)
        const direct = chosen?.public_url || chosen?.url || chosen?.signed_url || null
        if (direct) {
          // Compose a short proxy and persist it (users.avatar_url + profiles.metadata.avatar)
          try {
            const namePart = String(chosen?.name || '')
            if (namePart) {
              const qp = new URLSearchParams()
              qp.set('bucket', 'castingly-public')
              qp.set('userId', String(actorId))
              qp.set('path', `actors/${actorId}/headshots`)
              qp.set('name', namePart)
              const proxy = `/api/media/proxy?${qp.toString()}`
              await query('UPDATE users SET avatar_url = ? WHERE id = ?', [proxy, actorId])
              try {
                await query(
                  `UPDATE profiles 
                   SET metadata = JSON_SET(
                     COALESCE(metadata, JSON_OBJECT()),
                     '$.avatar', JSON_OBJECT('bucket', ?, 'userId', ?, 'path', ?, 'name', ?)
                   )
                   WHERE user_id = ?`,
                  ['castingly-public', String(actorId), `actors/${actorId}/headshots`, namePart, String(actorId)]
                )
              } catch {}
            }
          } catch {}
          return new Response(null, { status: 302, headers: { Location: direct, ...cacheHeaders } })
        }
      }
    } catch {}

    // Last resort: redirect to UI-Avatars
    return new Response(null, { status: 302, headers: { Location: fallback, ...cacheHeaders } })
  } catch {
    return new Response('Avatar lookup failed', { status: 500 })
  }
}
