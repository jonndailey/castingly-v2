import { NextRequest, NextResponse } from 'next/server'
import { forumPosts, getAccessibleLevelsForUser } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query') || ''

    if (!query.trim()) {
      return NextResponse.json({ posts: [], query: '' })
    }

    const user = await resolveForumUser(request)
    const levels = getAccessibleLevelsForUser(user)
    const posts = await forumPosts.search(query, levels)

    return NextResponse.json({
      posts,
      query,
      results: posts.length
    })
  } catch (error) {
    console.error('Forum search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search forum posts' },
      { status: 500 }
    )
  }
}
