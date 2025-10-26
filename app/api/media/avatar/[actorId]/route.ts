import { NextRequest } from 'next/server'
import { query } from '@/lib/db_existing'

export async function GET(request: NextRequest, context: { params: Promise<{ actorId: string }> }) {
  try {
    const { actorId } = await context.params
    if (!actorId) return new Response('Actor ID required', { status: 400 })

    // Try users.avatar_url first (already normalized to short proxy when long)
    const rows = (await query('SELECT avatar_url, name FROM users WHERE id = ? LIMIT 1', [actorId])) as Array<{ avatar_url: string | null, name: string | null }>
    const row = rows?.[0]
    const name = row?.name || String(actorId)
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

    // Fallback to canonical location in profiles.metadata.avatar
    try {
      const metaRows = (await query('SELECT JSON_EXTRACT(metadata, $.avatar) as avatar FROM profiles WHERE user_id = ? LIMIT 1', [actorId])) as Array<{ avatar: string | null }>
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

    // Last resort: redirect to UI-Avatars
    return new Response(null, { status: 302, headers: { Location: fallback, ...cacheHeaders } })
  } catch {
    return new Response('Avatar lookup failed', { status: 500 })
  }
}
