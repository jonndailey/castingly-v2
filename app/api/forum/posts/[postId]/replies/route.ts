import { NextRequest, NextResponse } from 'next/server'
import { forumCategories, forumPosts, forumReplies, canAccessCategory } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params
    const user = await resolveForumUser(request)
    const post = await forumPosts.getById(postId)

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const category = post.category || (await forumCategories.getById(post.category_id))

    if (category && !canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to view this post' },
        { status: 403 }
      )
    }

    const replies = await forumReplies.listByPost(post.id)
    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Failed to load replies:', error)
    return NextResponse.json(
      { error: 'Failed to load replies' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params
    const user = await resolveForumUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication is required to reply' },
        { status: 401 }
      )
    }

    const post = await forumPosts.getById(postId)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.locked && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'This post has been locked by moderators' },
        { status: 423 }
      )
    }

    const category = post.category || (await forumCategories.getById(post.category_id))

    if (category && !canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to reply in this forum' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, parent_id } = body as {
      content?: string
      parent_id?: string
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      )
    }

    const reply = await forumReplies.create({
      post_id: post.id,
      user_id: user.id,
      content,
      parent_id
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Failed to create reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
