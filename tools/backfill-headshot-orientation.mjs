#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

// Config
const DMAPI_BASE = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || 'https://media.dailey.cloud').replace(/\/$/, '')
const CORE_BASE = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'https://core.dailey.cloud').replace(/\/$/, '')
const APP = process.env.DMAPI_APP_SLUG || process.env.DMAPI_APP_ID || 'castingly'
const EMAIL = process.env.DMAPI_SERVICE_EMAIL
const PASSWORD = process.env.DMAPI_SERVICE_PASSWORD
const DRY = process.env.DRY === '1'
const DELETE_EXISTING = process.env.DELETE_EXISTING === '1'
const WIDTH = parseInt(process.env.SMALL_WIDTH || '384', 10)
const QUALITY = parseInt(process.env.WEBP_QUALITY || '82', 10)

const ONE_ACTOR = process.env.ACTOR_ID || process.env.USER_ID || ''
const LIMIT_ACTORS = parseInt(process.env.MAX_ACTORS || '0', 10)
const LIMIT_PER_ACTOR = parseInt(process.env.MAX_PER_ACTOR || '0', 10)

const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'backfill')
await fs.promises.mkdir(OUT_DIR, { recursive: true }).catch(() => {})

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

async function auth() {
  if (!EMAIL || !PASSWORD) throw new Error('Missing DMAPI service credentials')
  const res = await fetch(`${CORE_BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': APP },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, app_slug: APP })
  })
  if (!res.ok) throw new Error(`Core login failed ${res.status}`)
  const j = await res.json().catch(() => null)
  const token = j?.access_token
  if (!token) throw new Error('Missing access_token from Core')
  return token
}

async function dmapi(pathname, token, init={}) {
  const res = await fetch(`${DMAPI_BASE}${pathname}`, { ...init, headers: { ...(init.headers||{}), Authorization: `Bearer ${token}`, 'X-Client-Id': APP } })
  if (!res.ok) {
    let msg = `${res.status}`
    try { const j = await res.json(); msg = j?.error || j?.message || msg } catch {}
    throw new Error(`${pathname} ${msg}`)
  }
  try { return await res.json() } catch { return null }
}

function isVariantName(name) {
  const n = String(name || '')
  return /_(small|medium|large|thumbnail)(?=\.[^.]+$)/i.test(n)
}

function baseName(name) {
  const n = String(name || '')
  const m = n.toLowerCase().match(/^(.*?)(?:_(small|medium|large|thumbnail))?(\.[^.]+)$/)
  if (!m) return n.replace(/\.[^.]+$/, '')
  return m[1]
}

async function listActorHeadshotOriginals(token, actorId) {
  // Prefer private originals under castingly-private/actors/:id/headshots
  const sp = new URLSearchParams()
  sp.set('app_id', APP)
  sp.set('path', `${actorId}/actors/${actorId}/headshots`)
  const data = await dmapi(`/api/buckets/${encodeURIComponent('castingly-private')}/files?${sp.toString()}`, token)
  const files = Array.isArray(data?.files) ? data.files : []
  return files.filter((f) => {
    const name = String(f?.name || f?.original_filename || '')
    if (!name) return false
    const lower = name.toLowerCase()
    if (!/\.(jpe?g|png|webp)$/i.test(lower)) return false
    return !isVariantName(lower)
  })
}

async function listPublicSmallVariants(token, actorId) {
  const sp = new URLSearchParams()
  sp.set('app_id', APP)
  sp.set('path', `${actorId}/actors/${actorId}/headshots`)
  const data = await dmapi(`/api/buckets/${encodeURIComponent('castingly-public')}/files?${sp.toString()}`, token)
  const files = Array.isArray(data?.files) ? data.files : []
  return files.filter((f) => /_(small|thumbnail)\.(webp|jpe?g|png)$/i.test(String(f?.name || '')))
}

async function ensureSmall(token, actorId, file) {
  const name = String(file?.name || file?.original_filename || '')
  const b = baseName(name)
  const smallName = `${b}_small.webp`

  // Optionally delete existing smalls/thumbs
  if (DELETE_EXISTING) {
    try {
      const existing = await listPublicSmallVariants(token, actorId)
      const matches = existing.filter((f) => baseName(f.name) === b)
      for (const m of matches) {
        if (DRY) { console.log('[dry] delete', actorId, m.name) }
        else {
          await dmapi(`/api/files/${encodeURIComponent(String(m.id || ''))}`, token, { method: 'DELETE' })
          await sleep(50)
        }
      }
    } catch (e) { console.log('delete existing smalls failed:', e?.message || e) }
  }

  // Download original via signed_url/public_url
  const srcUrl = String(file?.signed_url || file?.public_url || file?.url || '')
  if (!srcUrl) { throw new Error('missing source URL') }
  const buf = await fetch(srcUrl).then((r) => r.arrayBuffer()).then((a) => Buffer.from(a))
  // Rotate per EXIF and resize
  const out = await sharp(buf).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer()

  if (DRY) {
    console.log('[dry] would upload', smallName, 'bytes=', out.length)
    return { ok: true, name: smallName, dry: true }
  }

  // Upload to public bucket under headshots
  const form = new FormData()
  const blob = new Blob([out], { type: 'image/webp' })
  const fileObj = new File([blob], smallName, { type: 'image/webp' })
  form.append('file', fileObj)
  form.append('bucket_id', 'castingly-public')
  form.append('folder_path', `actors/${actorId}/headshots`)
  form.append('app_id', APP)
  const metadata = { category: 'headshot', tags: ['headshot'], access: 'public', bucketAccess: 'public', bucketId: 'castingly-public', folderPath: `actors/${actorId}/headshots`, source: 'castingly', sourceActorId: String(actorId) }
  form.append('metadata', JSON.stringify(metadata))
  const res = await fetch(`${DMAPI_BASE}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await authToken}`, 'X-Client-Id': APP },
    body: form,
  })
  if (!res.ok) {
    let msg = `${res.status}`
    try { const j = await res.json(); msg = j?.error || j?.message || msg } catch {}
    throw new Error(`upload failed: ${msg}`)
  }
  return { ok: true, name: smallName }
}

let authToken = null

async function main() {
  authToken = await auth()

  // Build actor list
  let actorIds = []
  if (ONE_ACTOR) {
    actorIds = [ONE_ACTOR]
  } else {
    // Prefer known beta actors list if present unless IGNORE_LOCAL_LIST=1
    const mapPath = path.join(process.cwd(), 'artifacts', 'provision', 'beta-actors-core.json')
    const useLocal = process.env.IGNORE_LOCAL_LIST !== '1'
    if (useLocal) {
      try {
        const raw = await fs.promises.readFile(mapPath, 'utf8')
        const arr = JSON.parse(raw)
        actorIds = arr.map((x) => x.id).filter(Boolean)
      } catch {}
    }
    if (actorIds.length === 0) {
      // Fallback to scanning DMAPI for users with headshots (may be large)
      const scan = await dmapi(`/api/files?app_id=${APP}&limit=500&metadata[category]=headshot`, authToken)
      const files = Array.isArray(scan?.files) ? scan.files : []
      const set = new Set(files.map((f) => String(f?.user_id || '')).filter(Boolean))
      actorIds = Array.from(set)
    }
  }
  if (LIMIT_ACTORS && actorIds.length > LIMIT_ACTORS) actorIds = actorIds.slice(0, LIMIT_ACTORS)

  const summary = { when: new Date().toISOString(), actors: [], totals: { actors: actorIds.length, processed: 0, uploaded: 0, skipped: 0, errors: 0 } }
  for (const actorId of actorIds) {
    try {
      const originals = await listActorHeadshotOriginals(authToken, actorId)
      let count = 0
      let uploaded = 0
      const items = []
      for (const f of originals) {
        if (LIMIT_PER_ACTOR && count >= LIMIT_PER_ACTOR) break
        const n = String(f?.name || f?.original_filename || '')
        count++
        try {
          const r = await ensureSmall(authToken, actorId, f)
          uploaded += r?.ok ? 1 : 0
          items.push({ name: n, small: r?.name || null, ok: true })
        } catch (e) {
          summary.totals.errors++
          items.push({ name: n, ok: false, error: e?.message || String(e) })
        }
        await sleep(50)
      }
      summary.totals.processed += count
      summary.totals.uploaded += uploaded
      summary.actors.push({ actorId, count, uploaded })
    } catch (e) {
      summary.totals.errors++
      summary.actors.push({ actorId, error: e?.message || String(e) })
    }
  }
  const outPath = path.join(OUT_DIR, `headshot-orientation-${Date.now()}.json`)
  await fs.promises.writeFile(outPath, JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((e) => { console.error('backfill error:', e?.message || e); process.exit(1) })
