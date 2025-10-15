import { NextRequest, NextResponse } from 'next/server'
import { forumPosts, forumReplies } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const currentUser = await resolveForumUser(request)

    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view this activity' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10) || 5, 20)

    const [posts, replies] = await Promise.all([
      forumPosts.listRecentByUser(userId, limit),
      forumReplies.listRecentByUser(userId, limit)
    ])

    return NextResponse.json({
      posts,
      replies
    })
  } catch (error) {
    console.error('Failed to load forum activity:', error)
    return NextResponse.json(
      { error: 'Failed to load forum activity' },
      { status: 500 }
    )
  }
}
