#!/usr/bin/env node
// Castingly profile performance + media check
// Logs in, navigates to /actor/profile, measures timings, opens Media tab,
// identifies broken images, and saves artifacts.
// Usage:
//   BASE_URL=http://localhost:4874 USERNAME='actor.demo@castingly.com' PASSWORD='Act0r!2025' node tools/perf-profile.mjs

import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:4874'
const USERNAME = process.env.USERNAME || 'actor.demo@castingly.com'
const PASSWORD = process.env.PASSWORD || ''
const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'perf')

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {})
}

function nowIso() { return new Date().toISOString() }

async function writeJson(filePath, data) {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
}

async function getNavMetrics(page) {
  return await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0]
    const fp = performance.getEntriesByName('first-paint')[0]
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    const cls = performance.getEntriesByType('layout-shift')
      .reduce((sum, e) => sum + (e && e.value ? e.value : 0), 0)
    const tbt = 0 // placeholder; needs longtasks observer for accuracy
    const metrics = {
      url: location.href,
      type: nav?.entryType || 'navigation',
      startTime: nav?.startTime,
      duration: nav?.duration,
      domContentLoaded: nav?.domContentLoadedEventEnd,
      loadEventEnd: nav?.loadEventEnd,
      responseEnd: nav?.responseEnd,
      requestStart: nav?.requestStart,
      transferSize: nav?.transferSize,
      fp: fp?.startTime,
      fcp: fcp?.startTime,
      cls,
      tbt,
    }
    return metrics
  })
}

async function detectBrokenImages(page) {
  return await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'))
    const broken = []
    for (const img of imgs) {
      const src = img.getAttribute('src') || ''
      const complete = img.complete
      const nw = (img).naturalWidth || 0
      const nh = (img).naturalHeight || 0
      // Consider broken if completed with 0 dimensions, or if src is empty
      const isBroken = (complete && (nw === 0 || nh === 0)) || !src
      if (isBroken) {
        broken.push({ src, alt: img.getAttribute('alt') || '', complete, nw, nh })
      }
    }
    return broken
  })
}

async function main() {
  if (!PASSWORD) {
    console.error('Missing PASSWORD env variable')
    process.exit(1)
  }
  await ensureDir(OUT_DIR)
  const consoleLogPath = path.join(OUT_DIR, 'console.json')
  const netLogPath = path.join(OUT_DIR, 'network.json')
  const metricsPath = path.join(OUT_DIR, 'metrics.json')
  const brokenPath = path.join(OUT_DIR, 'broken.json')
  const profileShot = path.join(OUT_DIR, 'profile.png')
  const mediaShot = path.join(OUT_DIR, 'media.png')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()

  const consoleEvents = []
  const network = []
  page.on('console', (msg) => {
    consoleEvents.push({ ts: nowIso(), t: Date.now(), type: msg.type(), text: msg.text() })
  })
  page.on('request', (req) => {
    network.push({ ts: nowIso(), t: Date.now(), phase: 'request', url: req.url(), method: req.method(), type: req.resourceType() })
  })
  page.on('response', async (res) => {
    network.push({ ts: nowIso(), t: Date.now(), phase: 'response', url: res.url(), status: res.status(), ok: res.ok() })
  })

  // Login
  await page.goto(`${BASE_URL.replace(/\/$/, '')}/login`, { waitUntil: 'domcontentloaded' })
  const emailField = page.locator('input[type="email"], input[name="email"], input[autocomplete="username"]').first()
  await emailField.waitFor({ state: 'visible', timeout: 20000 })
  await emailField.fill(USERNAME)
  const pwField = page.locator('input[type="password"], input[name="password"]').first()
  await pwField.fill(PASSWORD)
  const submit = page.getByRole('button', { name: /sign in|log in|continue|submit/i }).first()
  const loginStart = Date.now()
  if (await submit.isVisible().catch(() => false)) {
    await submit.click().catch(() => {})
  } else {
    await page.keyboard.press('Enter').catch(() => {})
  }
  await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {})
  await page.waitForURL(/\/actor\//, { timeout: 20000 }).catch(() => {})
  const loginEnd = Date.now()

  // Navigate to profile
  await page.goto(`${BASE_URL.replace(/\/$/, '')}/actor/profile`, { waitUntil: 'domcontentloaded' })
  // Measure loading overlay on profile
  const loader = page.locator('text=Loading your profile...').first()
  let profileLoadStart = null
  try {
    const vis = await loader.isVisible({ timeout: 3000 })
    if (vis) profileLoadStart = Date.now()
  } catch {}
  if (profileLoadStart) {
    await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {})
  }
  const profileLoadEnd = profileLoadStart ? Date.now() : null
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  const profileMetrics = await getNavMetrics(page)
  await page.screenshot({ path: profileShot, fullPage: true }).catch(() => {})

  // Open Media tab
  const mediaBtn = page.getByRole('button', { name: /^media$/i }).first()
  if (await mediaBtn.isVisible().catch(() => false)) {
    await mediaBtn.click().catch(() => {})
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  // give tiles a beat and scroll to load lazy images
  await page.waitForTimeout(800)
  try {
    await page.evaluate(async () => {
      const scroller = document.scrollingElement || document.documentElement
      const step = Math.max(200, Math.floor(window.innerHeight * 0.75))
      for (let y = 0; y < (scroller?.scrollHeight || 0); y += step) {
        window.scrollTo({ top: y })
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo({ top: 0 })
    })
  } catch {}
  await page.waitForTimeout(500)
  const broken = await detectBrokenImages(page)
  await page.screenshot({ path: mediaShot, fullPage: true }).catch(() => {})

  // Persist artifacts
  await writeJson(consoleLogPath, { when: nowIso(), events: consoleEvents })
  await writeJson(netLogPath, { when: nowIso(), events: network })
  // Summaries for loader phases
  function within(t, start, end) {
    return typeof t === 'number' && typeof start === 'number' && typeof end === 'number' && t >= start && t <= end
  }
  function summarizeRequests(start, end) {
    const reqs = network.filter((e) => e.phase === 'request' && within(e.t, start, end))
    const top = reqs.map((r) => ({ method: r.method, url: r.url, type: r.type }))
    return top
  }
  const loginSummary = {
    start: loginStart,
    end: loginEnd,
    durationMs: loginEnd - loginStart,
    requests: summarizeRequests(loginStart, loginEnd),
  }
  const profileOverlaySummary = profileLoadStart && profileLoadEnd ? {
    start: profileLoadStart,
    end: profileLoadEnd,
    durationMs: profileLoadEnd - profileLoadStart,
    requests: summarizeRequests(profileLoadStart, profileLoadEnd),
  } : null

  await writeJson(metricsPath, { when: nowIso(), profile: profileMetrics, login: loginSummary, profileOverlay: profileOverlaySummary })
  await writeJson(brokenPath, { when: nowIso(), broken })

  await context.close()
  await browser.close()

  console.log('Perf artifacts:')
  console.log('-', path.relative(process.cwd(), consoleLogPath))
  console.log('-', path.relative(process.cwd(), netLogPath))
  console.log('-', path.relative(process.cwd(), metricsPath))
  console.log('-', path.relative(process.cwd(), brokenPath))
  console.log('-', path.relative(process.cwd(), profileShot))
  console.log('-', path.relative(process.cwd(), mediaShot))
}

main().catch((e) => { console.error('perf-profile failed:', e?.message || e); process.exit(1) })
