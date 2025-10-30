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
      const rowsModern = (await query(
        `SELECT avatar_url AS avatar_url, name FROM users WHERE id = ? LIMIT 1`,
        [actorId]
      )) as Array<{ avatar_url: string | null; name: string | null }>
      row = rowsModern?.[0]
      if (!row || (row.avatar_url == null && (row.name == null || String(row.name).trim() === ''))) {
        const rowsLegacy = (await query(
          `SELECT COALESCE(profile_image, NULL) AS avatar_url, CONCAT_WS(' ', first_name, last_name) AS name FROM users WHERE id = ? LIMIT 1`,
          [actorId]
        )) as Array<{ avatar_url: string | null; name: string | null }>
        row = rowsLegacy?.[0]
      }
    } catch {
      row = undefined
    }
    const name = (row?.name && row.name.trim().length > 0) ? row.name : String(actorId)
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=160&background=9C27B0&color=fff`

    let url: string | null = row?.avatar_url || null
    const cacheHeaders = {
      'Cache-Control': 'private, max-age=60, must-revalidate',
      Vary: 'Authorization',
    }
    // Intentionally ignore stored avatar_url for redirect to avoid stale/self-loop pointers.
    // We will resolve latest public headshot below and return a stable DMAPI /api/serve URL.

    // Resolve from public headshots folder directly
    try {
      const folder = await listBucketFolder({
        bucketId: 'castingly-public',
        userId: String(actorId),
        path: `actors/${actorId}/headshots`,
      })
      const files = Array.isArray(folder?.files) ? folder.files : []
      if (files.length > 0) {
        // Prefer the small variant for avatars; if multiple, pick the one with the highest leading timestamp
        const smalls = files.filter((f: any) => /_small\./i.test(String(f?.name || '')))
        const chooseNewestByTs = (arr: any[]) => {
          return arr
            .map((f) => ({ f, ts: (() => { const m = String(f?.name || '').match(/^(\d{10,})/); return m ? parseInt(m[1], 10) : 0 })() }))
            .sort((a, b) => b.ts - a.ts)[0]?.f
        }
        let chosen: any = smalls.length ? chooseNewestByTs(smalls) : chooseNewestByTs(files)
        if (!chosen) chosen = files[0]
        // Prefer stable DMAPI /api/serve for public bucket
        let direct = chosen?.public_url || chosen?.url || chosen?.signed_url || null
        try {
          const objName = String(chosen?.name || '').trim()
          if (objName) {
            const base = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
            if (base) {
              const tail = `actors/${actorId}/headshots/`
              direct = `${base}/api/serve/files/${encodeURIComponent(String(actorId))}/castingly-public/${tail}${encodeURIComponent(objName)}`
            }
          }
        } catch {}
        if (direct) {
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
          try {
            const resp = await fetch(direct)
            const hdrs = new Headers(resp.headers)
            hdrs.set('Cache-Control', 'public, max-age=31536000, immutable')
            return new Response(await resp.arrayBuffer(), { status: 200, headers: hdrs })
          } catch {
            return new Response(null, { status: 302, headers: { Location: direct, ...cacheHeaders } })
          }
        }
      }
    } catch {}

    // Fallback: resolve from private headshots (time-limited signed URLs)
    try {
      const folder = await listBucketFolder({
        bucketId: 'castingly-private',
        userId: String(actorId),
        path: `actors/${actorId}/headshots`,
      })
      const files = Array.isArray(folder?.files) ? folder.files : []
      if (files.length > 0) {
        const pick = (arr: any[]) =>
          arr.find((f) => /large\./i.test(String(f.name || ''))) ||
          arr.find((f) => /medium\./i.test(String(f.name || ''))) ||
          arr.find((f) => /small\./i.test(String(f.name || ''))) ||
          arr[0]
        const chosen: any = pick(files)
        const direct = chosen?.signed_url || chosen?.thumbnail_signed_url || chosen?.url || null
        if (direct) {
          // Persist a short proxy pointer for subsequent loads
          try {
            const namePart = String(chosen?.name || '')
            if (namePart) {
              const qp = new URLSearchParams()
              qp.set('bucket', 'castingly-private')
              qp.set('userId', String(actorId))
              qp.set('path', `actors/${actorId}/headshots`)
              qp.set('name', namePart)
              if (chosen?.signed_url) qp.set('signed', String(chosen.signed_url))
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
                  ['castingly-private', String(actorId), `actors/${actorId}/headshots`, namePart, String(actorId)]
                )
              } catch {}
            }
          } catch {}
          try {
            const resp = await fetch(direct)
            const hdrs = new Headers(resp.headers)
            hdrs.set('Cache-Control', 'private, no-store')
            return new Response(await resp.arrayBuffer(), { status: 200, headers: hdrs })
          } catch {
            return new Response(null, { status: 302, headers: { Location: direct, ...cacheHeaders } })
          }
        }
      }
    } catch {}

    // Fallback: UI-Avatars
    return new Response(null, { status: 302, headers: { Location: fallback, ...cacheHeaders } })
  } catch {
    return new Response('Avatar lookup failed', { status: 500 })
  }
}
