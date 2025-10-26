import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { getRequestUser } from '@/lib/auth/request-user'

export async function PUT(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    await connectDb.upsertActorPrefs(user.id, {
      visibility: body?.visibility,
      allow_contact: typeof body?.allow_contact === 'boolean' ? body.allow_contact : undefined,
      metadata: body?.metadata,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[InsideConnect] Update prefs failed:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}

