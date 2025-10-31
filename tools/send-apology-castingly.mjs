#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sgMail from '@sendgrid/mail'

// Helper to load .env-like files
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

// Load envs (MIGRATION_ENV, then local .env.local/.env)
const MIGRATION_ENV = process.env.MIGRATION_ENV
if (MIGRATION_ENV) loadEnvFile(MIGRATION_ENV)
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) loadEnvFile(path.join(process.cwd(), '.env.local'))
if (fs.existsSync(path.join(process.cwd(), '.env'))) loadEnvFile(path.join(process.cwd(), '.env'))

const API_KEY = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@castingly.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Castingly'
const APP_URL = (process.env.FORCE_URL || process.env.CAMPAIGN_APP_URL || 'https://castingly.dailey.dev').replace(/\/$/, '')

if (!API_KEY) {
  console.error('SENDGRID_API_KEY (or SEND_GRID_API_KEY) is required')
  process.exit(1)
}
sgMail.setApiKey(API_KEY)

function firstName(name) {
  const n = String(name || '').trim()
  if (!n) return 'there'
  return n.split(/\s+/)[0]
}

function emailHtml({ first, appUrl, password }) {
  const greeting = `Hi ${first},`
  return `
  <div style="background:#f9fafb;padding:24px 0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
      <tr>
        <td style="padding:28px 28px 0 28px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="width:28px;height:28px;border-radius:8px;background:#7c3aed"></div>
            <div style="font-weight:700;color:#7c3aed;letter-spacing:0.2px">Castingly</div>
          </div>
          <h1 style="margin:0 0 6px 0;font-size:21px;line-height:1.3;color:#111827">Oops — here’s the correct Castingly beta link</h1>
          <p style="margin:0 0 14px 0;color:#374151">${greeting}</p>
          <p style="margin:0 0 14px 0;color:#374151">We’re in beta, and our caffeine got ahead of our links. The first email pointed to a developer address — sorry for the detour!</p>
          <div style="margin:16px 0 14px 0;padding:14px 16px;background:#f3e8ff;border:1px solid #e9d5ff;border-radius:12px;color:#4c1d95">
            <div style="font-weight:600;margin-bottom:4px">Your Beta Access</div>
            <div style="font-size:14px;line-height:1.5">
              <div><strong>Login:</strong> <a href="${appUrl}" style="color:#6d28d9;text-decoration:none">${appUrl}</a></div>
              ${password ? `<div><strong>Temporary Password:</strong> <span style="letter-spacing:0.2px">${password}</span></div>` : ''}
            </div>
          </div>
          <p style="margin:0 0 20px 0;color:#374151">Use your email address and the password above to sign in. If you already tried the earlier email, this one has the right link.</p>
          <div style="margin:0 0 24px 0">
            <a href="${appUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600;box-shadow:0 1px 1px rgba(124,58,237,0.25)">Open Castingly</a>
          </div>
          <p style="margin:0 0 16px 0;color:#6b7280">Thanks for rolling with us — your feedback helps us get sharper every day. If you hit a snag, reply to this email and we’ll hop on it.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;border-top:1px solid #f3f4f6;color:#6b7280;font-size:12px">You are receiving this because you were invited to the Castingly beta.</td>
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
    trackingSettings: {
      clickTracking: { enable: false, enableText: false },
      openTracking: { enable: false }
    }
  }
  const [resp] = await sgMail.send(msg)
  return { status: resp.statusCode, id: resp.headers['x-message-id'] || '' }
}

async function main() {
  const subject = 'Oops — here’s the correct Castingly beta link (for real this time)'
  const testTo = process.env.TEST_TO || 'jonny@dailey.llc'
  const { randomBytes } = await import('node:crypto')
  const pw = process.env.TEST_PASSWORD || (randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g,'') + randomBytes(2).toString('hex')).slice(0,16)
  const html = emailHtml({ first: 'Jonny', appUrl: APP_URL, password: pw })
  console.log('DEBUG_APP_URL', APP_URL)
  const r = await sendOne(testTo, subject, html)
  console.log('✅ Test apology email sent:', r)
}

main().catch((e) => { console.error('SendGrid error:', e?.response?.body || e?.message || e); process.exit(1) })

