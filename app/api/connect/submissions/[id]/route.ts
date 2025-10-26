import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { getRequestUser } from '@/lib/auth/request-user'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const agencyId = await connectDb.getAgencyIdByUser(user.id)
    if (!agencyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!body?.status) return NextResponse.json({ error: 'status required' }, { status: 400 })
    await connectDb.updateSubmissionStatus(Number(id), body.status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[InsideConnect] Update submission failed:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

