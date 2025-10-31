import { NextRequest, NextResponse } from 'next/server'
import { connectDb } from '@/lib/db_connect'
import { query } from '@/lib/db_existing'
import { getRequestUser } from '@/lib/auth/request-user'

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || undefined) as any
    const mode = searchParams.get('mode') || 'actor'
    let rows: any[] = []
    if (mode === 'agent') {
      // Map Core user id to local DB id via email, to match agencies.user_id
      let dbUserId = user.id
      if (user.email) {
        try {
          const found = (await query('SELECT id FROM users WHERE email = ? LIMIT 1', [user.email])) as Array<{ id: string }>
          if (found?.[0]?.id) dbUserId = String(found[0].id)
        } catch {}
      }
      rows = await connectDb.listInboxForAgent(dbUserId, status)
    } else {
      rows = await connectDb.listSubmissionsForActor(user.id, status)
    }
    return NextResponse.json({ submissions: rows })
  } catch (error) {
    console.error('[InsideConnect] List submissions failed:', error)
    return NextResponse.json({ error: 'Failed to load submissions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    if (!body?.target_type || !body?.target_id) {
      return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 })
    }
    const id = await connectDb.createSubmission(user.id, {
      target_type: body.target_type,
      target_id: Number(body.target_id),
      cover_letter: body.cover_letter,
      links: body.links,
      score: body.score,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch (error) {
    console.error('[InsideConnect] Create submission failed:', error)
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
