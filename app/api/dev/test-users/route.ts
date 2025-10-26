import { NextRequest, NextResponse } from 'next/server'
import { actors } from '@/lib/db_existing'
import { isNonProduction } from '@/lib/env'

export async function GET(_req: NextRequest) {
  try {
    if (!isNonProduction()) {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    // Return first 100 actor accounts from legacy DB
    const list = await actors.getAll(100, 0)
    const users = (list || []).map((u: any) => {
      const name = u.name || u.email?.split('@')[0] || 'User'
      const rawAvatar: string | null = u.avatar_url || null
      const safeAvatar = rawAvatar && /^https?:\/\//i.test(rawAvatar)
        ? rawAvatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=9C27B0&color=fff`
      return {
      id: String(u.id),
      name,
      email: u.email,
      role: 'actor' as const,
      avatar_url: safeAvatar,
    }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('❌ Failed to list dev test users:', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
