#!/usr/bin/env node
// DMAPI public headshots cleaner (safe dry-run by default)
// - Lists castingly-public/actors/:actorId/headshots
// - HEAD-checks each /api/serve URL
// - Reports broken/junk; optionally deletes broken/junk items
//
// Usage (dry run):
//   ACTOR_ID='1cf9-...' DMAPI_BASE_URL='https://media.dailey.cloud' \
//   DAILEY_CORE_AUTH_URL='https://core.dailey.cloud' \
//   DMAPI_SERVICE_EMAIL='dmapi-service@castingly.com' \
//   DMAPI_SERVICE_PASSWORD='...' \
//   node tools/dmapi-clean-headshots.mjs
// Apply deletes:
//   ACTOR_ID='...' DELETE=1 node tools/dmapi-clean-headshots.mjs

import fs from 'fs'
import path from 'path'

const ACTOR_ID = process.env.ACTOR_ID || process.env.USER_ID || ''
if (!ACTOR_ID) { console.error('ACTOR_ID is required'); process.exit(1) }

const DMAPI_BASE = (process.env.DMAPI_BASE_URL || 'https://media.dailey.cloud').replace(/\/$/, '')
const CORE = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || '').replace(/\/$/, '')
const APP = process.env.DMAPI_APP_SLUG || process.env.DMAPI_APP_ID || 'castingly'
const EMAIL = process.env.DMAPI_SERVICE_EMAIL
const PASSWORD = process.env.DMAPI_SERVICE_PASSWORD
const DO_DELETE = process.env.DELETE === '1'
const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'dmapi-clean')
await fs.promises.mkdir(OUT_DIR, { recursive: true }).catch(() => {})

async function auth() {
  if (!CORE || !EMAIL || !PASSWORD) throw new Error('Missing CORE/EMAIL/PASSWORD envs')
  const res = await fetch(`${CORE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': APP },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, app_slug: APP })
  })
  if (!res.ok) throw new Error('Auth failed')
  const j = await res.json(); if (!j.access_token) throw new Error('No token')
  return j.access_token
}

async function dmapi(pathname, token, init={}) {
  const res = await fetch(`${DMAPI_BASE}${pathname}`, { ...init, headers: { ...(init.headers||{}), Authorization: `Bearer ${token}`, 'X-Client-Id': APP } })
  if (!res.ok) throw new Error(`${pathname} ${res.status}`)
  try { return await res.json() } catch { return null }
}

async function headOK(url) {
  const controller = new AbortController(); const t = setTimeout(()=>controller.abort(), 800)
  try { const r = await fetch(url, { method: 'HEAD', signal: controller.signal }); clearTimeout(t); return r.ok && (r.headers.get('content-type')||'').toLowerCase().startsWith('image/') } catch { clearTimeout(t); return false }
}

function serveUrl(name) {
  const tail = `actors/${ACTOR_ID}/headshots/${encodeURIComponent(name)}`
  return `${DMAPI_BASE}/api/serve/files/${encodeURIComponent(ACTOR_ID)}/castingly-public/${tail}`
}

const token = await auth()
// List public folder
const sp = new URLSearchParams(); sp.set('app_id', APP); sp.set('path', `${ACTOR_ID}/actors/${ACTOR_ID}/headshots`)
const folder = await dmapi(`/api/buckets/${encodeURIComponent('castingly-public')}/files?${sp.toString()}`, token)
const files = Array.isArray(folder?.files) ? folder.files : []

const junkRe = /^(android-launchericon|maskable-icon|icon-\d+x\d+|app-logo|test[-_]?)/i
const report = { when: new Date().toISOString(), actorId: ACTOR_ID, total: files.length, checked: [], broken: [], junk: [], kept: [] }

for (const it of files) {
  const name = String(it?.name || '')
  if (!name) continue
  const url = serveUrl(name)
  const isJunk = junkRe.test(name)
  let ok = false
  if (!isJunk) ok = await headOK(url)
  const rec = { name, url, ok, isJunk, id: it?.id || null }
  report.checked.push(rec)
  if (isJunk) report.junk.push(rec)
  else if (!ok) report.broken.push(rec)
  else report.kept.push(rec)
}

const outPath = path.join(OUT_DIR, `${ACTOR_ID}.json`)
await fs.promises.writeFile(outPath, JSON.stringify(report, null, 2), 'utf8')
console.log(`Dry report written: ${outPath}`)

if (DO_DELETE) {
  const toDelete = [...report.junk, ...report.broken]
  console.log(`Deleting ${toDelete.length} items…`)
  for (const r of toDelete) {
    try {
      if (r.id) {
        await dmapi(`/api/files/${encodeURIComponent(r.id)}`, token, { method: 'DELETE' })
        console.log('Deleted by id:', r.name)
      } else {
        // Attempt metadata search by name to resolve id and delete
        const q = new URLSearchParams(); q.set('app_id', APP); q.set('limit', '50'); q.set('user_id', ACTOR_ID); q.append('metadata[category]', 'headshot')
        const listed = await dmapi(`/api/files?${q.toString()}`, token)
        const maybe = (listed?.files||[]).find(f => String(f.original_filename||'') === r.name)
        if (maybe?.id) {
          await dmapi(`/api/files/${encodeURIComponent(maybe.id)}`, token, { method: 'DELETE' })
          console.log('Deleted by lookup:', r.name)
        } else {
          console.log('Skip delete (no id):', r.name)
        }
      }
    } catch (e) { console.log('Delete failed:', r.name, String(e&&e.message||e)) }
  }
}

