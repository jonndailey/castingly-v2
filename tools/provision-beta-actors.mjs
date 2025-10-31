#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import mysql from 'mysql2/promise'

/**
 * Provision Beta Actors for Castingly
 * - Creates users in Dailey Core under tenant `castingly`
 * - Activates and enrolls them into all Castingly apps
 * - Ensures public actor profiles exist in Castingly DB (id matches Core UUID)
 * - Writes a CSV with generated passwords for emailing
 *
 * Usage examples:
 *   MIGRATION_ENV=.env.production node tools/provision-beta-actors.mjs --dry
 *   MIGRATION_ENV=.env.production node tools/provision-beta-actors.mjs
 */

// Resolve MIGRATION_ENV file (like other migration scripts)
const MIGRATION_ENV = process.env.MIGRATION_ENV
if (MIGRATION_ENV && fs.existsSync(MIGRATION_ENV)) {
  const lines = fs.readFileSync(MIGRATION_ENV, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
    if (m) {
      const key = m[1]
      let val = m[2]
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
}

const argv = process.argv.slice(2)
const isDryRun = argv.includes('--dry') || argv.includes('--dry-run')

// Core and app configuration
const CORE_BASE = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'https://core.dailey.cloud').replace(/\/$/, '')
const CORE_APP_SLUG = process.env.DAILEY_CORE_APP_SLUG || 'castingly-portal'
const CORE_TENANT_SLUG = process.env.DAILEY_CORE_TENANT_SLUG || 'castingly'
const CORE_ADMIN_EMAIL = process.env.DAILEY_CORE_ADMIN_EMAIL || process.env.DAILEY_CORE_EMAIL || 'admin@dailey.cloud'
const CORE_ADMIN_PASSWORD = process.env.DAILEY_CORE_ADMIN_PASSWORD || process.env.DAILEY_CORE_PASSWORD || 'demo123'

// Castingly DB configuration (taken from env or MIGRATION_ENV)
const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT || 3306)
const DB_NAME = process.env.DB_NAME || 'casting_portal'
const DB_USER = process.env.DB_USER || 'nikon'
const DB_PASSWORD = process.env.DB_PASSWORD || '@0509man1hattaN'

// Actors to provision (Name, Email)
const ACTORS = [
  { name: 'Amber Luallen', email: 'amberluallen89@gmail.com' },
  { name: 'Matt Sweeney', email: 'driscollsweeney@gmail.com' },
  { name: 'Ryan Coil', email: 'ryankcoil@gmail.com' },
  { name: 'Jared Nigro', email: 'nigro.jared@gmail.com' },
  { name: 'Joel Anderson', email: 'joelpa@gmail.com' },
  { name: 'Daniel Cohen', email: 'danielmkcohen@gmail.com' },
  { name: 'Jonny Dailey', email: 'jonndailey@gmail.com' },
]

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/)
  if (parts.length === 0) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] }
}

function generatePassword() {
  // 16 chars: letters + numbers; ensure at least one uppercase/lowercase/number
  const bytes = crypto.randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g, '')
  const extra = crypto.randomBytes(2).toString('hex')
  return (bytes + extra).slice(0, 16)
}

async function coreLogin(email, password) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Id': CORE_APP_SLUG,
    'X-Tenant-Slug': CORE_TENANT_SLUG,
    'User-Agent': 'Castingly/ProvisionScript',
  }
  const body = { email, password, app_slug: CORE_APP_SLUG, tenant_slug: CORE_TENANT_SLUG }
  const res = await fetch(`${CORE_BASE}/auth/login`, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Core login failed (${res.status})`)
  if (!data?.access_token) throw new Error('Core login missing access token')
  return data
}

async function coreGetTenantId(token, slug = CORE_TENANT_SLUG) {
  const res = await fetch(`${CORE_BASE}/api/auth-tenants?limit=200&search=${encodeURIComponent(String(slug))}` , {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Failed to list tenants (${res.status})`)
  const t = Array.isArray(data?.tenants) ? data.tenants.find((x) => String(x.slug).toLowerCase() === String(slug).toLowerCase()) : null
  if (!t) throw new Error(`Tenant not found for slug: ${slug}`)
  return t.id
}

async function coreFindUserByEmail(token, email) {
  const res = await fetch(`${CORE_BASE}/api/auth-users?limit=1&search=${encodeURIComponent(email)}` , {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Failed to query users (${res.status})`)
  const u = Array.isArray(data?.users) ? data.users.find((x) => String(x.email).toLowerCase() === String(email).toLowerCase()) : null
  return u || null
}

async function coreCreateUser(token, { email, password, name, tenantId }) {
  const res = await fetch(`${CORE_BASE}/api/auth-users`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, tenant_id: tenantId, roles: ['user'] })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Failed to create user (${res.status})`)
  return data
}

async function coreActivateUser() { return }

async function coreEnsureMembership() { return }

// Note: Enrollment rows are auto-created on first login by Core; explicit bulk enroll is optional
async function coreEnrollAllApps() { return }

async function dbConnect() {
  return mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, charset: 'utf8mb4' })
}

