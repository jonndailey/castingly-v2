import { NextRequest, NextResponse } from 'next/server'
import { listBucketFolder } from '@/lib/server/dmapi-service'

type Tile = { thumb: string; full: string; name: string }

function baseUrl(): string | null {
  const b = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').trim()
  if (!b) return null
  return b.replace(/\/$/, '')
}

function pickTiles(files: Array<any>, actorId: string): Tile[] {
  const groups = new Map<string, { small?: any; medium?: any; large?: any; thumbnail?: any; original?: any; baseName: string }>()
  for (const f of files) {
    const name = String(f?.name || '')
    if (!name) continue
    const lower = name.toLowerCase()
    if (!/\.(jpe?g|png|webp)$/i.test(lower)) continue
    const m = lower.match(/^(.*?)(?:_(large|medium|small|thumbnail))?(\.[^.]+)$/)
    const base = m ? m[1] : lower.replace(/\.[^.]+$/, '')
    const variant = (m && (m[2] as 'large'|'medium'|'small'|'thumbnail'|null)) || null
    if (!groups.has(base)) groups.set(base, { baseName: base })
    const g = groups.get(base)!
    if (!variant) g.original = f
    else g[variant] = f as any
  }
  const tiles: Tile[] = []
  for (const [, g] of groups) {
    const pickUrl = (x?: any) => x ? (x.public_url || x.url || x.signed_url || null) : null
    const thumb = pickUrl(g.small) || pickUrl(g.thumbnail) || pickUrl(g.medium) || pickUrl(g.original) || pickUrl(g.large)
    const full = pickUrl(g.original) || pickUrl(g.large) || pickUrl(g.medium) || pickUrl(g.small) || pickUrl(g.thumbnail)
    if (thumb && full) tiles.push({ thumb, full, name: g.baseName })
  }
  return tiles
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ actorId: string }> }) {
  try {
    const t0 = Date.now()
    const { actorId } = await ctx.params
    if (!actorId) return NextResponse.json({ error: 'actorId required' }, { status: 400 })
    const folder = await listBucketFolder({ bucketId: 'castingly-public', userId: String(actorId), path: `actors/${actorId}/gallery` })
    const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
    const tiles = pickTiles(files, String(actorId))
    const dur = Date.now() - t0
    const res = NextResponse.json({ tiles })
    res.headers.set('Cache-Control', 'private, max-age=20')
    res.headers.set('Vary', 'Authorization')
    res.headers.set('X-Tiles-Count', String(tiles.length))
    res.headers.set('X-Tiles-Duration', `${dur}ms`)
    try { console.info('[tiles/gallery]', { actorId, count: tiles.length, ms: dur }) } catch {}
    return res
  } catch (e) {
    return NextResponse.json({ tiles: [] })
  }
}
