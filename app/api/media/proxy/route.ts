import { NextRequest } from 'next/server'
import { listBucketFolder, listFiles as listDmapiFiles } from '@/lib/server/dmapi-service'
import { validateUserToken } from '@/lib/dmapi'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const bucket = url.searchParams.get('bucket')
    const userId = url.searchParams.get('userId')
    // Accept both raw and percent-encoded path (e.g., 'actors/<id>/headshots' or 'actors%2F<id>%2Fheadshots')
    const rawPath = url.searchParams.get('path') || ''
    const path = (() => { try { return decodeURIComponent(rawPath) } catch { return rawPath } })()
    const name = url.searchParams.get('name') || ''
    const signed = url.searchParams.get('signed') || ''

    if (!bucket || !userId || !name) {
      return new Response('Missing required params', { status: 400 })
    }

    // If a pre-signed URL is provided, redirect the client (faster, fewer server hops)
    const cacheHeaders = { 'Cache-Control': 'public, max-age=3600' }
    if (signed && /^https?:\/\//i.test(signed)) {
      return new Response(null, { status: 302, headers: { Location: signed, ...cacheHeaders } })
    }

    // Security: allow unauthenticated access for public bucket objects
    // For private buckets, require a valid token for matching userId
    const isPublicBucket = String(bucket).toLowerCase() === 'castingly-public'
    if (!isPublicBucket) {
      const authz = request.headers.get('authorization')
      const auth = await validateUserToken(authz)
      if (!auth || String(auth.userId) !== String(userId)) {
        return new Response('Unauthorized', { status: 401 })
      }
    }

    let res: Response | null = null
    try {
      // Primary: list via DMAPI and stream from signed/public URL
      const folder = await listBucketFolder({
        bucketId: bucket,
        userId: String(userId),
        path: String(path || ''),
      })
      const files = Array.isArray(folder?.files) ? folder.files : []
      // Find by exact name
      const exact = files.find((it: any) => String(it?.name || it?.original_filename || it?.id || '') === String(name))
      // Try variant-insensitive match (ignore _large/_medium/_small and extension)
      const variantBase = String(name).toLowerCase().replace(/_(large|medium|small)(?=\.[^.]+$)/, '')
      const baseNoExt = variantBase.replace(/\.[^.]+$/, '')
      const byVariant = exact || files.find((it: any) => {
        const n = String(it?.name || '').toLowerCase()
        const nNoExt = n.replace(/\.[^.]+$/, '')
        const nNoSuffix = nNoExt.replace(/_(large|medium|small)$/, '')
        return nNoSuffix === baseNoExt
      })
      const prefer = byVariant || files.find((f: any) => /\.(jpe?g|png|webp)$/i.test(String(f.name||''))) || files[0]
      const targetUrl = (prefer as any)?.signed_url || (prefer as any)?.public_url
      if (targetUrl && typeof targetUrl === 'string') {
        return new Response(null, { status: 302, headers: { Location: targetUrl, ...cacheHeaders } })
      }
    } catch (err: any) {
      try { console.error('[media/proxy] listBucketFolder failed:', err?.message || err) } catch {}
      // ignore and try fallback
    }

    // Fallback: search by metadata (category=headshot) for this actor
    try {
      const actorFiles = await listDmapiFiles({ limit: 200, userId: String(userId), metadata: { category: 'headshot' } }) as any
      const files = Array.isArray(actorFiles?.files) ? actorFiles.files : []
      if (files.length > 0) {
        // Prefer a web-friendly image first
        const pick = (arr: any[]) =>
          arr.find((f) => /\.(jpe?g|png|webp)$/i.test(String(f.original_filename || f.name || ''))) || arr[0]
        const chosen = pick(files) as any
        const target = chosen?.signed_url || chosen?.public_url || chosen?.url || null
        if (target) {
          return new Response(null, { status: 302, headers: { Location: target, ...cacheHeaders } })
        }
      }
    } catch (e) {
      try { console.error('[media/proxy] metadata fallback failed:', (e as any)?.message || e) } catch {}
    }

    // If we couldn't resolve any URL from DMAPI, return 404
    return new Response('Not found', { status: 404 })
  } catch (e: any) {
    try { console.error('[media/proxy] proxy error:', e?.message || e) } catch {}
    return new Response('Proxy error', { status: 500 })
  }
}
