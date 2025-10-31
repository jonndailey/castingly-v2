#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { chromium } from 'playwright'

const BASE = process.env.APP_BASE_URL || 'https://castingly.dailey.dev'
const EMAIL = process.env.TEST_EMAIL || 'jonndailey@gmail.com'
const PASSWORD = process.env.TEST_PASSWORD || 'A5JcGPiRUhRIS67f'

const TMP = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'castingly-qa-'))

function writeFile(name, buf) {
  const p = path.join(TMP, name)
  fs.writeFileSync(p, buf)
  return p
}

// Tiny test assets
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
)
const JPG_TINY = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALCwsMCxAMDAwQDw8QGxAQECAcHx8cICEnJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlJCUlL/2wBDARESEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISL/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAVEQEBAAAAAAAAAAAAAAAAAAAABf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0gA//9k=',
  'base64'
)
const PDF_MIN = Buffer.from(
  'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDYxMiA3OTJdL1Jlc291cmNlczw8Pj4vQ29udGVudHMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9MZW5ndGggMzAgPj4Kc3RyZWFtCkJUCl0gVGVzdCBQREYgQ2FzdGluZ2x5CkVUCmVuZHN0cmVhbQplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMSAwIFJdL0NvdW50IDE+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMyAwIFI+PgplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzAgMDAwMDAgbiAKMDAwMDAwMDExOSAwMDAwMCBuIAowMDAwMDAwMTYyIDAwMDAwIG4gCnRyYWlsZXIKPDwvUm9vdCA0IDAgUj4+CnN0YXJ0eHJlZgo5NQolJUVPRgo=',
  'base64'
)
const MP3_FAKE = Buffer.from('ID3', 'ascii')

const REEL_FILE = process.env.UPLOAD_REEL_FILE || path.resolve(process.cwd(), 'tools/qa-assets/sample-video.mp4')
const SELF_TAPE_FILE = process.env.UPLOAD_SELF_TAPE_FILE || REEL_FILE

const CASES = [
  { key: 'headshot', file: writeFile('headshot.png', PNG_1x1) },
  { key: 'gallery', file: writeFile('gallery.png', PNG_1x1) },
  { key: 'reel', file: REEL_FILE },
  { key: 'self_tape', file: SELF_TAPE_FILE },
  { key: 'voice_over', file: writeFile('voiceover.mp3', MP3_FAKE) },
  { key: 'resume', file: writeFile('resume.pdf', PDF_MIN) },
  { key: 'document', file: writeFile('document.pdf', PDF_MIN) },
]

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder(/e\.g\.,?\s+jackfdfnnelly@gmail\.com/i).fill(EMAIL)
  await page.getByPlaceholder(/enter your password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /sign in|login/i }).click()
  await page.waitForURL(/actor\/dashboard|actor\/profile/i, { timeout: 20000 })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const results = []
  try {
    await login(page)
    await page.goto(`${BASE}/actor/profile`, { waitUntil: 'domcontentloaded' })
    // Switch to Media tab to reveal upload controls
    try {
      await page.getByRole('button', { name: /Media/i }).click({ timeout: 8000 })
    } catch {}
    // Ensure profile upload input is present before starting
    try {
      await page.waitForSelector('#profile-upload-input', { timeout: 15000 })
    } catch {}
    const here = await page.url();
    const info = await page.evaluate(() => {
      const hooks = Array.from(document.querySelectorAll('[data-testid^="upload-"]'))
        .map((el) => ({ testid: el.getAttribute('data-testid'), tag: el.tagName, title: el.getAttribute('title') }))
      const buttons = Array.from(document.querySelectorAll('button'))
        .slice(0, 10)
        .map((el) => el.textContent?.trim())
      return { hooks, buttons }
    })
    console.log(JSON.stringify({ step: 'ready', url: here, hooks: info.hooks, buttons: info.buttons }, null, 2))
    for (const c of CASES) {
      const start = Date.now()
      try {
        const testid = `upload-${c.key}`
        const hook = page.locator(`[data-testid="${testid}"]`).first()
        if (await hook.count()) {
          await hook.click({ timeout: 10000 })
        } else {
          // Fallback to role+name if test id not present
          const map = {
            headshot: /Add Photo|Upload Headshot/i,
            gallery: /Add Photo|Upload Photo/i,
            reel: /Upload Demo Reel/i,
            self_tape: /Upload Self-?Tape Video/i,
            voice_over: /Upload Voice Recording/i,
            resume: /Upload Resume/i,
            document: /Upload Document/i,
          }
          await page.getByRole('button', { name: map[c.key] || /Upload/i }).first().click({ timeout: 10000 })
        }
        // Pick the right hidden input based on category-specific accept attribute
        let selector = '#profile-upload-input'
        if (c.key === 'headshot' || c.key === 'gallery') selector = 'input#profile-upload-input[accept*="image/webp"], input#profile-upload-input[accept*="image/jpeg"]'
        else if (c.key === 'reel' || c.key === 'self_tape') selector = 'input#profile-upload-input[accept="image/*,video/*,application/pdf,audio/*"]'
        else if (c.key === 'voice_over') selector = 'input#profile-upload-input[accept*="audio/mpeg"]'
        else if (c.key === 'resume' || c.key === 'document') selector = 'input#profile-upload-input[accept*="application/pdf"]'
        const fileInput = page.locator(selector).first()
        await fileInput.setInputFiles(c.file)
        // Wait for the upload POST to complete (server 200)
        let uploadOk = false
        try {
          const resp = await page.waitForResponse(
            (r) => r.url().includes('/api/media/actor/') && r.request().method() === 'POST',
            { timeout: 20000 }
          )
          uploadOk = resp.ok()
        } catch {}
        // Brief pause to allow UI to render any confirmation/toast
        await page.waitForTimeout(500)
        const durMs = Date.now() - start
        results.push({ category: c.key, ok: uploadOk, ms: durMs })
      } catch (e) {
        results.push({ category: c.key, ok: false, error: e?.message })
      }
    }
    console.log(JSON.stringify({ ok: true, results }, null, 2))
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: e?.message }, null, 2))
  } finally {
    await ctx.close(); await browser.close()
  }
}

run().catch((e) => { console.error(e); process.exit(1) })
