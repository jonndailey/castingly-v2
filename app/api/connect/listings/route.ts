import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { getRequestUser } from '@/lib/auth/request-user'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const tags = (searchParams.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const location = searchParams.get('location') || undefined
    const union = searchParams.get('union') || undefined
    const limit = Number(searchParams.get('limit') || '20')
    const offset = Number(searchParams.get('offset') || '0')

    const listings = await connectDb.getListings({ q, tags, location, union, limit, offset, status: 'open' })
    return NextResponse.json({ listings })
  } catch (error) {
    console.error('[InsideConnect] List listings failed:', error)
    return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Agent owns an agency entry (upsert separately via /api/connect/agency if needed)
    const agencyId = await connectDb.getAgencyIdByUser(user.id)
    if (!agencyId) return NextResponse.json({ error: 'No agency profile for this user' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    if (!body?.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    const listingId = await connectDb.createListing(agencyId, {
      title: body.title,
      description: body.description,
      criteria: body.criteria,
    })
    return NextResponse.json({ id: listingId }, { status: 201 })
  } catch (error) {
    console.error('[InsideConnect] Create listing failed:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
}

