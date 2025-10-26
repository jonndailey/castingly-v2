import { NextRequest, NextResponse } from 'next/server'
import { profiles, query } from '@/lib/db_existing'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })

    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = auth.slice('Bearer '.length)

    let allowed = false
    let isSelf = false

    // Try Dailey Core validation first
    try {
      const validation = await daileyCoreAuth.validateToken(token)
      if (validation?.valid) {
        const roles = (validation.roles || []).map((r) => r.toLowerCase())
        isSelf = String(validation.user?.id || '') === String(id)
        allowed = isSelf || roles.includes('admin') || roles.includes('agent') || roles.includes('casting_director')
      }
    } catch {
      // ignore
    }

    // Fallback to legacy JWT (local Castingly auth)
    if (!allowed) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any
        const role = String(payload?.role || '').toLowerCase()
        const requesterId = String(payload?.id || '')
        isSelf = requesterId === String(id)
        allowed = isSelf || ['admin', 'agent', 'casting_director'].includes(role)
      } catch {
        // ignore
      }
    }

    // Dev-only: allow demo tokens for local testing
    if (!allowed && process.env.NODE_ENV !== 'production') {
      if (token.startsWith('demo-token') || token.startsWith('dev-impersonation-')) {
        allowed = true
      }
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = await request.json()

    // Ensure a user/profile row exists for this id; if missing, upsert from Core token
    try {
      const existing: any[] = (await query('SELECT id FROM users WHERE id = ? LIMIT 1', [id])) as any[]
      if (!existing || existing.length === 0) {
        // Try to derive basic identity from Core token
        try {
          const validation = await daileyCoreAuth.validateToken(token)
          const email = String(validation?.user?.email || '')
          const name = String(validation?.user?.name || email.split('@')[0] || id)
          const role = 'actor'
          // Minimal insert; password_hash required but unused for Core users
          await query(
            'INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, 1, 1)',
            [id, email || `${id}@castingly.local`, 'core-linked', name, role]
          )
        } catch {
          // Last resort: create a skeleton row so profile update succeeds
          await query(
            'INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, 1, 0)',
            [id, `${id}@unknown.local`, 'core-linked', id, 'actor']
          )
        }
        // Ensure profiles row exists
        await query('INSERT INTO profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id = user_id', [id])
      }
    } catch {
      // Non-fatal: continue to update attempt
    }
    await profiles.updateActorProfile(id, payload || {})

    // Persist preferences (e.g., hideProfileCompletion) into profiles.metadata
    try {
      const hide = payload?.preferences?.hideProfileCompletion
      if (typeof hide === 'boolean') {
        await query(
          `UPDATE profiles 
           SET metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.preferences.hideProfileCompletion', ?)
           WHERE user_id = ?`,
          [hide ? 1 : 0, id]
        )
      }
    } catch {}

    // Persist canonical avatar location into profiles.metadata.avatar when profile_image is an internal proxy URL
    try {
      const pi = String(payload?.profile_image || '')
      if (pi && pi.includes('/api/media/proxy?')) {
        const u = new URL(pi, 'https://castingly.dailey.dev')
        const bucket = u.searchParams.get('bucket') || null
        const userId = u.searchParams.get('userId') || null
        const folderPath = u.searchParams.get('path') || null
        const name = u.searchParams.get('name') || null
        if (bucket && userId && name) {
          await query(
            `UPDATE profiles 
             SET metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.avatar', JSON_OBJECT('bucket', ?, 'userId', ?, 'path', ?, 'name', ?))
             WHERE user_id = ?`,
            [bucket, userId, folderPath, name, id]
          )
        }
      }
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
