import { NextRequest, NextResponse } from 'next/server'
import { forumCategories, forumPosts, forumReplies, canAccessCategory, forumModeration } from '@/lib/forum'
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

    // Increment view count asynchronously but don't block response
    forumPosts.incrementViewCount(post.id).catch((error) =>
      console.warn('Failed to increment post view count', error)
    )

    const replies = await forumReplies.listByPost(post.id)

    return NextResponse.json({
      post,
      replies
    })
  } catch (error) {
    console.error('Failed to load forum post:', error)
    return NextResponse.json(
      { error: 'Failed to load forum post' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params
    const user = await resolveForumUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication is required' },
        { status: 401 }
      )
    }

    const post = await forumPosts.getById(postId)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const category = post.category || (await forumCategories.getById(post.category_id))
    if (category && !canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this post' },
        { status: 403 }
      )
    }

    const isOwner = user.id === post.user_id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the author or an admin can update this post' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updates: any = {}
    const moderationActions: Array<'pin' | 'unpin' | 'lock' | 'unlock'> = []

    if (body.title !== undefined) updates.title = body.title
    if (body.content !== undefined) updates.content = body.content

    if (body.pinned !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only administrators can pin or unpin posts' },
          { status: 403 }
        )
      }
      updates.pinned = Boolean(body.pinned)
      moderationActions.push(body.pinned ? 'pin' : 'unpin')
    }

    if (body.locked !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only administrators can lock or unlock posts' },
          { status: 403 }
        )
      }
      updates.locked = Boolean(body.locked)
      moderationActions.push(body.locked ? 'lock' : 'unlock')
    }

    const updated = await forumPosts.update(post.id, updates)

    await Promise.all(
      moderationActions.map((action) =>
        forumModeration.recordEvent({
          post_id: post.id,
          performed_by: user.id,
          action
        })
      )
    )

    return NextResponse.json({ post: updated })
  } catch (error) {
    console.error('Failed to update forum post:', error)
    return NextResponse.json(
      { error: 'Failed to update forum post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await context.params
    const user = await resolveForumUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication is required' },
        { status: 401 }
      )
    }

    const post = await forumPosts.getById(postId)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const category = post.category || (await forumCategories.getById(post.category_id))
    if (category && !canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this post' },
        { status: 403 }
      )
    }

    const isOwner = user.id === post.user_id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the author or an admin can delete this post' },
        { status: 403 }
      )
    }

    await forumPosts.delete(post.id)

    if (isAdmin) {
      await forumModeration.recordEvent({
        post_id: post.id,
        performed_by: user.id,
        action: 'delete_post'
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete forum post:', error)
    return NextResponse.json(
      { error: 'Failed to delete forum post' },
      { status: 500 }
    )
  }
}
