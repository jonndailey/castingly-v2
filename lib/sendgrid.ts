import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || process.env.SEND_GRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'no-reply@castingly.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Castingly'

export type SendGridResult = { delivered: boolean; id?: string; error?: string; status?: number }

export function isSendgridConfigured() {
  return Boolean(SENDGRID_API_KEY && FROM_EMAIL)
}

export async function sendWelcomeEmail(to: string, name?: string): Promise<SendGridResult> {
  if (!SENDGRID_API_KEY || !FROM_EMAIL) {
    return { delivered: false, error: 'sendgrid_not_configured' }
  }
  sgMail.setApiKey(SENDGRID_API_KEY)
  const subject = 'Welcome to Castingly!'
  const greeting = name && name.trim() ? `Hi ${name.trim()},` : 'Welcome,'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://castingly.dailey.dev'
  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fb;padding:24px 0;font-family:Arial, Helvetica, sans-serif;color:#111827">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:24px;box-shadow:0 2px 6px rgba(0,0,0,0.06)">
          <tr>
            <td align="left" style="font-size:18px;font-weight:600;color:#7c3aed">Castingly</td>
          </tr>
          <tr>
            <td style="padding-top:12px;font-size:16px;line-height:24px;">
              <p style="margin:0 0 12px 0">${greeting}</p>
              <p style="margin:0 0 12px 0">Thanks for joining Castingly. Your account is ready to go.</p>
              <p style="margin:0 0 20px 0">Click below to open your dashboard and start building your profile.</p>
              <p style="margin:0 0 20px 0">
                <a href="${appUrl}" style="background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600;display:inline-block">Open Castingly</a>
              </p>
              <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280">If the button doesn’t work, copy and paste this URL:</p>
              <p style="margin:0;font-size:13px;color:#7c3aed;word-break:break-all">${appUrl}</p>
              <p style="margin:20px 0 0 0">— The Castingly Team</p>
            </td>
          </tr>
        </table>
        <p style="font-size:12px;color:#6b7280;margin:12px 0 0 0">You are receiving this message because you signed up for Castingly.</p>
      </td>
    </tr>
  </table>
  `
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
  }
  try {
    const [resp] = await sgMail.send(msg)
    const id = resp.headers['x-message-id'] || resp.headers['x-message-id'.toLowerCase()] || undefined
    return { delivered: resp.statusCode < 300, id: Array.isArray(id) ? id[0] : id, status: resp.statusCode }
  } catch (e: any) {
    const status = e?.code || e?.response?.statusCode
    const error = e?.message || (e?.response && e.response.body && JSON.stringify(e.response.body)) || 'sendgrid_error'
    return { delivered: false, error, status }
  }
}

