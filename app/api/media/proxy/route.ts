import { NextRequest } from 'next/server'
import { listBucketFolder } from '@/lib/server/dmapi-service'

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
    // For non-public buckets, require an Authorization header
    const authz = request.headers.get('authorization')
    const isPublicBucket = String(bucket).toLowerCase() === 'castingly-public'
    if (!authz && !isPublicBucket) {
      return new Response('Unauthorized', { status: 401 })
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

    if (!res) {
      // Fallback: DMAPI public serve path
      const base = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
      if (base) {
        const tail = String(path || '').replace(/^\/+|\/+$/g, '')
        const qp = new URLSearchParams()
        qp.set('app_id', String(process.env.DMAPI_APP_ID || 'castingly'))
        const dmapiUrl = `${base}/api/serve/files/${encodeURIComponent(String(userId))}/${encodeURIComponent(String(bucket))}/${tail ? tail + '/' : ''}${encodeURIComponent(String(name))}?${qp.toString()}`
        try {
          // Prefer redirect to let the browser fetch directly
          return new Response(null, { status: 302, headers: { Location: dmapiUrl, ...cacheHeaders } })
        } catch (e: any) {
          try { console.error('[media/proxy] fallback fetch failed:', e?.message || e) } catch {}
        }
      }
    }

    // If all else fails
    return new Response('Proxy error', { status: 500 })
  } catch (e: any) {
    try { console.error('[media/proxy] proxy error:', e?.message || e) } catch {}
    return new Response('Proxy error', { status: 500 })
  }
}
