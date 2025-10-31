#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { chromium } from 'playwright'

const BASE = process.env.APP_BASE_URL || 'https://castingly.dailey.dev'
const EMAIL = process.env.TEST_EMAIL || ''
const PASSWORD = process.env.TEST_PASSWORD || ''

if (!EMAIL || !PASSWORD) {
  console.error('Set TEST_EMAIL and TEST_PASSWORD')
  process.exit(1)
}

const ASSETS = [
  path.resolve('tools/qa-assets/hs1.jpg'),
  path.resolve('tools/qa-assets/hs2.jpg'),
  path.resolve('tools/qa-assets/hs3.png'),
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  const consoleLogs = []
  const requests = []
  const responses = []

  page.on('console', (msg) => {
    const entry = { type: msg.type(), text: msg.text(), ts: Date.now() }
    consoleLogs.push(entry)
  })
  page.on('request', (req) => {
    requests.push({ url: req.url(), method: req.method(), ts: Date.now() })
  })
  page.on('response', async (res) => {
    const url = res.url(); const status = res.status(); const method = res.request().method()
    responses.push({ url, status, method, ts: Date.now() })
  })

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder(/e\.g\.,?\s+jackfdfnnelly@gmail\.com/i).fill(EMAIL)
  await page.getByPlaceholder(/enter your password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForURL(/actor\/dashboard|actor\/profile/i, { timeout: 20000 })

  // Go to profile
  await page.goto(`${BASE}/actor/profile`, { waitUntil: 'domcontentloaded' })
  // Switch to Media tab then open headshots upload (data-testid hook)
  await page.getByRole('button', { name: /^Media$/i }).click({ timeout: 8000 }).catch(() => {})
  const btn = page.locator('[data-testid="upload-headshot"]').first()
  await btn.click({ timeout: 8000 })

  // Find modal drop input (first visible file input inside modal)
  // Prefer the dropzone input inside the modal, skip avatar input
  const fileInputs = page.locator('input[type="file"]:not(#avatar-upload-input)')
  await page.waitForTimeout(500) // allow modal to render
  // Attach multiple files – try all inputs until one works
  const count = await fileInputs.count()
  const started = Date.now()
  let attached = false
  for (let i = 0; i < count; i++) {
    try {
      await fileInputs.nth(i).setInputFiles(ASSETS)
      attached = true
      break
    } catch {}
  }
  if (!attached) throw new Error('failed_attach_files')

  // Wait for 3 upload POSTs to complete or timeout
  const deadline = Date.now() + 90000
  let doneUploads = 0
  while (Date.now() < deadline && doneUploads < 3) {
    const recent = responses.filter((r) => /\/api\/media\/actor\//.test(r.url) && r.method === 'POST')
    doneUploads = recent.length
    await page.waitForTimeout(500)
  }

  const durMs = Date.now() - started
  // Tidy summary
  const netSummary = {
    uploadPosts: responses.filter((r) => /\/api\/media\/actor\//.test(r.url) && r.method === 'POST').map((r) => ({ url: r.url, status: r.status })),
    tilesGets: responses.filter((r) => /\/api\/media\/actor\/.+\/headshots\/tiles/.test(r.url)).length,
    totalRequests: requests.length,
    totalResponses: responses.length,
    durationMs: durMs,
  }
  const logSummary = {
    count: consoleLogs.length,
    samples: consoleLogs.slice(-10),
  }
  console.log(JSON.stringify({ ok: true, network: netSummary, console: logSummary }, null, 2))

  await ctx.close(); await browser.close()
}

run().catch((e) => { console.error('qa-run error:', e?.message || e); process.exit(1) })
