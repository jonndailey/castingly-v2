import { NextRequest, NextResponse } from 'next/server'
import { profiles } from '@/lib/db_existing'
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
    await profiles.updateActorProfile(id, payload || {})
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
