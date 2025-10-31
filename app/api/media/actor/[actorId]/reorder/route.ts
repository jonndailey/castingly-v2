import { NextRequest, NextResponse } from 'next/server'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'
import { updateFileMetadata } from '@/lib/server/dmapi-service'

export async function POST(req: NextRequest, ctx: { params: Promise<{ actorId: string }> }) {
  try {
    const { actorId } = await ctx.params
    if (!actorId) return NextResponse.json({ error: 'actorId required' }, { status: 400 })

    const authz = req.headers.get('authorization') || ''
    if (!authz.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authz.slice('Bearer '.length)

    // Allow self, admin/agent/casting_director
    let allowed = false
    try {
      const v = await daileyCoreAuth.validateToken(token)
      const isSelf = v?.user?.id && String(v.user.id) === String(actorId)
      const roles = (v?.roles || []).map((r) => String(r).toLowerCase())
      allowed = Boolean(v?.valid && (isSelf || roles.includes('admin') || roles.includes('agent') || roles.includes('casting_director')))
    } catch {}
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const category = String(body?.category || '').toLowerCase()
    const order = Array.isArray(body?.order) ? body.order : []
    if (!category || !order.length) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    // Update metadata.order for each file id
    for (const item of order) {
      const id = String(item?.id || '')
      const ord = Number(item?.order)
      if (!id || !Number.isFinite(ord)) continue
      try { await updateFileMetadata(id, { order: ord, category }) } catch {}
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

