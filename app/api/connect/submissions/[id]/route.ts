import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { getRequestUser } from '@/lib/auth/request-user'

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await ctx.params
    const body = await request.json().catch(() => ({}))
    const status = String(body?.status || '')
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    await connectDb.updateSubmissionStatus(Number(id), status as any)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[InsideConnect] Update submission failed:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

