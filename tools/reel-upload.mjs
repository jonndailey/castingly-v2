#!/usr/bin/env node
// Upload a small demo reel (mp4) for the logged-in actor and verify it appears via the API.
// Usage:
//   BASE_URL=https://castingly.dailey.dev \
//   EMAIL='actor.demo@castingly.com' \
//   PASSWORD='Act0r!2025' \
//   node tools/reel-upload.mjs

import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'https://castingly.dailey.dev'
const EMAIL = process.env.EMAIL || 'actor.demo@castingly.com'
const PASSWORD = process.env.PASSWORD || ''

async function fetchJson(url, opts) {
  const r = await fetch(url, opts)
  let j = null
  try { j = await r.json() } catch {}
  return { r, j }
}

async function downloadSampleMp4() {
  // Small public sample video; try a couple of sources
  const candidates = [
    'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
    'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_1mb.mp4'
  ]
  let r = null
  for (const u of candidates) {
    try {
      const resp = await fetch(u, { signal: AbortSignal.timeout(12000) })
      if (resp.ok) { r = resp; break }
    } catch {}
  }
  if (!r) throw new Error('No sample MP4 available')
  if (!r.ok) throw new Error('Failed to download sample MP4')
  const ab = await r.arrayBuffer()
  return new Uint8Array(ab)
}

async function main() {
  if (!PASSWORD) throw new Error('PASSWORD env is required')
  const loginUrl = `${BASE_URL.replace(/\/$/, '')}/api/auth/login`
  const { r: lr, j: lj } = await fetchJson(loginUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  })
  if (!lr.ok || !lj?.token || !lj?.user?.id) {
    console.error('Login failed', lr.status, lj)
    process.exit(1)
  }
  const token = lj.token
  const userId = String(lj.user.id)
  console.log('Logged in as', EMAIL, 'id=', userId)

  // Download sample mp4
  const mp4 = await downloadSampleMp4()
  const filename = `demo_reel_${Date.now()}.mp4`
  const fd = new FormData()
  fd.append('file', new Blob([mp4], { type: 'video/mp4' }), filename)
  fd.append('title', filename)
  fd.append('category', 'reel')

  const uploadUrl = `${BASE_URL.replace(/\/$/, '')}/api/media/actor/${encodeURIComponent(userId)}/upload`
  const ur = await fetch(uploadUrl, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  let uj = null
  try { uj = await ur.json() } catch {}
  if (!ur.ok) {
    console.error('Upload failed', ur.status, uj)
    process.exit(2)
  }
  console.log('Uploaded reel:', uj?.file?.name || filename)

  // Verify via API
  const actorUrl = `${BASE_URL.replace(/\/$/, '')}/api/actors/${encodeURIComponent(userId)}?media=1&ts=${Date.now()}`
  const ar = await fetch(actorUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  const aj = await ar.json().catch(() => null)
  if (!ar.ok || !aj) {
    console.error('Actor fetch failed', ar.status, aj)
    process.exit(3)
  }
  const reels = Array.isArray(aj?.media?.reels) ? aj.media.reels : []
  console.log('Reels count:', reels.length)
  if (reels.length) {
    const top = reels[0]
    console.log('Top reel url:', top?.url || top?.signed_url || top?.thumbnail_url)
    console.log('Top reel name:', top?.name)
    console.log('Visibility:', top?.visibility)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
