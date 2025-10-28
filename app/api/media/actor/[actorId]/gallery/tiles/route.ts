import { NextRequest, NextResponse } from 'next/server'
import { listBucketFolder } from '@/lib/server/dmapi-service'

type Tile = { thumb: string; full: string; name: string }

function baseUrl(): string | null {
  const b = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').trim()
  if (!b) return null
  return b.replace(/\/$/, '')
}

function pickTiles(files: Array<{ name?: string; path?: string }>, actorId: string): Tile[] {
  const b = baseUrl()
  if (!b) return []
  const groups = new Map<string, { small?: string; medium?: string; large?: string; thumbnail?: string; original?: string; baseName: string; path: string }>()
  const serve = (userId: string, folderPath: string, name: string) => `${b}/api/serve/files/${encodeURIComponent(String(userId))}/castingly-public/${folderPath ? `${folderPath.replace(/^\/+|\/+$/g, '')}/` : ''}${encodeURIComponent(name)}`
  for (const f of files) {
    const name = String(f?.name || '')
    if (!name) continue
    const path = String(f?.path || '')
    const lower = name.toLowerCase()
    if (!/\.(jpe?g|png|webp)$/i.test(lower)) continue
    const m = lower.match(/^(.*?)(?:_(large|medium|small|thumbnail))?(\.[^.]+)$/)
    const base = m ? m[1] : lower.replace(/\.[^.]+$/, '')
    const variant = (m && (m[2] as 'large'|'medium'|'small'|'thumbnail'|null)) || null
    if (!groups.has(base)) groups.set(base, { baseName: base, path })
    const g = groups.get(base)!
    const url = serve(actorId, path, name)
    if (!variant) g.original = url
    else g[variant] = url as any
  }
  const tiles: Tile[] = []
  for (const [, g] of groups) {
    const thumb = g.small || g.thumbnail || g.medium || g.original || g.large
    const full = g.original || g.large || g.medium || g.small || g.thumbnail
    if (thumb && full) tiles.push({ thumb, full, name: g.baseName })
  }
  return tiles
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ actorId: string }> }) {
  try {
    const { actorId } = await ctx.params
    if (!actorId) return NextResponse.json({ error: 'actorId required' }, { status: 400 })
    const folder = await listBucketFolder({ bucketId: 'castingly-public', userId: String(actorId), path: `actors/${actorId}/gallery` })
    const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
    const tiles = pickTiles(files, String(actorId))
    const res = NextResponse.json({ tiles })
    res.headers.set('Cache-Control', 'private, max-age=20')
    res.headers.set('Vary', 'Authorization')
    return res
  } catch (e) {
    return NextResponse.json({ tiles: [] })
  }
}

