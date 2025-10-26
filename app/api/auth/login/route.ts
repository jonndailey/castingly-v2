import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/db_existing'
import { resolveWebAvatarUrl } from '@/lib/image-url'
import { daileyCoreAuth } from '@/lib/auth/dailey-core'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('🎭 Castingly Login Attempt:', email)

    // 1) Try Dailey Core authentication first
    try {
      const coreAuthResult = await daileyCoreAuth.login(email, password)

      if ('mfa_required' in coreAuthResult) {
        console.log('🔐 Dailey Core requires MFA for:', email)
        return NextResponse.json({
          mfa_required: true,
          challenge_token: coreAuthResult.challenge_token,
          challenge_id: coreAuthResult.challenge_id,
          challenge_expires_in: coreAuthResult.challenge_expires_in,
          mfa_type: coreAuthResult.mfa_type,
          methods: coreAuthResult.methods,
          user: coreAuthResult.user,
          source: 'dailey-core',
        })
      }

      let castinglyUser = daileyCoreAuth.mapToCastinglyUser(coreAuthResult.user)
      // If our local DB defines a more specific role for this email, prefer it
      try {
        const local = await auth.findByEmail(email)
        if (local && local.role && local.role !== castinglyUser.role) {
          castinglyUser = { ...castinglyUser, role: local.role }
        }
      } catch {}
      console.log('✅ Dailey Core authentication successful for:', email)

      return NextResponse.json({
        user: castinglyUser,
        token: coreAuthResult.access_token,
        refresh_token: coreAuthResult.refresh_token,
        source: 'dailey-core',
      })
    } catch (coreError: any) {
      console.log('🎭 Dailey Core auth failed, falling back to legacy:', coreError?.message || coreError)
    }

    // 2) Fallback to legacy Castingly authentication (explicitly gated)
    const enableLegacyFallback = process.env.ENABLE_LEGACY_AUTH_FALLBACK === 'true' || process.env.NODE_ENV !== 'production'
    if (enableLegacyFallback) {
      try {
        const user = await auth.verifyPassword(email, password)

        if (user) {
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        )

        console.log('✅ Legacy authentication successful for:', email)

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url:
              resolveWebAvatarUrl(user.avatar_url, user.name) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=9C27B0&color=fff`,
            email_verified: user.email_verified,
            forum_display_name: user.forum_display_name || user.name,
            forum_signature: user.forum_signature || null,
            is_verified_professional: Boolean(user.is_verified_professional),
            is_investor: Boolean(user.is_investor),
            forum_last_seen_at: user.forum_last_seen_at
              ? new Date(user.forum_last_seen_at).toISOString()
              : null,
          },
          token,
          source: 'legacy',
        })
        }
      } catch (legacyError) {
        console.log('🎭 Legacy auth also failed:', legacyError)
      }
    }

    // If both auth methods failed
    console.error('❌ Both Dailey Core and legacy auth failed')
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
