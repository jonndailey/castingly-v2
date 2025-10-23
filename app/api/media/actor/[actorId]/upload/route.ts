import { NextRequest, NextResponse } from 'next/server'
import { uploadFileForActor } from '@/lib/server/dmapi-service'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'
import { type MediaCategory } from '@/lib/dmapi'
import { actors as legacyActors } from '@/lib/db_existing'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function toCategory(value?: string | null): MediaCategory {
  switch ((value || '').toLowerCase()) {
    case 'headshot':
    case 'reel':
    case 'resume':
    case 'self_tape':
    case 'voice_over':
    case 'document':
      return value as MediaCategory
    default:
      return 'other'
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ actorId: string }> }
) {
  try {
    const { actorId } = await context.params
    if (!actorId) {
      return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })
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
        const isSelf = validation.user?.id && String(validation.user.id) === String(actorId)
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

    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File missing' }, { status: 400 })
    }
    const category = toCategory(form.get('category')?.toString())

    // Enrich metadata with actor reference
    let actorEmail: string | undefined
    try {
      const actor = await legacyActors.getById(actorId)
      actorEmail = actor?.email
    } catch {}

    const metadata = {
      actor: {
        id: String(actorId),
        email: actorEmail,
      },
    }

    const dmapiResponse = await uploadFileForActor({
      actorId,
      file,
      filename: (form.get('title')?.toString() || (file as File).name) as string,
      category,
      metadata,
    })

    return NextResponse.json(dmapiResponse)
  } catch (error) {
    console.error('Actor DMAPI upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
