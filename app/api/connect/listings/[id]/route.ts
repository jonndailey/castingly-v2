import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { getRequestUser } from '@/lib/auth/request-user'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const listing = await connectDb.getListingById(id)
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ listing })
  } catch (error) {
    console.error('[InsideConnect] Get listing failed:', error)
    return NextResponse.json({ error: 'Failed to load listing' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const agencyId = await connectDb.getAgencyIdByUser(user.id)
    if (!agencyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    if (body?.status) {
      await connectDb.updateListingStatus(Number(id), body.status)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[InsideConnect] Update listing failed:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

