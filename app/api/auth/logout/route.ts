import { NextRequest, NextResponse } from 'next/server'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const refreshToken: string | undefined = body?.refresh_token || body?.refreshToken
    if (refreshToken && typeof refreshToken === 'string') {
      try {
        await daileyCoreAuth.logout(refreshToken)
      } catch (e) {
        // Swallow upstream CORS/network issues; client logout proceeds regardless
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

