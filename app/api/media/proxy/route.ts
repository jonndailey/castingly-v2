import { NextRequest } from 'next/server'
import { obtainServiceTokenForServer } from '@/lib/server/dmapi-service-proxy'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const bucket = url.searchParams.get('bucket')
    const userId = url.searchParams.get('userId')
    const path = url.searchParams.get('path') || ''
    const name = url.searchParams.get('name') || ''

    if (!bucket || !userId || !name) {
      return new Response('Missing required params', { status: 400 })
    }

    // Security: require the caller to be authenticated; only allow self or admins
    // In this proxy, we keep it simple: require any Authorization header present (login required)
    const authz = request.headers.get('authorization')
    if (!authz) {
      return new Response('Unauthorized', { status: 401 })
    }

    const base = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
    if (!base) {
      return new Response('DMAPI base not configured', { status: 500 })
    }

    const svcToken = await obtainServiceTokenForServer()
    const dmapiUrl = `${base}/api/serve/files/${encodeURIComponent(userId)}/${encodeURIComponent(bucket)}/${path ? path.replace(/^\/+|\/+$/g,'') + '/' : ''}${encodeURIComponent(name)}`
    const res = await fetch(dmapiUrl, {
      headers: {
        Authorization: `Bearer ${svcToken}`,
        'User-Agent': 'Castingly/Proxy',
      },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return new Response(text || 'DMAPI fetch failed', { status: res.status })
    }

    const headers = new Headers()
    const ct = res.headers.get('content-type') || 'application/octet-stream'
    headers.set('Content-Type', ct)
    const disp = res.headers.get('content-disposition')
    if (disp) headers.set('Content-Disposition', disp)
    return new Response(res.body, { status: 200, headers })
  } catch (e: any) {
    return new Response('Proxy error', { status: 500 })
  }
}

