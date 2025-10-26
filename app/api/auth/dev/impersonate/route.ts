import { NextRequest, NextResponse } from 'next/server'
import { auth as legacyAuth, actors as legacyActors } from '@/lib/db_existing'
import { resolveWebAvatarUrl } from '@/lib/image-url'
import { isNonProduction } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    if (!isNonProduction()) {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await legacyAuth.findByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Try to enrich with actor avatar if applicable
    let avatarUrl = user.avatar_url || null
    if ((!avatarUrl || typeof avatarUrl !== 'string') && user.role === 'actor' && user.id) {
      try {
        const actor = await legacyActors.getById(String(user.id))
        avatarUrl = actor?.profile_image || actor?.avatar_url || null
      } catch {
        // ignore
      }
    }

    const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    // Ensure avatar is web-safe (allows approved relative paths)
    avatarUrl = resolveWebAvatarUrl(avatarUrl, name)
    const castinglyUser = {
      id: String(user.id),
      email: user.email,
      name,
      role: (user.role || 'actor') as 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor',
      avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9C27B0&color=fff`,
      email_verified: Boolean(user.email_verified ?? true),
      forum_display_name: name,
      forum_signature: null,
      is_verified_professional: Boolean(user.is_verified_professional),
      is_investor: Boolean(user.is_investor),
      forum_last_seen_at: user.forum_last_seen_at ? new Date(user.forum_last_seen_at).toISOString() : null,
    }

    return NextResponse.json({
      user: castinglyUser,
      token: `dev-impersonation-${Date.now()}`,
      refresh_token: null,
      source: 'demo',
    })
  } catch (error) {
    console.error('❌ Dev impersonation error:', error)
    return NextResponse.json({ error: 'Impersonation failed' }, { status: 500 })
  }
}
