#!/usr/bin/env node
// Enhanced image swap detector that tracks timeline of all img src changes
// Usage:
//   BASE_URL=https://castingly.dailey.dev \
//   USERNAME='actor.demo@castingly.com' \
//   PASSWORD='Act0r!2025' \
//   node debug-image-timeline.mjs

import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:4874'
const USERNAME = process.env.USERNAME || 'actor.demo@castingly.com'
const PASSWORD = process.env.PASSWORD || ''
if (!PASSWORD) { console.error('Missing PASSWORD'); process.exit(1) }

const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'debug')
await fs.promises.mkdir(OUT_DIR, { recursive: true })

const RAW_HOST_RE = /(s3\.|amazonaws\.com|\.ovh\.)/i
const SERVE_RE = /\/api\/serve\//i

function nowIso() { return new Date().toISOString() }

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ ignoreHTTPSErrors: true })
const page = await context.newPage()

const events = { console: [], network: [], swaps: [], timeline: [] }
page.on('console', (msg) => events.console.push({ t: Date.now(), type: msg.type(), text: msg.text() }))
page.on('request', (req) => events.network.push({ t: Date.now(), phase: 'req', url: req.url(), method: req.method() }))
page.on('response', async (res) => {
  const ct = await res.headers()['content-type'] || ''
  events.network.push({ t: Date.now(), phase: 'res', url: res.url(), status: res.status(), ok: res.ok(), ct })
})

function injectEnhancedObserver() {
  return page.evaluate(() => {
    const timeline = []
    const seen = new WeakMap()
    
    // Tag all existing images
    function tagImage(img, context = 'initial') {
      const currentSrc = img.currentSrc || img.src || null
      if (!seen.has(img)) {
        const imgInfo = {
          initial: currentSrc,
          last: currentSrc,
          element: img.outerHTML.substring(0, 200) + (img.outerHTML.length > 200 ? '...' : ''),
          classes: img.className,
          alt: img.alt,
          id: img.id
        }
        seen.set(img, imgInfo)
        timeline.push({
          t: Date.now(),
          context,
          action: 'discovered',
          src: currentSrc,
          element: imgInfo.element,
          classes: imgInfo.classes,
          alt: imgInfo.alt,
          id: imgInfo.id
        })
      }
    }
    
    // Track all current images
    Array.from(document.images).forEach(img => tagImage(img, 'page-load'))
    
    // Create mutation observer for src changes
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.type === 'attributes' && r.attributeName === 'src') {
          const img = r.target
          const imgInfo = seen.get(img) || {}
          const prev = imgInfo.last || imgInfo.initial || null
          const cur = img.currentSrc || img.src || null
          
          if (prev !== cur) {
            timeline.push({
              t: Date.now(),
              context: 'mutation',
              action: 'src-changed',
              prev,
              cur,
              element: img.outerHTML.substring(0, 200) + (img.outerHTML.length > 200 ? '...' : ''),
              classes: img.className,
              alt: img.alt,
              id: img.id,
              isServeToRaw: prev && cur && /\/api\/serve\//.test(prev) && /(s3\.|amazonaws\.com|\.ovh\.)/i.test(cur),
              isRawToServe: prev && cur && /(s3\.|amazonaws\.com|\.ovh\.)/i.test(prev) && /\/api\/serve\//.test(cur)
            })
            
            imgInfo.last = cur
            seen.set(img, imgInfo)
          }
        }
        // Also track new images being added
        else if (r.type === 'childList') {
          for (const node of r.addedNodes) {
            if (node.nodeType === 1) { // Element
              if (node.tagName === 'IMG') {
                tagImage(node, 'dom-added')
              }
              // Check for images in added subtrees
              const imgs = node.querySelectorAll ? node.querySelectorAll('img') : []
              imgs.forEach(img => tagImage(img, 'subtree-added'))
            }
          }
        }
      }
    })
    
    mo.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['src'], 
      subtree: true, 
      childList: true 
    })
    
    window.__enhancedImgObserver = { timeline, seen, mo }
    return true
  })
}

async function collectTimeline() {
  const timeline = await page.evaluate(() => (window.__enhancedImgObserver ? window.__enhancedImgObserver.timeline.slice() : []))
  return timeline
}

// Login
console.log('Logging in...')
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

// Go to profile
console.log('Loading profile page...')
await page.goto(`${BASE_URL.replace(/\/$/, '')}/actor/profile`, { waitUntil: 'domcontentloaded' })
await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

// Inject enhanced observer
await injectEnhancedObserver()

// Take snapshots at regular intervals
const snapshots = []
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(3000) // Wait 3 seconds
  const timeline = await collectTimeline()
  const currentImages = await page.evaluate(() => Array.from(document.images).map(img => ({
    src: img.currentSrc || img.src || null,
    classes: img.className,
    alt: img.alt,
    id: img.id
  })))
  
  snapshots.push({
    t: Date.now(),
    iteration: i + 1,
    timelineLength: timeline.length,
    currentImages: currentImages.slice(0, 10) // First 10 images only
  })
  
  console.log(`Snapshot ${i + 1}: ${timeline.length} timeline events, ${currentImages.length} images`)
}

const finalTimeline = await collectTimeline()

// Analyze timeline for suspicious swaps
const suspiciousSwaps = finalTimeline.filter(e => e.isServeToRaw)
const goodSwaps = finalTimeline.filter(e => e.isRawToServe)

await page.screenshot({ path: path.join(OUT_DIR, 'timeline-profile.png'), fullPage: true }).catch(() => {})

const report = {
  when: nowIso(),
  suspiciousSwaps: suspiciousSwaps.length,
  goodSwaps: goodSwaps.length,
  totalTimelineEvents: finalTimeline.length,
  snapshots,
  timeline: finalTimeline,
  network: events.network.filter(e => 
    e.url.includes('/api/actors') || 
    e.url.includes('/api/media') || 
    e.url.includes('tiles') ||
    e.url.includes('media.dailey.cloud') ||
    e.url.includes('/api/serve')
  )
}

await fs.promises.writeFile(path.join(OUT_DIR, 'timeline-report.json'), JSON.stringify(report, null, 2), 'utf8')

await context.close()
await browser.close()

console.log(`\nTimeline Analysis:`)
console.log(`- Total timeline events: ${finalTimeline.length}`)
console.log(`- Suspicious swaps (serve → raw): ${suspiciousSwaps.length}`)
console.log(`- Good swaps (raw → serve): ${goodSwaps.length}`)

if (suspiciousSwaps.length > 0) {
  console.log('\nSuspicious swaps:')
  suspiciousSwaps.slice(0, 3).forEach((swap, i) => {
    console.log(`${i + 1}. ${swap.prev} → ${swap.cur}`)
    console.log(`   Context: ${swap.context}, Alt: "${swap.alt}", Classes: "${swap.classes}"`)
  })
}

if (goodSwaps.length > 0) {
  console.log('\nGood swaps (raw → serve):')
  goodSwaps.slice(0, 3).forEach((swap, i) => {
    console.log(`${i + 1}. ${swap.prev} → ${swap.cur}`)
    console.log(`   Context: ${swap.context}, Alt: "${swap.alt}", Classes: "${swap.classes}"`)
  })
}