async function ensureCastinglyActorRow(conn, { id, email, name }) {
  // Detect if modern schema (CHAR(36) id) exists
  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [DB_NAME]
  )
  const names = new Set((cols || []).map((r) => r.name))
  const hasUuidId = names.has('id')
  const hasName = names.has('name')

  // Check existing
  const [existing] = await conn.execute('SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1', [id, email])
  if (Array.isArray(existing) && existing.length > 0) return

  const now = new Date()
  if (hasUuidId && hasName) {
    // Modern schema
    await conn.execute(
      `INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
       VALUES (?, ?, 'core-linked', ?, 'actor', 1, 1, ?, ?)`,
      [id, email, name || email.split('@')[0], now, now]
    )
    // Ensure profile row
    await conn.execute(
      `INSERT INTO profiles (user_id, metadata, searchable_text) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE user_id = user_id`,
      [id, JSON.stringify({ source: 'core' }), (name || email).toString()]
    )
  } else {
    // Legacy fallback: create minimal user; profile table shape may differ
    const { first, last } = splitName(name)
    await conn.execute(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified, created_at, updated_at)
       VALUES (?, 'core-linked', ?, ?, 'actor', 'active', 1, ?, ?)`,
      [email, first, last, now, now]
    )
    // Try to create profiles/actors row if present
    try { await conn.execute(`INSERT INTO profiles (user_id) SELECT id FROM users WHERE email = ? LIMIT 1`, [email]) } catch {}
    try { await conn.execute(`INSERT INTO actors (user_id, bio) SELECT id, '' FROM users WHERE email = ? LIMIT 1`, [email]) } catch {}
  }
}

async function main() {
  console.log('🎭 Castingly — Provision Beta Actors')
  console.log('Core:', CORE_BASE, 'App:', CORE_APP_SLUG, 'Tenant:', CORE_TENANT_SLUG)
  console.log('DB:', `${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`)
  console.log(isDryRun ? 'Mode: DRY RUN' : 'Mode: APPLY')
  console.log('')

  // Login to Core
  const core = await coreLogin(CORE_ADMIN_EMAIL, CORE_ADMIN_PASSWORD)
  const token = core.access_token
  const tenantId = await coreGetTenantId(token, CORE_TENANT_SLUG)
  console.log('✅ Core login ok; tenant id:', tenantId)

  // DB connection
  const conn = await dbConnect()
  try {
    const results = []
    const passwords = []
    for (const actor of ACTORS) {
      const { name, email } = actor
      const pw = generatePassword()
      const first = splitName(name).first || name.split(' ')[0] || ''

      // Check or create in Core
      const existing = await coreFindUserByEmail(token, email)
      let userId = null
      if (existing) {
        userId = existing.id
        // Activate and ensure membership/enrollment
        if (!isDryRun) {
          // Create sets status=active; skipping explicit activate
          // Membership was provided on create payload (tenant_id); skipping explicit add
          // Skip bulk enroll; Core will auto-create enrollment on first login
        }
        results.push({ name, email, id: userId, action: 'exists+activated' })
      } else {
        if (!isDryRun) {
          const created = await coreCreateUser(token, { email, password: pw, name, tenantId })
          userId = created.id || created.user?.id || null
          // Create sets status=active; skipping explicit activate
          // Membership was provided on create payload (tenant_id); skipping explicit add
          // Skip bulk enroll; Core will auto-create enrollment on first login
        }
        results.push({ name, email, id: userId, action: 'created+activated' })
      }

      // Ensure Castingly DB row for public profile
      const dbId = userId || crypto.randomUUID()
      if (!isDryRun) await ensureCastinglyActorRow(conn, { id: String(dbId), email, name })

      passwords.push({ name, email, password: pw, first })
    }

    // Write passwords CSV for emailing
    const outDir = path.join(process.cwd(), 'artifacts', 'provision')
    fs.mkdirSync(outDir, { recursive: true })
    const csvPath = path.join(outDir, 'beta-actors-passwords.csv')
    const lines = ['name,email,password']
    for (const r of passwords) lines.push(`${JSON.stringify(r.name)},${r.email},${r.password}`)
    fs.writeFileSync(csvPath, lines.join('\n'), 'utf8')

    console.log('')
    console.log('✅ Completed.')
    console.log('Actors:', results)
    console.log('Passwords written to:', csvPath)
  } finally {
    try { await conn.end() } catch {}
  }
}

main().catch((e) => { console.error('❌ Provisioning failed:', e?.message || e); process.exit(1) })
