import { NextRequest, NextResponse } from 'next/server'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'
import { deleteFile } from '@/lib/server/dmapi-service'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ actorId: string; fileId: string }> }
) {
  try {
    const { actorId, fileId } = await context.params
    if (!actorId || !fileId) {
      return NextResponse.json({ error: 'Actor ID and File ID required' }, { status: 400 })
    }

    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = auth.slice('Bearer '.length)
    let allowed = false
    try {
      const validation = await daileyCoreAuth.validateToken(token)
      if (validation?.valid) {
        const roles = (validation.roles || []).map((r) => r.toLowerCase())
        const isSelf = String(validation.user?.id || '') === String(actorId)
        allowed = isSelf || roles.includes('admin') || roles.includes('agent') || roles.includes('casting_director')
      }
    } catch {}

    if (!allowed) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any
        const role = String(payload?.role || '').toLowerCase()
        const requesterId = String(payload?.id || '')
        const isSelf = requesterId === String(actorId)
        allowed = isSelf || ['admin', 'agent', 'casting_director'].includes(role)
      } catch {}
    }

    if (!allowed && process.env.NODE_ENV !== 'production' && (token.startsWith('demo-token') || token.startsWith('dev-impersonation-'))) {
      allowed = true
    }
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteFile(fileId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Actor DMAPI delete failed:', error)
    return NextResponse.json(
      { error: 'Delete failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
