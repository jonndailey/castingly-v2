#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sgMail from '@sendgrid/mail'

/**
 * Send the Castingly Beta Welcome email via SendGrid.
 * - TEST_ONLY (default): sends a single test email to jonny@dailey.llc
 * - ALL=1: sends to the full beta actor list (reads passwords CSV if available)
 *
 * Examples:
 *   SENDGRID_API_KEY=... node tools/send-welcome-castingly.mjs            # test only
 *   ALL=1 SENDGRID_API_KEY=... node tools/send-welcome-castingly.mjs      # send all
 */

// Load MIGRATION_ENV like other ops scripts, so we can read remote .env.production
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
// Fallbacks for local runs
if (!process.env.SENDGRID_API_KEY && fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  loadEnvFile(path.join(process.cwd(), '.env.local'))
}
if (!process.env.SENDGRID_API_KEY && fs.existsSync(path.join(process.cwd(), '.env'))) {
  loadEnvFile(path.join(process.cwd(), '.env'))
}

const API_KEY = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@castingly.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Castingly'
const TEST_ONLY = String(process.env.TEST_ONLY || (process.env.ALL ? '' : '1')) === '1'
// Campaign-safe URL: prefer explicit campaign url, then default to beta domain; ignore dev NEXT_PUBLIC_APP_URL
const APP_URL = (process.env.FORCE_URL || process.env.CAMPAIGN_APP_URL || 'https://castingly.dailey.dev').replace(/\/$/, '')

if (!API_KEY) {
  console.error('SENDGRID_API_KEY (or SEND_GRID_API_KEY) is required')
  process.exit(1)
}
sgMail.setApiKey(API_KEY)

const RECIPIENTS = [
  { name: 'Amber Luallen', email: 'amberluallen89@gmail.com' },
  { name: 'Matt Sweeney', email: 'driscollsweeney@gmail.com' },
  { name: 'Ryan Coil', email: 'ryankcoil@gmail.com' },
  { name: 'Jared Nigro', email: 'nigro.jared@gmail.com' },
  { name: 'Joel Anderson', email: 'joelpa@gmail.com' },
  { name: 'Daniel Cohen', email: 'danielmkcohen@gmail.com' },
  { name: 'Jonny Dailey', email: 'jonndailey@gmail.com' },
]

function firstName(name) {
  const n = String(name || '').trim()
  if (!n) return 'there'
  return n.split(/\s+/)[0]
}

function loadPasswordsMap() {
  try {
    const csvPath = path.join(process.cwd(), 'artifacts', 'provision', 'beta-actors-passwords.csv')
    const txt = fs.readFileSync(csvPath, 'utf8')
    const lines = txt.split(/\r?\n/).filter(Boolean)
    const map = new Map()
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // naive CSV parse for 3 columns (name,email,password)
      const parts = []
      let cur = ''
      let inQ = false
      for (let j = 0; j < line.length; j++) {
        const c = line[j]
        if (c === '"') { inQ = !inQ; continue }
        if (c === ',' && !inQ) { parts.push(cur); cur = ''; continue }
        cur += c
      }
      parts.push(cur)
      const email = (parts[1] || '').trim()
      const pw = (parts[2] || '').trim()
      if (email && pw) map.set(email.toLowerCase(), pw)
    }
    return map
  } catch {
    return new Map()
  }
}

