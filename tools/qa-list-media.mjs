#!/usr/bin/env node
import 'dotenv/config'

const BASE = process.env.APP_BASE_URL || 'https://castingly.dailey.dev'
const EMAIL = process.env.TEST_EMAIL || 'jonndailey@gmail.com'
const PASSWORD = process.env.TEST_PASSWORD || 'A5JcGPiRUhRIS67f'

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (!res.ok) throw new Error(`login failed ${res.status}`)
  const data = await res.json()
  if (!data?.user?.id || !data?.token) throw new Error('bad login response')
  return { id: String(data.user.id), token: String(data.token) }
}

async function listMedia({ userId, token }) {
  const res = await fetch(`${BASE}/api/actors/${encodeURIComponent(userId)}?media=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: data }
}

async function main() {
  const auth = await login()
  const r = await listMedia({ userId: auth.id, token: auth.token })
  const m = r.body?.media || {}
  const summary = {
    ok: r.ok,
    status: r.status,
    counts: {
      headshots: m.headshots?.length || 0,
      gallery: m.gallery?.length || 0,
      reels: m.reels?.length || 0,
      self_tapes: m.self_tapes?.length || 0,
      voice_over: m.voice_over?.length || 0,
      resumes: m.resumes?.length || 0,
      documents: m.documents?.length || 0,
    },
  }
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((e) => { console.error('qa-list error:', e?.message || e); process.exit(1) })

