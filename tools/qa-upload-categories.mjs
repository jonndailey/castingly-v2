#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'

const BASE = process.env.APP_BASE_URL || 'https://castingly.dailey.dev'
const EMAIL = process.env.TEST_EMAIL || 'jonndailey@gmail.com'
const PASSWORD = process.env.TEST_PASSWORD || 'A5JcGPiRUhRIS67f'

const CATEGORIES = [
  { key: 'headshot', filename: 'headshot-test.png', mime: 'image/png' },
  { key: 'gallery', filename: 'gallery-test.png', mime: 'image/png' },
  { key: 'reel', filename: 'reel-test.jpg', mime: 'image/jpeg' },
  { key: 'resume', filename: 'resume-test.pdf', mime: 'application/pdf' },
  { key: 'self_tape', filename: 'selftape-test.jpg', mime: 'image/jpeg' },
  { key: 'voice_over', filename: 'voiceover-test.mp3', mime: 'audio/mpeg' },
  { key: 'document', filename: 'document-test.txt', mime: 'text/plain' },
]

// Tiny 1x1 PNG (transparent)
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
)
const JPG_TINY = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALCwsMCxAMDAwQDw8QGxAQECAcHx8cICEnJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlL/2wBDARESEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISL/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAVEQEBAAAAAAAAAAAAAAAAAAAABf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0gA//9k=',
  'base64'
)
const PDF_MIN = Buffer.from(
  'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1Jlc291cmNlczw8Pj4vQ29udGVudHMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9MZW5ndGggMzAgPj4Kc3RyZWFtCkJUCl0gVGVzdCBQREYgQ2FzdGluZ2x5CkVUCmVuZHN0cmVhbQplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMSAwIFJdL0NvdW50IDE+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMyAwIFI+PgplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDExOSAwMDAwMCBuIAowMDAwMDAwMTYyIDAwMDAwIG4gCnRyYWlsZXIKPDwvUm9vdCA0IDAgUj4+CnN0YXJ0eHJlZgo5NQolJUVPRgo=','base64'
)
const MP3_FAKE = Buffer.from('ID3', 'ascii') // placeholder

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

function pickBufferByMime(mime) {
  if (mime === 'image/png') return PNG_1x1
  if (mime === 'image/jpeg') return JPG_TINY
  if (mime === 'application/pdf') return PDF_MIN
  if (mime === 'audio/mpeg') return MP3_FAKE
  return Buffer.from('test file', 'utf8')
}

async function uploadOne({ userId, token }, cat) {
  const form = new FormData()
  const buf = pickBufferByMime(cat.mime)
  const file = new File([buf], cat.filename, { type: cat.mime })
  form.append('file', file)
  form.append('title', cat.filename)
  form.append('category', cat.key)
  const res = await fetch(`${BASE}/api/media/actor/${encodeURIComponent(userId)}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body: data }
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
  console.log('Logging in to', BASE, 'as', EMAIL)
  const auth = await login()
  console.log('User:', auth.id)

  const results = []
  for (const cat of CATEGORIES) {
    const r = await uploadOne(auth, cat)
    results.push({ category: cat.key, status: r.status, ok: r.ok, proxy: r.body?.file?.proxy_url || null })
  }
  const media = await listMedia(auth)
  const summary = {
    uploaded: results,
    headshots: media.body?.media?.headshots?.length,
    gallery: media.body?.media?.gallery?.length,
    reels: media.body?.media?.reels?.length,
    resumes: media.body?.media?.resumes?.length,
    self_tapes: media.body?.media?.self_tapes?.length,
    voice_over: media.body?.media?.voice_over?.length,
    documents: media.body?.media?.documents?.length,
  }
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((e) => { console.error('qa error:', e?.message || e); process.exit(1) })