function emailHtml(first, appUrl, password) {
  const greeting = `Hi ${first},`
  // match app aesthetic: purple brand (#7c3aed), rounded button, clean typography
  return `
  <div style="background:#f9fafb;padding:24px 0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
      <tr>
        <td style="padding:28px 28px 0 28px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="width:28px;height:28px;border-radius:8px;background:#7c3aed"></div>
            <div style="font-weight:700;color:#7c3aed;letter-spacing:0.2px">Castingly</div>
          </div>
          <h1 style="margin:0 0 6px 0;font-size:22px;line-height:1.3;color:#111827">Welcome to Castingly — You’re in the Beta!</h1>
          <p style="margin:0 0 16px 0;color:#374151">${greeting}</p>
          <p style="margin:0 0 16px 0;color:#374151">Welcome to Castingly, a new platform built to connect actors, agents, and casting professionals in one transparent, creative space. You’ve been invited to join our exclusive beta, and we couldn’t be more excited to have you on board.</p>
          <div style="margin:18px 0 16px 0;padding:14px 16px;background:#f3e8ff;border:1px solid #e9d5ff;border-radius:12px;color:#4c1d95">
            <div style="font-weight:600;margin-bottom:4px">Your Beta Access</div>
            <div style="font-size:14px;line-height:1.5">
              <div><strong>Login:</strong> <a href="${appUrl}" style="color:#6d28d9;text-decoration:none">${appUrl}</a></div>
              ${password ? `<div><strong>Temporary Password:</strong> <span style="letter-spacing:0.2px">${password}</span></div>` : ''}
            </div>
          </div>
          <p style="margin:0 0 10px 0;color:#111827;font-weight:600">Here’s what you can do right now:</p>
          <ul style="margin:0 0 16px 18px;color:#374151;padding:0">
            <li style="margin-bottom:6px">Build your profile: Upload your headshots, reels, and credits</li>
            <li style="margin-bottom:6px">Connect with representation: Reach out directly to agents and casting professionals</li>
            <li style="margin-bottom:6px">Find agents and managers to complete your team: Use Inside Connect to discover representation and collaboration opportunities</li>
            <li style="margin-bottom:6px">Shape the platform: Your feedback directly influences how Castingly grows</li>
          </ul>
          <p style="margin:0 0 22px 0;color:#374151">This beta is an early version — things may shift quickly as we refine features and you may find some issues as we improve the site. If you hit a bug or have suggestions, reply directly to this email or use the Feedback button inside the app.</p>
          <div style="margin:0 0 24px 0">
            <a href="${appUrl}"
               style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600;box-shadow:0 1px 1px rgba(124,58,237,0.25)">Open Castingly</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;border-top:1px solid #f3f4f6;color:#6b7280;font-size:12px">
          You are receiving this because you were invited to the Castingly beta.
        </td>
      </tr>
    </table>
  </div>`
}

async function sendOne(to, subject, html) {
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
    // Disable SendGrid link rewriting so the href shows the exact beta URL
    trackingSettings: {
      clickTracking: { enable: false, enableText: false },
      openTracking: { enable: false }
    }
  }
  const [resp] = await sgMail.send(msg)
  return { status: resp.statusCode, id: resp.headers['x-message-id'] || '' }
}

async function main() {
  // Safety: prevent accidental batch send unless explicitly allowed
  if (!TEST_ONLY && String(process.env.ALL) === '1' && String(process.env.BATCH_OK) !== '1') {
    console.error('Batch sending disabled. Set BATCH_OK=1 to enable ALL=1 sends.')
    process.exit(1)
  }
  const subject = 'Welcome to Castingly — You’re in the Beta!'
  const pwMap = loadPasswordsMap()

  if (TEST_ONLY) {
    const testTo = process.env.TEST_TO || 'jonny@dailey.llc'
    const { randomBytes } = await import('node:crypto')
    const testPw = (pwMap.get(testTo.toLowerCase()) || process.env.TEST_PASSWORD || (randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g,'') + randomBytes(2).toString('hex')).slice(0,16))
    const html = emailHtml('Jonny', APP_URL, testPw)
    console.log('DEBUG_APP_URL', APP_URL)
    const r = await sendOne(testTo, subject, html)
    console.log('✅ Test email sent:', r)
    return
  }

  const results = []
  for (const r of RECIPIENTS) {
    const pw = pwMap.get(r.email.toLowerCase()) || ''
    const html = emailHtml(firstName(r.name), APP_URL, pw)
    const out = await sendOne(r.email, subject, html)
    results.push({ email: r.email, status: out.status, id: out.id })
  }
  console.log('✅ Sent batch:', results)
}

main().catch((e) => { console.error('SendGrid error:', e?.response?.body || e?.message || e); process.exit(1) })
