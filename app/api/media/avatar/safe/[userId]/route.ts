import { NextRequest, NextResponse } from 'next/server'
import { listBucketFolder } from '@/lib/server/dmapi-service'

function baseServeUrl(): string | null {
  const b = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').trim()
  return b ? b.replace(/\/$/, '') : null
}

function pickFirstTile(files: Array<{ name?: string; path?: string }>, userId: string) {
  const b = baseServeUrl()
  if (!b) return null
  const byBase: Record<string, { small?: string; medium?: string; large?: string; original?: string; thumbnail?: string; path: string }> = {}
  const serve = (folderPath: string, name: string) => `${b}/api/serve/files/${encodeURIComponent(String(userId))}/castingly-public/${folderPath ? `${folderPath.replace(/^\/+|\/+$/g, '')}/` : ''}${encodeURIComponent(name)}`
  for (const f of files) {
    const name = String(f?.name || '')
    if (!name) continue
    const rawPath = String(f?.path || '')
    const p1 = rawPath.replace(/^files\/[a-f0-9-]+\/castingly-public\//i, '')
    const p2 = p1.replace(new RegExp(`^${userId}/`), '')
    const path = p2
    const lower = name.toLowerCase()
    if (!/\.(jpe?g|png|webp)$/i.test(lower)) continue
    const m = lower.match(/^(.*?)(?:_(large|medium|small|thumbnail))?(\.[^.]+)$/)
    const base = m ? m[1] : lower.replace(/\.[^.]+$/, '')
    if (!byBase[base]) byBase[base] = { path }
    const url = serve(path, name)
    const variant = (m && (m[2] as 'large'|'medium'|'small'|'thumbnail'|null)) || null
    if (!variant) byBase[base].original = url
    else byBase[base][variant] = url as any
  }
  // Prefer small/thumbnail → medium → original/large
  for (const base of Object.keys(byBase)) {
    const g = byBase[base]
    const thumb = g.small || g.thumbnail || g.medium || g.original || g.large
    const full = g.original || g.large || g.medium || g.small || g.thumbnail
    if (thumb && full) return { thumb, full }
  }
  return null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  try {
    const folder = await listBucketFolder({
      bucketId: 'castingly-public',
      userId: String(userId),
      path: `actors/${userId}/headshots`,
    })
    const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
    const tile = pickFirstTile(files, String(userId))
    if (!tile?.thumb) return new NextResponse('Not Found', { status: 404 })
    const upstream = await fetch(tile.thumb)
    if (!upstream.ok) return new NextResponse('Not Found', { status: 404 })
    const contentType = upstream.headers.get('content-type') || 'image/webp'
    const body = upstream.body
    const res = new NextResponse(body, { status: 200, headers: { 'Content-Type': contentType } })
    // Cache aggressively; upstream serves public thumbnails
    res.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=60')
    res.headers.set('X-Avatar-Source', 'dmapi-serve')
    return res
  } catch (e) {
    return new NextResponse('Not Found', { status: 404 })
  }
}

