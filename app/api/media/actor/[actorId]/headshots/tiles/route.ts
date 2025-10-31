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
      let files = Array.isArray(listed?.files) ? listed.files : []
      
      // CRITICAL: Filter files to only those that actually belong to this actor
      // DMAPI might return files from other users, so we must validate
      const validFiles = files.filter((f: any) => {
        // Check if the file's metadata or URL indicates it belongs to this actor
        const meta = f.metadata || {}
        const sourceId = meta.sourceActorId || meta.source_actor_id || meta.userId || meta.user_id
        
        // If we have a sourceActorId, it must match
        if (sourceId && String(sourceId) !== String(actorId)) {
          console.log('[tiles/headshots] Filtering out file from wrong actor:', sourceId, '!=', actorId)
          return false
        }
        
        // Also check if the URL contains the wrong actor ID (947d2a5c pattern)
        const urlStr = String(f.url || f.thumbnail_url || f.public_url || '')
        if (urlStr && urlStr.includes('947d2a5c') && actorId !== '947d2a5c-aedc-11f0-95c0-fa163e24cb3c') {
          console.log('[tiles/headshots] Filtering out file with wrong actor in URL')
          return false
        }
        
        return true
      })
      
      console.log('[tiles/headshots] Filtered', files.length, 'files to', validFiles.length, 'for actor', actorId)
      files = validFiles
      
      // Process validated files
      const mapped: Tile[] = []
      const b = baseUrl() || 'https://media.dailey.cloud'
      for (const f of files) {
        const meta = (f as any)?.metadata || {}
        const bucketId = String(meta.bucketId || meta.bucket_id || '').toLowerCase()
        const folderPathRaw = String(meta.folderPath || meta.folder_path || '')
        const origName = String((f.original_filename || (f as any).name || '').toString())
        const isJunk = /^(android-launchericon|maskable-icon|icon-\d+x\d+|app-logo|test[-_]?)/i.test(origName)
        if (isJunk) continue
        let serveThumb: string | null = null
        let serveFull: string | null = null
        if (b && origName) {
          // Always try to construct /api/serve URL for public assets
          // IMPORTANT: Always use the correct path structure for headshots
          const effectiveBucket = bucketId || 'castingly-public'
          // For headshots, the path MUST be actors/[actorId]/headshots/
          const properPath = `actors/${String(actorId)}/headshots/`
          // Prefer /api/serve (edge cached) for public assets
          const serveUrl = `${b}/api/serve/files/${encodeURIComponent(String(actorId))}/${effectiveBucket}/${properPath}${encodeURIComponent(origName)}`
          serveThumb = serveUrl
          serveFull = serveUrl
        }
        let rawThumb = (f.thumbnail_url as string) || (f.public_url as string) || (f.url as string) || null
        let rawFull = (f.url as string) || (f.public_url as string) || (f.thumbnail_url as string) || null
        // If URLs point at raw storage, attempt to synthesize a /api/serve URL from their path
        const synthServe = (u?: string | null) => {
          try {
            if (!u) return null
            // Extract just the filename from the URL
            const filename = u.split('/').pop()
            if (!filename || !b) return null
            // Always use proper headshot path structure
            return `${b}/api/serve/files/${encodeURIComponent(String(actorId))}/castingly-public/actors/${String(actorId)}/headshots/${encodeURIComponent(filename)}`
          } catch { return null }
        }
        // Synthesize serve URLs if needed
        if (!serveThumb) serveThumb = synthServe(rawThumb)
        if (!serveFull) serveFull = synthServe(rawFull)
        
        const isRawHost = (u?: string | null) => {
          try { if (!u) return false; const h = new URL(u).host; return /(^|\.)s3\.|amazonaws\.com|\.ovh\./i.test(h) } catch { return false }
        }
        const thumb = serveThumb || (rawThumb && !isRawHost(rawThumb) ? rawThumb : null)
        const full = serveFull || (rawFull && !isRawHost(rawFull) ? rawFull : null)
        // Only add tiles with both thumb and full URLs, and neither can be raw storage
        if (thumb && full && !isRawHost(thumb) && !isRawHost(full)) {
          mapped.push({ thumb, full, name: origName || 'Headshot' })
        }
      }
      tiles = mapped
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
