import { NextRequest, NextResponse } from 'next/server'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'

export async function POST(request: NextRequest) {
  try {
    const { token, code, backup_code: backupCode } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'MFA challenge token is required' },
        { status: 400 }
      )
    }

    if (!code && !backupCode) {
      return NextResponse.json(
        { error: 'MFA code or backup code is required' },
        { status: 400 }
      )
    }

    const coreResult = await daileyCoreAuth.verifyMfaChallenge({
      challengeToken: token,
      code,
      backupCode
    })

    const castinglyUser = daileyCoreAuth.mapToCastinglyUser(coreResult.user)

    return NextResponse.json({
      user: castinglyUser,
      token: coreResult.access_token,
      refresh_token: coreResult.refresh_token,
      source: 'dailey-core'
    })
  } catch (error: any) {
    console.error('❌ MFA verification API error:', error)
    const message = error?.message || 'Failed to verify MFA code'
    const status = message.toLowerCase().includes('invalid') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
