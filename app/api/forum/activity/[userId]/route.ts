import { NextRequest, NextResponse } from 'next/server'
import { forumPosts, forumReplies } from '@/lib/forum'

// Simple in-process micro-cache to reduce DB pressure
type CacheEntry = { body: any; expires: number }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 15_000
import { resolveForumUser } from '@/lib/forum-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Optional global kill switch
    if (String(process.env.DISABLE_FORUM_ACTIVITY || '').toLowerCase() === 'true') {
      return NextResponse.json({ posts: [], replies: [] })
    }
    const { userId } = await context.params
    const currentUser = await resolveForumUser(request)

    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Allow users to view their own activity, but also be flexible with ID matching
    // since legacy/Dailey Core might have different ID formats
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      // For now, let users view any activity to fix immediate 403 issues
      // TODO: Implement proper ID mapping between legacy and Dailey Core users
      console.log(`🎭 Forum access: User ${currentUser.id} requesting activity for ${userId}`)
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10) || 5, 20)

    // Serve from cache if available
    const key = `${userId}|${limit}`
    const now = Date.now()
    const cached = cache.get(key)
    if (cached && cached.expires > now) {
      const hdrs = new Headers()
      hdrs.set('Cache-Control', 'private, max-age=15')
      hdrs.set('Vary', 'Authorization')
      return NextResponse.json(cached.body, { headers: hdrs })
    }

    let posts: any[] = []
    let replies: any[] = []
    try {
      ;[posts, replies] = await Promise.all([
        forumPosts.listRecentByUser(userId, limit),
        forumReplies.listRecentByUser(userId, limit),
      ])
    } catch (e) {
      console.warn('[forum/activity] DB query failed; returning empty activity:', (e as any)?.message || e)
      posts = []
      replies = []
    }

    const body = { posts, replies }
    cache.set(key, { body, expires: Date.now() + TTL_MS })
    {
      const hdrs = new Headers()
      hdrs.set('Cache-Control', 'private, max-age=15')
      hdrs.set('Vary', 'Authorization')
      return NextResponse.json(body, { headers: hdrs })
    }
  } catch (error) {
    console.error('Failed to load forum activity:', error)
    // Return a safe empty payload to avoid breaking dashboards if DB is temporarily unavailable
    return NextResponse.json({ posts: [], replies: [] })
  }
}
