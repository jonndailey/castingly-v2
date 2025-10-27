#!/usr/bin/env node
// Backfill DMAPI file metadata: category and sourceActorId
// Usage:
//   node scripts/backfill-media.mjs --user <actorId> [--dry]
//   node scripts/backfill-media.mjs --all [--dry]

import 'dotenv/config'

const DMAPI_BASE_URL = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || 'https://media.dailey.cloud').replace(/\/$/, '')
const CORE_URL = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'https://core.dailey.cloud').replace(/\/$/, '')
const DMAPI_APP_ID = process.env.DMAPI_APP_ID || 'castingly'
const DMAPI_APP_SLUG = process.env.DMAPI_APP_SLUG || DMAPI_APP_ID
const CORE_APP_SLUG = process.env.DAILEY_CORE_APP_SLUG || DMAPI_APP_SLUG
const SERVICE_EMAIL = process.env.DMAPI_SERVICE_EMAIL
const SERVICE_PASSWORD = process.env.DMAPI_SERVICE_PASSWORD

async function obtainServiceToken() {
  if (process.env.DMAPI_API_KEY) {
    // eslint-disable-next-line no-console
    console.log('[backfill] Using DMAPI_API_KEY for authorization')
    return process.env.DMAPI_API_KEY
  }
  if (!SERVICE_EMAIL || !SERVICE_PASSWORD) throw new Error('DMAPI service credentials missing')
  const res = await fetch(`${CORE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': CORE_APP_SLUG, 'User-Agent': 'Castingly/Backfill' },
    body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD, app_slug: CORE_APP_SLUG })
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j.error || `Core login failed (${res.status})`)
  }
  const j = await res.json()
  if (!j?.access_token) throw new Error('Missing access_token from Core')
  return j.access_token
}

async function serviceFetch(path, { method = 'GET', body, headers = {}, token, timeoutMs } = {}) {
  const controller = new AbortController()
  const to = timeoutMs || (method === 'GET' ? 4500 : 12000)
  const t = setTimeout(() => controller.abort(), to)
  try {
    const useApiKey = token && token.startsWith('dmapi_')
    const authHeaders = useApiKey
      ? { 'X-API-Key': token }
      : { Authorization: `Bearer ${token}` }
    const res = await fetch(`${DMAPI_BASE_URL}${path}`, {
      method,
      body,
      headers: { ...authHeaders, 'X-Client-Id': DMAPI_APP_SLUG, 'User-Agent': 'Castingly/Backfill', ...headers },
      signal: controller.signal
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || j.message || `DMAPI error (${res.status})`)
    }
    if (res.status === 204) return null
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

async function listFiles({ limit = 250, offset = 0, userId, includeAppId = false } = {}) {
  const token = await obtainServiceToken()
  const sp = new URLSearchParams()
  if (!includeAppId) sp.set('app_id', DMAPI_APP_ID)
  if (limit) sp.set('limit', String(limit))
  if (offset) sp.set('offset', String(offset))
  if (userId) sp.set('user_id', String(userId))
  return await serviceFetch(`/api/files?${sp.toString()}`, { token, method: 'GET', timeoutMs: 5000 })
}

async function updateFileMetadata(fileId, metadata) {
  const token = await obtainServiceToken()
  const body = JSON.stringify({ metadata })
  await serviceFetch(`/api/files/${encodeURIComponent(fileId)}`, { token, method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body, timeoutMs: 10000 })
}

async function listBucketFolder(bucketId, userId, subpath) {
  const token = await obtainServiceToken()
  const sp = new URLSearchParams()
  sp.set('app_id', DMAPI_APP_ID)
  const normalizedPath = `${String(userId).replace(/\/+$/, '')}/${String(subpath || '').replace(/^\/+/, '')}`
  sp.set('path', normalizedPath)
  const data = await serviceFetch(`/api/buckets/${encodeURIComponent(bucketId)}/files?${sp.toString()}`, { token, method: 'GET', timeoutMs: 5000 })
  return Array.isArray(data?.files) ? data.files : []
}

function inferCategoryFromPath(path, name) {
  const p = String(path || '').toLowerCase()
  const n = String(name || '').toLowerCase()
  if (!p && !n) return null
  if (p.includes('/headshot') || n.includes('headshot')) return 'headshot'
  if (p.includes('/gallery')) return 'gallery'
  if (p.includes('/resume') || /\.(pdf|docx?)$/i.test(n)) return 'resume'
  if (p.includes('/reel') || /\.(mp4|mov|m4v|mpeg|mpg)$/i.test(n)) return 'reel'
  if (p.includes('self-tape') || p.includes('self_tape')) return 'self_tape'
  if (p.includes('voice') || /\.(mp3|wav|aac)$/i.test(n)) return 'voice_over'
  if (p.includes('/document')) return 'document'
  if (/\.(jpe?g|png|webp|gif)$/i.test(n)) return 'gallery'
  return null
}

function extractUserIdFromPath(path) {
  const p = String(path || '').trim()
  if (!p) return null
  const idx = p.toLowerCase().indexOf('actors/')
  if (idx >= 0) {
    const rest = p.slice(idx + 'actors/'.length)
    const parts = rest.split('/')
    if (parts[0]) return parts[0]
  }
  return null
}

async function run() {
  const args = process.argv.slice(2)
  const userIdx = args.indexOf('--user')
  const all = args.includes('--all')
  const dry = args.includes('--dry')
  const apiKeyIdx = args.indexOf('--api-key')
  if (apiKeyIdx >= 0) {
    process.env.DMAPI_API_KEY = args[apiKeyIdx + 1]
  }
  const userId = userIdx >= 0 ? args[userIdx + 1] : undefined

  if (!all && !userId) {
    console.error('Usage: --user <actorId> or --all [--dry]')
    process.exit(1)
  }

  let offset = 0
  const limit = 250
  let total = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  // Prefer direct bucket scans by path when userId is provided (covers private/public and missing metadata)
  const buckets = ['castingly-public', 'castingly-private']
  const subpaths = [
    'actors/<id>/headshots',
    'actors/<id>/gallery',
    'actors/<id>/reels',
    'actors/<id>/resumes',
    'actors/<id>/self-tapes',
    'actors/<id>/voice-over',
    'actors/<id>/documents'
  ]
  async function processFile(f, fallbackCat) {
    const meta = (f?.metadata || {})
    const folderPath = String(meta.folderPath || f.folder_path || '')
    const name = String(f.original_filename || f.name || '')
    const currentCategory = String(meta.category || '')
    const currentSource = meta.sourceActorId || meta.source_actor_id || null
    const inferredCategory = inferCategoryFromPath(folderPath, name) || fallbackCat
    const inferredUser = extractUserIdFromPath(folderPath) || String(f?.user_id || '') || userId || null
    const patch = { ...meta }
    if (inferredCategory && currentCategory.toLowerCase() !== inferredCategory) patch.category = inferredCategory
    if (inferredUser && String(currentSource || '') !== String(inferredUser)) patch.sourceActorId = String(inferredUser)
    const changed = (patch.category && patch.category !== currentCategory) || (patch.sourceActorId && String(patch.sourceActorId) !== String(currentSource || ''))
    total++
    if (!changed) { skipped++; return }
    if (!dry) await updateFileMetadata(String(f.id), patch)
    updated++
  }

  if (userId) {
    for (const b of buckets) {
      for (const raw of subpaths) {
        const sub = raw.replace('<id>', userId)
        const catHint = inferCategoryFromPath(sub, '')
        try {
          const files = await listBucketFolder(b, userId, sub)
          for (const f of files) {
            await processFile(f, catHint)
          }
        } catch (e) {
          // ignore
        }
      }
    }
  } else {
    // Fallback to paged file listing when iterating all users
    while (true) {
      const resp = await listFiles({ limit, offset, includeAppId: false })
      const files = Array.isArray(resp?.files) ? resp.files : []
      if (files.length === 0) break
      for (const f of files) await processFile(f, null)
      if (!resp?.pagination?.has_more) break
      offset += limit
    }
  }

  console.log(JSON.stringify({ ok: true, total, updated, skipped, errors, scope: userId ? { userId } : 'all', dry }, null, 2))
}

run().catch((e) => {
  console.error('Backfill failed:', e?.message || e)
  process.exit(1)
})
