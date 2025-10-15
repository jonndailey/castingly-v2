import { NextRequest, NextResponse } from 'next/server'
import { forumCategories, forumPosts, forumReplies, canAccessCategory, forumModeration } from '@/lib/forum'
import { resolveForumUser } from '@/lib/forum-auth'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string; replyId: string }> }
) {
  try {
    const { postId, replyId } = await context.params
    const user = await resolveForumUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication is required' },
        { status: 401 }
      )
    }

    const reply = await forumReplies.getById(replyId)
    if (!reply || reply.post_id !== postId) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    const post = await forumPosts.getById(reply.post_id)
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const category = post.category || (await forumCategories.getById(post.category_id))
    if (category && !canAccessCategory(user, category.access_level)) {
      return NextResponse.json(
        { error: 'You do not have permission to moderate this reply' },
        { status: 403 }
      )
    }

    const isOwner = user.id === reply.user_id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the author or an admin can delete this reply' },
        { status: 403 }
      )
    }

    await forumReplies.delete(reply.id)

    if (isAdmin) {
      await forumModeration.recordEvent({
        post_id: post.id,
        performed_by: user.id,
        action: 'delete_reply',
        metadata: { replyId: reply.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reply:', error)
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    )
  }
}
