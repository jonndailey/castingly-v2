#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

/**
 * Verify Beta Actors Accounts
 * Reads artifacts/provision/beta-actors-passwords.csv and attempts login against
 * - Dailey Core: /auth/login (casts to app tenant)
 * - Castingly Beta: https://castingly.dailey.dev/api/auth/login
 * Writes JSON report to artifacts/provision/login-verification.json
 */

function loadEnvFile(file) {
  try {
    if (!file || !fs.existsSync(file)) return
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
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
  } catch {}
}

const MIGRATION_ENV = process.env.MIGRATION_ENV
if (MIGRATION_ENV) loadEnvFile(MIGRATION_ENV)

const CORE_BASE = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'https://core.dailey.cloud').replace(/\/$/, '')
const CORE_APP_SLUG = process.env.DAILEY_CORE_APP_SLUG || 'castingly-portal'
const CORE_TENANT_SLUG = process.env.DAILEY_CORE_TENANT_SLUG || 'castingly'
const BETA_URL = (process.env.APP_URL || 'https://castingly.dailey.dev').replace(/\/$/, '')

function parseCsvPasswords() {
  const csvPath = path.join(process.cwd(), 'artifacts', 'provision', 'beta-actors-passwords.csv')
  const out = []
  const txt = fs.readFileSync(csvPath, 'utf8')
  const lines = txt.split(/\r?\n/).filter(Boolean)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const parts = []
    let cur = ''
    let inQ = false
    for (let j = 0; j < line.length; j++) {
      const c = line[j]
      if (c === '"') { inQ = !inQ; continue }
      if (c === ',' && !inQ) { parts.push(cur); cur=''; continue }
      cur += c
    }
    parts.push(cur)
    const name = parts[0]?.replace(/^"|"$/g, '') || ''
    const email = (parts[1] || '').trim()
    const password = (parts[2] || '').trim()
    if (email && password) out.push({ name, email, password })
  }
  return out
}

async function coreLogin(email, password) {
  const res = await fetch(`${CORE_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': CORE_APP_SLUG,
      'X-Tenant-Slug': CORE_TENANT_SLUG,
      'User-Agent': 'Castingly/VerifyScript',
    },
    body: JSON.stringify({ email, password, app_slug: CORE_APP_SLUG, tenant_slug: CORE_TENANT_SLUG })
  })
  if (!res.ok) return { ok: false, status: res.status, error: await safeErr(res) }
  const data = await res.json()
  return { ok: true, status: res.status, token: data.access_token, roles: data.user?.roles || [] }
}

async function castinglyLogin(email, password) {
  const res = await fetch(`${BETA_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) return { ok: false, status: res.status, error: await safeErr(res) }
  const data = await res.json()
  return { ok: true, status: res.status, source: data.source, user: data.user }
}

async function safeErr(res) {
  try { const j = await res.json(); return j?.error || j?.message || String(res.status) } catch { return String(res.status) }
}

async function main() {
  const entries = parseCsvPasswords()
  const results = []
  for (const ent of entries) {
    const r = { email: ent.email, name: ent.name }
    try { r.core = await coreLogin(ent.email, ent.password) } catch (e) { r.core = { ok: false, error: e?.message || 'core_error' } }
    try { r.castingly = await castinglyLogin(ent.email, ent.password) } catch (e) { r.castingly = { ok: false, error: e?.message || 'castingly_error' } }
    results.push(r)
  }
  const okCore = results.filter(r => r.core?.ok).length
  const okCastingly = results.filter(r => r.castingly?.ok).length
  const outDir = path.join(process.cwd(), 'artifacts', 'provision')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'login-verification.json'), JSON.stringify({ summary: { core: okCore, castingly: okCastingly, total: results.length }, results }, null, 2))
  console.log(`Core OK: ${okCore}/${results.length}  Castingly OK: ${okCastingly}/${results.length}`)
}

main().catch((e) => { console.error('Verification failed:', e?.message || e); process.exit(1) })

