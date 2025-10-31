import { NextRequest, NextResponse } from 'next/server'
import { listBucketFolder, listActorFiles } from '@/lib/server/dmapi-service'

type Tile = { thumb: string; full: string; name: string }

function baseUrl(): string | null {
  const b = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').trim()
  if (!b) return null
  return b.replace(/\/$/, '')
}

// In-memory small cache of URL HEAD validation to avoid repeated probes
const headCache = new Map<string, { ok: boolean; exp: number }>()
const HEAD_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

async function headOk(url: string): Promise<boolean> {
  const now = Date.now()
  const cached = headCache.get(url)
  if (cached && cached.exp > now) return cached.ok
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 800)
  try {
    const r = await fetch(url, { method: 'HEAD', signal: controller.signal as any, cache: 'no-store' })
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    const ok = r.ok && ct.startsWith('image/')
    headCache.set(url, { ok, exp: now + HEAD_TTL_MS })
    return ok
  } catch {
    headCache.set(url, { ok: false, exp: now + 5 * 60 * 1000 }) // short cache for failures
    return false
  } finally {
    clearTimeout(timeout)
  }
}

function pickTiles(files: Array<{ name?: string; path?: string }>, actorId: string): Tile[] {
  const b = baseUrl()
  if (!b) return []
  const groups = new Map<string, { small?: string; medium?: string; large?: string; thumbnail?: string; original?: string; baseName: string; path: string }>()
  // Always use the correct headshots path structure
  const serve = (userId: string, folderPath: string, name: string) => {
    // For headshots, always use actors/[userId]/headshots path
    const correctPath = `actors/${userId}/headshots`
    return `${b}/api/serve/files/${encodeURIComponent(String(userId))}/castingly-public/${correctPath}/${encodeURIComponent(name)}`
  }
  const junk = /^(android-launchericon|maskable-icon|icon-\d+x\d+|app-logo|test[-_]?)/i
  for (const f of files) {
    const name = String(f?.name || '')
    if (!name) continue
    if (junk.test(name)) continue
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
    // First try metadata-driven listing (more reliable than folder-only)
    let tiles: Tile[] = []
    try {
      const listed: any = await listActorFiles(String(actorId), { limit: 400, metadata: { category: 'headshot' } })
      const files = Array.isArray(listed?.files) ? listed.files : []
      // Filter to this actor and non-junk
      const filtered = files.filter((f: any) => {
        const meta = f.metadata || {}
        const sourceId = meta.sourceActorId || meta.source_actor_id || meta.userId || meta.user_id
        if (sourceId && String(sourceId) !== String(actorId)) return false
        const name = String(f.original_filename || f.name || '')
        if (!name) return false
        if (/^(android-launchericon|maskable-icon|icon-\d+x\d+|app-logo|test[-_]?)/i.test(name)) return false
        return true
      })
      const b = baseUrl() || 'https://media.dailey.cloud'
      // Group by base variant and choose best thumb/full
      const groups = new Map<string, { files: any[] }>()
      const getBase = (n: string) => {
        const lower = n.toLowerCase()
        const m = lower.match(/^(.*?)(?:_(large|medium|small|thumbnail))?(\.[^.]+)$/)
        return m ? m[1] : lower.replace(/\.[^.]+$/, '')
      }
      for (const f of filtered) {
        const name = String(f.original_filename || f.name || '')
        const base = getBase(name)
        if (!groups.has(base)) groups.set(base, { files: [] })
        groups.get(base)!.files.push(f)
      }
      const tilesGrouped: Array<{ tile: Tile; ord?: number; ts?: number }> = []
      for (const [base, g] of groups.entries()) {
        const byVar = (variant: string) => g.files.find((x: any) => new RegExp(`_${variant}\\.`, 'i').test(String(x.original_filename || x.name || '')))
        const original = g.files.find((x: any) => !/_((large|medium|small|thumbnail))\./i.test(String(x.original_filename || x.name || '')))
        const large = byVar('large'); const medium = byVar('medium'); const small = byVar('small'); const thumbnail = byVar('thumbnail')
        const chooseUrl = (f: any) => {
          if (!f) return null
          // Prefer DMAPI-provided URLs to avoid broken /api/serve redirects
          return f.public_url || f.url || f.signed_url || null
        }
        const thumb = chooseUrl(small) || chooseUrl(thumbnail) || chooseUrl(medium) || chooseUrl(original) || chooseUrl(large)
        const full = chooseUrl(original) || chooseUrl(large) || chooseUrl(medium) || chooseUrl(small) || chooseUrl(thumbnail)
        if (thumb && full) {
          const ord = [original, large, medium, small, thumbnail].map((x: any) => x?.metadata?.order).find((v) => typeof v === 'number') as number | undefined
          const tsStr = [original, large, medium, small, thumbnail].map((x: any) => x?.uploaded_at).find(Boolean) as string | undefined
          const ts = tsStr ? Date.parse(tsStr) : undefined
          tilesGrouped.push({ tile: { thumb, full, name: base }, ord, ts })
        }
      }
      // Sort by explicit order if present, else by recency
      tilesGrouped.sort((a, b) => {
        const ao = typeof a.ord === 'number'
        const bo = typeof b.ord === 'number'
        if (ao && bo) return (a.ord! - b.ord!)
        if (ao && !bo) return -1
        if (!ao && bo) return 1
        const at = a.ts || 0
        const bt = b.ts || 0
        return bt - at
      })
      tiles = tilesGrouped.map((x) => x.tile)
    } catch {}
    // Fallback to public folder listing if metadata path is empty
    if (!tiles.length) {
      const folder = await listBucketFolder({ bucketId: 'castingly-public', userId: String(actorId), path: `actors/${actorId}/headshots` })
      const files = Array.isArray((folder as any)?.files) ? (folder as any).files : []
      const picked = pickTiles(files, String(actorId))
      // Validate fallback tiles quickly with a HEAD request (short timeout) and cache successes
      const validated: Tile[] = []
      await Promise.all(
        picked.map(async (t) => {
          try {
            const ok = await headOk(t.thumb)
            if (ok) validated.push(t)
          } catch {}
        })
      )
      tiles = validated
    }
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
