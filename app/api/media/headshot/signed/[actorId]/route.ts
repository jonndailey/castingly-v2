import { NextRequest, NextResponse } from 'next/server'
import { validateUserToken, listFiles } from '@/lib/dmapi'

export async function GET(request: NextRequest, context: { params: Promise<{ actorId: string }> }) {
  try {
    const { actorId } = await context.params
    if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })

    const auth = await validateUserToken(request.headers.get('authorization'))
    if (!auth?.token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only the owner can request a signed headshot (keep it simple and safe)
    const isOwner = String(auth.userId) === String(actorId)
    if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // List caller's files and filter to headshots using DMAPI metadata/tags
    const resp = await listFiles(auth.token, { limit: 200, metadata: { category: 'headshot' } })
    const files = Array.isArray(resp?.files) ? resp.files : []
    if (files.length === 0) return NextResponse.json({ error: 'No headshot found' }, { status: 404 })

    // Prefer signed_url (private) or public_url (if any)
    const prefer = (arr: any[]) =>
      arr.find((f) => typeof f.signed_url === 'string' && f.signed_url.length > 0) ||
      arr.find((f) => typeof f.public_url === 'string' && f.public_url.length > 0) ||
      arr[0]
    const chosen = prefer(files)
    const url: string | null = chosen?.signed_url || chosen?.public_url || chosen?.url || null
    if (!url) return NextResponse.json({ error: 'No accessible URL for headshot' }, { status: 404 })

    return NextResponse.json({ url })
  } catch (e: any) {
    try { console.error('[headshot/signed] error:', e?.message || e) } catch {}
    return NextResponse.json({ error: 'Failed to resolve headshot' }, { status: 500 })
  }
}

