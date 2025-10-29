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
    const rawPath = String(f?.path || '')
    // Normalize DMAPI folder path to expected tail (e.g., actors/<id>/headshots)
    const p1 = rawPath.replace(/^files\/[a-f0-9-]+\/castingly-public\//i, '')
    const p2 = p1.replace(new RegExp(`^${actorId}/`), '')
    const path = p2
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
  // Convert to tiles and sort newest-first by leading timestamp if present
  const enriched: Array<{ tile: Tile; ts: number }> = []
  for (const [, g] of groups) {
    const thumb = g.small || g.thumbnail || g.medium || g.original || g.large
    const full = g.original || g.large || g.medium || g.small || g.thumbnail
    if (thumb && full) {
      const m = g.baseName.match(/^(\d{10,})[_.-]?/)
      const ts = m ? parseInt(m[1], 10) : 0
      enriched.push({ tile: { thumb, full, name: g.baseName }, ts: Number.isFinite(ts) ? ts : 0 })
    }
  }
  enriched.sort((a, b) => b.ts - a.ts)
  return enriched.map((e) => e.tile)
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ actorId: string }> }) {
  try {
    const t0 = Date.now()
    const { actorId } = await ctx.params
    if (!actorId) return NextResponse.json({ error: 'actorId required' }, { status: 400 })
    const folder = await listBucketFolder({ bucketId: 'castingly-public', userId: String(actorId), path: `actors/${actorId}/headshots` })
    const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
    const tiles = pickTiles(files, String(actorId))
    const dur = Date.now() - t0
    const res = NextResponse.json({ tiles })
    res.headers.set('Cache-Control', 'private, max-age=20')
    res.headers.set('Vary', 'Authorization')
    res.headers.set('X-Tiles-Count', String(tiles.length))
    res.headers.set('X-Tiles-Duration', `${dur}ms`)
    try { console.info('[tiles/headshots]', { actorId, count: tiles.length, ms: dur }) } catch {}
    return res
  } catch (e) {
    return NextResponse.json({ tiles: [] })
  }
}
