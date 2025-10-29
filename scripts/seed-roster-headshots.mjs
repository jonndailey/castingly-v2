#!/usr/bin/env node
// Seed public-ready headshots for demo roster actors by uploading a placeholder
// image to DMAPI as a headshot (DMAPI will auto-generate a small public variant).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function coreLogin({ coreUrl, appSlug, email, password }) {
  const res = await fetch(`${coreUrl.replace(/\/$/, '')}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': appSlug },
    body: JSON.stringify({ email, password, app_slug: appSlug }),
  })
  const j = await res.json().catch(()=>null)
  if (!res.ok || !j?.access_token) throw new Error(`Core login failed: ${res.status}`)
  return j.access_token
}

async function fetchBuffer(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`fetch ${url} failed ${r.status}`)
  const ab = await r.arrayBuffer()
  return Buffer.from(ab)
}

async function dmapiUpload({ dmapiBase, token, userId, name, imageBuf }) {
  const form = new FormData()
  const filename = `headshot_${Date.now()}.png`
  form.append('file', new Blob([imageBuf]), filename)
  form.append('bucket_id', 'castingly-private')
  form.append('folder_path', `actors/${userId}/headshots`)
  form.append('app_id', 'castingly')
  form.append('metadata', JSON.stringify({
    category: 'headshot',
    tags: ['headshot'],
    access: 'private',
    bucketId: 'castingly-private',
    folderPath: `actors/${userId}/headshots`,
    source: 'seed',
    displayName: name,
  }))
  const res = await fetch(`${dmapiBase.replace(/\/$/, '')}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const j = await res.json().catch(()=>null)
  if (!res.ok) throw new Error(`upload failed ${res.status}: ${j?.error || ''}`)
  return j
}

async function main() {
  // Defaults can be overridden via env
  const CORE = process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'https://core.dailey.cloud'
  const APP = process.env.DMAPI_APP_ID || 'castingly'
  const DMAPI_BASE = process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || 'https://media.dailey.cloud'
  const SVC_EMAIL = process.env.DMAPI_SERVICE_EMAIL || 'dmapi-service@castingly.com'
  const SVC_PASS = process.env.DMAPI_SERVICE_PASSWORD || 'castingly_dmapi_service_2025'

  // Core token for DMAPI upload
  const token = await coreLogin({ coreUrl: CORE, appSlug: APP, email: SVC_EMAIL, password: SVC_PASS })

  // Query DB for recent roster demo actors
  const mysql = await import('mysql2/promise')
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    user: process.env.DB_USER || 'castingly_app',
    password: process.env.DB_PASSWORD || 'changeme',
    database: process.env.DB_NAME || 'castingly',
  }
  const conn = await mysql.createConnection(cfg)
  const [rows] = await conn.execute("SELECT id,name,email FROM users WHERE email LIKE 'roster%.demo@castingly.com' ORDER BY created_at DESC LIMIT 12")
  await conn.end()
  const actors = rows.map(r => ({ id: String(r.id), name: String(r.name || 'Actor') }))

  let uploaded = 0
  for (const a of actors) {
    try {
      // Generate a simple avatar image from ui-avatars for determinism
      const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&size=512&background=6366f1&color=fff&bold=true`
      const buf = await fetchBuffer(url)
      await dmapiUpload({ dmapiBase: DMAPI_BASE, token, userId: a.id, name: a.name, imageBuf: buf })
      uploaded++
      console.log('Uploaded headshot for', a.name, a.id)
    } catch (e) {
      console.error('Failed for', a.name, e?.message || e)
    }
  }
  console.log('Done. Uploaded:', uploaded)
}

main().catch((e) => { console.error(e); process.exit(1) })

