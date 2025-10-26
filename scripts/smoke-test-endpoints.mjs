#!/usr/bin/env node
import fs from 'fs'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'

// Load .env.local when present (Next dev), otherwise .env/.env.production
if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' })
else if (fs.existsSync('.env')) dotenv.config({ path: '.env' })
else dotenv.config()

const BASE = process.env.NEXT_PUBLIC_APP_URL || `http://127.0.0.1:${process.env.PORT || 3000}`
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function log(section, message) {
  console.log(`\n== ${section} ==`)
  console.log(message)
}

async function httpJson(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, init)
  const text = await res.text()
  let body = null
  try { body = JSON.parse(text) } catch {}
  return { status: res.status, body, raw: text }
}

async function run() {
  console.log('Castingly endpoint smoke test')
  console.log(`Base: ${BASE}`)

  // 1) Health
  const health = await httpJson('/api/admin/system/health')
  log('Health', `HTTP ${health.status} / status=${health.body?.status}`)

  // 2) Resolve actor id: prefer explicit ACTOR_ID, else DB (unless SKIP_DB), else list API
  let actorId = process.env.ACTOR_ID
  if (!actorId) {
    const skipDb = String(process.env.SKIP_DB || '').toLowerCase() === '1'
    if (!skipDb) {
      try {
        const db = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 3306),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'castingly',
        })
        const [rows] = await db.execute(
          `SELECT id FROM users WHERE role='actor' ORDER BY created_at DESC LIMIT 1`
        )
        await db.end()
        if (Array.isArray(rows) && rows.length > 0) {
          actorId = rows[0].id
        }
      } catch (e) {
        log('Actor Lookup (DB)', `Skipping DB lookup: ${e.message}`)
      }
    }
    if (!actorId) {
      const list = await httpJson('/api/actors?limit=5')
      actorId = Array.isArray(list.body?.actors) && list.body.actors[0]?.id
    }
  }
  if (!actorId) {
    // Dev fallback: probe actor endpoint with a random UUID to verify minimal profile path
    actorId = (await import('crypto')).randomUUID()
    log('Actor Lookup', `No actor from DB/API; using random id ${actorId}`)
  }

  // Use bearer token if provided (TOKEN), else sign a local dev JWT for non-Core local servers
  const token = process.env.TOKEN || jwt.sign({ id: actorId, email: 'smoke@test', role: 'actor' }, JWT_SECRET, { expiresIn: '1h' })
  log('Actor', `Testing actorId=${actorId}`)

  // 3) Actor details
  const actorAuth = await httpJson(`/api/actors/${encodeURIComponent(actorId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const hsCountAuth = Array.isArray(actorAuth.body?.media?.headshots) ? actorAuth.body.media.headshots.length : 0
  log('GET /api/actors/:id (auth)', `HTTP ${actorAuth.status} / headshots=${hsCountAuth}`)

  const actorNoAuth = await httpJson(`/api/actors/${encodeURIComponent(actorId)}`)
  const hsCountNo = Array.isArray(actorNoAuth.body?.media?.headshots) ? actorNoAuth.body.media.headshots.length : 0
  log('GET /api/actors/:id (no auth)', `HTTP ${actorNoAuth.status} / headshots=${hsCountNo}`)

  // 4) Forum activity (requires x-user headers)
  const forum = await httpJson(`/api/forum/activity/${encodeURIComponent(actorId)}?limit=5`, {
    headers: { 'x-user-id': actorId, 'x-user-role': 'actor' }
  })
  const posts = Array.isArray(forum.body?.posts) ? forum.body.posts.length : 0
  const replies = Array.isArray(forum.body?.replies) ? forum.body.replies.length : 0
  log('GET /api/forum/activity/:id', `HTTP ${forum.status} / posts=${posts} replies=${replies}`)
}

run().catch((err) => {
  console.error('Smoke test failed:', err?.message || err)
  process.exit(1)
})
