#!/usr/bin/env node
/**
 * Backfill users.avatar_url for actors from DMAPI headshots.
 *
 * Usage:
 *   MIGRATION_ENV=.env.production node scripts/backfill-avatars.mjs [--force] [--id <userId>]
 *
 * Behavior:
 *   - Authenticates a DMAPI service user via Dailey Core
 *   - For each actor (or the specified id), lists bucket folder
 *     castingly-public at path actors/<id>/headshots (scoped under userId)
 *   - Picks a best file (large → medium → small → first)
 *   - Writes a short proxy URL to users.avatar_url
 */

import 'dotenv/config'
import mysql from 'mysql2/promise'

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const idIdx = args.indexOf('--id')
const ONLY_ID = idIdx >= 0 ? String(args[idIdx + 1] || '') : ''

// Load env from MIGRATION_ENV if provided
if (process.env.MIGRATION_ENV) {
  const { config } = await import('dotenv')
  config({ path: process.env.MIGRATION_ENV })
}

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'castingly'

const DMAPI_BASE_URL = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || 'http://localhost:4100').replace(/\/$/, '')
const CORE_URL = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'http://localhost:3002').replace(/\/$/, '')
const APP_ID = process.env.DMAPI_APP_ID || 'castingly'
const APP_SLUG = process.env.DMAPI_APP_SLUG || APP_ID
const SERVICE_EMAIL = process.env.DMAPI_SERVICE_EMAIL || process.env.DMAPI_MIGRATION_EMAIL || process.env.DAILEY_CORE_ADMIN_EMAIL
const SERVICE_PASSWORD = process.env.DMAPI_SERVICE_PASSWORD || process.env.DMAPI_MIGRATION_PASSWORD || process.env.DAILEY_CORE_ADMIN_PASSWORD

if (!SERVICE_EMAIL || !SERVICE_PASSWORD) {
  console.error('DMAPI service credentials missing. Set DMAPI_SERVICE_EMAIL and DMAPI_SERVICE_PASSWORD.')
  process.exit(1)
}

async function coreLogin() {
  const payload = { email: SERVICE_EMAIL, password: SERVICE_PASSWORD, app_slug: APP_SLUG }
  const baseHeaders = { 'Content-Type': 'application/json', 'User-Agent': 'Castingly/BackfillAvatars' }
  // Try without X-Client-Id first (avoids Invalid application on some setups)
  let resp = await fetch(`${CORE_URL}/auth/login`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(payload)
  })
  if (!resp.ok) {
    // Retry with X-Client-Id header
    resp = await fetch(`${CORE_URL}/auth/login`, {
      method: 'POST',
      headers: { ...baseHeaders, 'X-Client-Id': APP_ID },
      body: JSON.stringify(payload)
    })
  }
  if (!resp.ok) {
    let body = null
    try { body = await resp.json() } catch {}
    throw new Error(`Core login failed: ${resp.status} ${body?.error || body?.message || ''}`)
  }
  const data = await resp.json()
  const token = data?.access_token
  if (!token) throw new Error('Core login missing access_token')
  return token
}

async function listHeadshots(token, userId) {
  const path = `${userId}/actors/${userId}/headshots`
  const url = `${DMAPI_BASE_URL}/api/buckets/${encodeURIComponent('castingly-public')}/files?app_id=${encodeURIComponent(APP_ID)}&path=${encodeURIComponent(path)}`
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Client-Id': APP_SLUG,
      'User-Agent': 'Castingly/BackfillAvatars',
    },
  })
  if (!resp.ok) {
    return { files: [] }
  }
  try {
    const data = await resp.json()
    return Array.isArray(data?.files) ? { files: data.files } : { files: [] }
  } catch {
    return { files: [] }
  }
}

function pickBestFile(files) {
  if (!Array.isArray(files) || files.length === 0) return null
  const byName = (re) => files.find((f) => re.test(String(f?.name || '')))
  return byName(/large\./i) || byName(/medium\./i) || byName(/small\./i) || files[0]
}

function buildProxyUrl(userId, filename) {
  const qs = new URLSearchParams()
  qs.set('bucket', 'castingly-public')
  qs.set('userId', String(userId))
  qs.set('path', `actors/${userId}/headshots`)
  qs.set('name', String(filename))
  return `/api/media/proxy?${qs.toString()}`
}

async function main() {
  console.log('Backfilling avatar_url from DMAPI headshots…')
  const token = await coreLogin()
  const pool = await mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  })

  const where = ONLY_ID ? 'u.id = ?' : FORCE ? "u.role='actor'" : "u.role='actor' AND (u.avatar_url IS NULL OR u.avatar_url='' OR u.avatar_url LIKE 'https://ui-avatars.com/%' OR u.avatar_url LIKE '/api/media/avatar%')"
  const params = ONLY_ID ? [ONLY_ID] : []
  const [rows] = await pool.execute(
    `SELECT u.id, u.email, u.avatar_url FROM users u WHERE ${where} ORDER BY u.id ASC`,
    params
  )
  const users = rows || []
  console.log(`Scanning ${users.length} actor(s)…`)

  let updated = 0
  for (const row of users) {
    const uid = String(row.id)
    try {
      const list = await listHeadshots(token, uid)
      const best = pickBestFile(list.files)
      if (!best || !best.name) {
        continue
      }
      const proxy = buildProxyUrl(uid, best.name)
      await pool.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [proxy, uid])
      updated++
      if (updated % 25 === 0) console.log(`Updated ${updated}… last id=${uid}`)
    } catch (e) {
      console.warn(`Skip id=${uid}:`, e?.message || e)
    }
  }

  await pool.end()
  console.log(`Done. Updated ${updated} record(s).`)
}

main().catch((e) => {
  console.error('Backfill failed:', e)
  process.exit(1)
})
