import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { getRequestUser } from '@/lib/auth/request-user'
import { query } from '@/lib/db_existing'

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const rows = (await query('SELECT * FROM agencies WHERE user_id = ? LIMIT 1', [user.id])) as any[]
    return NextResponse.json({ agency: rows[0] || null })
  } catch (error) {
    console.error('[InsideConnect] Get agency failed:', error)
    return NextResponse.json({ error: 'Failed to load agency' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    const id = await connectDb.upsertAgency(user.id, {
      name: body.name,
      description: body.description,
      location: body.location,
      website: body.website,
      focus_tags: body.focus_tags,
      union_specialties: body.union_specialties,
      representation_types: body.representation_types,
      accepting_new_talent: Boolean(body.accepting_new_talent ?? true),
    })
    return NextResponse.json({ id })
  } catch (error) {
    console.error('[InsideConnect] Upsert agency failed:', error)
    return NextResponse.json({ error: 'Failed to save agency' }, { status: 500 })
  }
}

