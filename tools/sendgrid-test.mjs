#!/usr/bin/env node
import 'dotenv/config'
// Send a welcome email using SendGrid.
// Usage: TO=jonny@dailey.llc node tools/sendgrid-test.mjs

import sgMail from '@sendgrid/mail'

const API_KEY = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@castingly.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Castingly'
const TO = process.env.TO || 'jonny@dailey.llc'
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://castingly.dailey.dev').replace(/\/$/, '')

async function main() {
  if (!API_KEY) throw new Error('SENDGRID_API_KEY or SEND_GRID_API_KEY not set')
  sgMail.setApiKey(API_KEY)
  const html = `
  <div style="font-family:Arial, Helvetica, sans-serif;color:#111827">
    <h2 style="color:#7c3aed;margin:0 0 8px 0">Welcome to Castingly!</h2>
    <p style="margin:0 0 12px 0">Your account is ready to go.</p>
    <p style="margin:0 0 20px 0"><a href="${APP_URL}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:600">Open Castingly</a></p>
    <p style="font-size:12px;color:#6b7280">If the button doesn’t work, copy and paste: ${APP_URL}</p>
  </div>`
  const msg = {
    to: TO,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'Welcome to Castingly',
    html,
  }
  const [resp] = await sgMail.send(msg)
  console.log('Sent:', resp.statusCode, resp.headers['x-message-id'] || '')
}

main().catch((e) => { console.error('SendGrid error:', e?.response?.body || e?.message || e); process.exit(1) })
