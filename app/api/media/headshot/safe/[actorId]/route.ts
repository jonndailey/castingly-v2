import { NextRequest } from 'next/server'
import { listActorFiles, listBucketFolder } from '@/lib/server/dmapi-service'

export async function GET(request: NextRequest, context: { params: Promise<{ actorId: string }> }) {
  try {
    const { actorId } = await context.params
    if (!actorId) return new Response('Actor ID required', { status: 400 })

    const cacheHeaders = {
      'Cache-Control': 'public, max-age=60',
      Vary: 'Authorization',
    }

    // Public-first: prefer public headshots
    try {
      const folder = await listBucketFolder({
        bucketId: 'castingly-public',
        userId: String(actorId),
        path: `actors/${actorId}/headshots`,
      })
      const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
      if (files.length > 0) {
        const pick = (arr: any[]) =>
          arr.find((f) => /large\./i.test(String(f.name || ''))) ||
          arr.find((f) => /medium\./i.test(String(f.name || ''))) ||
          arr.find((f) => /small\./i.test(String(f.name || ''))) ||
          arr[0]
        const chosen = pick(files)
        const publicUrl = (chosen as any)?.public_url || (chosen as any)?.url || null
        if (publicUrl) {
          return new Response(null, { status: 302, headers: { Location: publicUrl, ...cacheHeaders } })
        }
      }
    } catch {}

    // As a secondary attempt, look via metadata but still only return public_url
    try {
      const list = await listActorFiles(actorId, { limit: 200, metadata: { category: 'headshot' } }) as any
      const files = Array.isArray(list?.files) ? list.files : []
      const chosen = files.find((f: any) => f.public_url || f.url)
      const url = chosen?.public_url || chosen?.url || null
      if (url) {
        return new Response(null, { status: 302, headers: { Location: url, ...cacheHeaders } })
      }
    } catch {}

    // Fallback to UI avatars to avoid 404
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(String(actorId))}&background=9C27B0&color=fff`
    return new Response(null, { status: 302, headers: { Location: fallback, ...cacheHeaders } })
  } catch {
    return new Response('Lookup failed', { status: 500 })
  }
}

