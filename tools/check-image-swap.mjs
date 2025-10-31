#!/usr/bin/env node
// Login → /actor/profile → watch <img> src changes and network for raw storage hosts
// Usage:
//   BASE_URL=https://castingly.dailey.dev \
//   USERNAME='actor.demo@castingly.com' \
//   PASSWORD='Act0r!2025' \
//   node tools/check-image-swap.mjs

import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:4874'
const USERNAME = process.env.USERNAME || 'actor.demo@castingly.com'
const PASSWORD = process.env.PASSWORD || ''
if (!PASSWORD) { console.error('Missing PASSWORD'); process.exit(1) }

const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'check')
await fs.promises.mkdir(OUT_DIR, { recursive: true })

const RAW_HOST_RE = /(s3\.|amazonaws\.com|\.ovh\.)/i
const SERVE_RE = /\/api\/serve\//i

function nowIso() { return new Date().toISOString() }

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await context.newPage()

const events = { console: [], network: [], swaps: [] }
page.on('console', (msg) => events.console.push({ t: Date.now(), type: msg.type(), text: msg.text() }))
page.on('request', (req) => events.network.push({ t: Date.now(), phase: 'req', url: req.url(), method: req.method() }))
page.on('response', async (res) => {
  const ct = await res.headers()['content-type'] || ''
  events.network.push({ t: Date.now(), phase: 'res', url: res.url(), status: res.status(), ok: res.ok(), ct })
})

function injectObserver() {
  return page.evaluate(() => {
    const out = []
    const seen = new WeakMap()
    function tag(img) {
      if (!seen.has(img)) seen.set(img, { initial: img.currentSrc || img.src || null })
    }
    const list = Array.from(document.images)
    list.forEach(tag)
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.type === 'attributes' && r.attributeName === 'src') {
          const img = r.target
          const prev = (seen.get(img) || {}).last || (seen.get(img) || {}).initial || null
          const cur = img.currentSrc || img.src || null
          out.push({ t: Date.now(), prev, cur })
          seen.set(img, { initial: (seen.get(img) || {}).initial || prev, last: cur })
        }
      }
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['src'], subtree: true })
    window.__imgSwapCollector = { out, seen, mo }
    return true
  })
}

async function collectSwaps() {
  const swaps = await page.evaluate(() => (window.__imgSwapCollector ? window.__imgSwapCollector.out.slice() : []))
  return swaps
}

// Login
await page.goto(`${BASE_URL.replace(/\/$/, '')}/login`, { waitUntil: 'domcontentloaded' })
const emailField = page.locator('input[type="email"], input[name="email"], input[autocomplete="username"]').first()
await emailField.waitFor({ state: 'visible', timeout: 20000 })
await emailField.fill(USERNAME)
const pwField = page.locator('input[type="password"], input[name="password"]').first()
await pwField.fill(PASSWORD)
const submit = page.getByRole('button', { name: /sign in|log in|continue|submit/i }).first()
if (await submit.isVisible().catch(() => false)) await submit.click(); else await page.keyboard.press('Enter')
await page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {})
await page.waitForURL(/\/actor\//, { timeout: 20000 }).catch(() => {})

// Go profile
await page.goto(`${BASE_URL.replace(/\/$/, '')}/actor/profile`, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
await injectObserver()

// Snapshot initial profile image candidates
const initialImgs = await page.evaluate(() => Array.from(document.images).map(i => ({ src: i.currentSrc || i.src || null })))

// Watch for 15 seconds
await page.waitForTimeout(15000)
const swaps = await collectSwaps()

// Summarize suspicious swaps (serve → raw)
const suspicious = swaps.filter(s => s.prev && s.cur && /\/api\/serve\//.test(s.prev) && /(s3\.|amazonaws\.com|\.ovh\.)/i.test(s.cur))

await page.screenshot({ path: path.join(OUT_DIR, 'profile.png'), fullPage: true }).catch(() => {})
await fs.promises.writeFile(path.join(OUT_DIR, 'events.json'), JSON.stringify({ when: nowIso(), initialImgs, swaps, suspicious, network: events.network.slice(-200) }, null, 2), 'utf8')

await context.close(); await browser.close()

console.log('Suspicious swaps:', suspicious.length)
if (suspicious.length) console.log(JSON.stringify(suspicious.slice(0,3), null, 2))
