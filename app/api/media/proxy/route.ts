import { NextRequest } from 'next/server'
import { listBucketFolder } from '@/lib/server/dmapi-service'
import { validateUserToken } from '@/lib/dmapi'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const bucket = url.searchParams.get('bucket')
    const userId = url.searchParams.get('userId')
    const path = url.searchParams.get('path') || ''
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
      // Find by exact name, else by variant-insensitive name, else pick best-guess
      const exact = files.find((it: any) => String(it?.name || it?.original_filename || it?.id || '') === String(name))
      const variantBase = String(name).toLowerCase().replace(/_(large|medium|small)(?=\.[^.]+$)/, '')
      const byVariant = exact || files.find((it: any) => String(it?.name || '').toLowerCase().replace(/_(large|medium|small)(?=\.[^.]+$)/, '') === variantBase)
      const prefer = byVariant || files.find((f: any) => /large\./i.test(String(f.name||''))) || files[0]
      const targetUrl = (prefer as any)?.signed_url || (prefer as any)?.public_url
      if (targetUrl && typeof targetUrl === 'string') {
        return new Response(null, { status: 302, headers: { Location: targetUrl, ...cacheHeaders } })
      }
    } catch (err: any) {
      try { console.error('[media/proxy] listBucketFolder failed:', err?.message || err) } catch {}
      // ignore and try fallback
    }

    // If we couldn't resolve a URL from DMAPI, return 404
    return new Response('Not found', { status: 404 })
  } catch (e: any) {
    try { console.error('[media/proxy] proxy error:', e?.message || e) } catch {}
    return new Response('Proxy error', { status: 500 })
  }
}
