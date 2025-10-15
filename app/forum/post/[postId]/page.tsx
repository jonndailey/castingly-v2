'use client'

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Trash2,
  MessageSquarePlus
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'
import { forumClient } from '@/lib/forum-client'
import type { ForumPost, ForumReply } from '@/types/forum'
import { cn } from '@/lib/utils'

export default function ForumPostPage() {
  const params = useParams<{ postId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [performingAction, setPerformingAction] = useState(false)
  const [replyParentId, setReplyParentId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const postId = params?.postId

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!postId) {
      router.push('/forum')
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const data = await forumClient.getPost(user, postId)
        setPost(data.post)
        setReplies(data.replies)
      } catch (fetchError: any) {
        setError(fetchError.message || 'Unable to load this discussion.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [postId, router, user])

  const isAdmin = user?.role === 'admin'
  const isOwner = user && post && user.id === post.user_id
  const canReply = useMemo(() => {
    if (!user || !post) return false
    if (post.locked && !isAdmin) return false
    if (post.category?.access_level === 'public') return true
    if (post.category?.access_level === 'actor') {
      return user.role === 'actor' || isAdmin
    }
    if (post.category?.access_level === 'professional') {
      return ['agent', 'casting_director', 'admin'].includes(user.role)
    }
    if (post.category?.access_level === 'vip') {
      return isAdmin || user.is_verified_professional || user.is_investor || user.role === 'investor'
    }
    return false
  }, [user, post, isAdmin])

  const replyChildrenMap = useMemo(() => {
    const map = new Map<string | null, ForumReply[]>()
    replies.forEach((reply) => {
      const key = reply.parent_id || null
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(reply)
    })
    return map
  }, [replies])

  const topLevelReplies = replyChildrenMap.get(null) || []

  const refresh = async () => {
    if (!user || !postId) return
    try {
      const data = await forumClient.getPost(user, postId)
      setPost(data.post)
      setReplies(data.replies)
    } catch (refreshError: any) {
      setError(refreshError.message || 'Failed to refresh discussion.')
    }
  }

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !post || !replyContent.trim()) return
    setSubmittingReply(true)
    try {
      await forumClient.createReply(user, {
        postId: post.id,
        content: replyContent.trim(),
        parentId: replyParentId || undefined
      })
      setReplyContent('')
      setReplyParentId(null)
      setReplyingTo(null)
      await refresh()
    } catch (replyError: any) {
      setError(replyError.message || 'Reply failed. Please try again.')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDeletePost = async () => {
    if (!user || !post) return
    if (!confirm('Delete this entire discussion? This cannot be undone.')) {
      return
    }
    setPerformingAction(true)
    try {
      await forumClient.deletePost(user, post.id)
      router.push(post.category ? `/forum/category/${post.category.slug}` : '/forum')
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete post.')
    } finally {
      setPerformingAction(false)
    }
  }

  const handleDeleteReply = async (reply: ForumReply) => {
    if (!user || !post) return
    if (!confirm('Delete this reply?')) {
      return
    }
    try {
      await forumClient.deleteReply(user, post.id, reply.id)
      await refresh()
    } catch (deleteError: any) {
      setError(deleteError.message || 'Failed to delete reply.')
    }
  }

  const togglePinned = async () => {
    if (!user || !post) return
    setPerformingAction(true)
    try {
      const response = await forumClient.updatePost(user, post.id, { pinned: !post.pinned })
      setPost(response.post)
    } catch (updateError: any) {
      setError(updateError.message || 'Failed to update pinned state.')
    } finally {
      setPerformingAction(false)
    }
  }

  const toggleLocked = async () => {
    if (!user || !post) return
    setPerformingAction(true)
    try {
      const response = await forumClient.updatePost(user, post.id, { locked: !post.locked })
      setPost(response.post)
    } catch (updateError: any) {
      setError(updateError.message || 'Failed to update locked state.')
    } finally {
      setPerformingAction(false)
    }
  }

  const focusComposer = () => {
    const composer = document.getElementById('reply-composer')
    if (composer) {
      composer.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const startReplyTo = (reply: ForumReply) => {
    setReplyParentId(reply.id)
    const name = reply.author?.forum_display_name || reply.author?.name || 'Community member'
    setReplyingTo(name)
    focusComposer()
  }

  const resetReplyTarget = () => {
    setReplyParentId(null)
    setReplyingTo(null)
  }

  const renderReply = (reply: ForumReply, depth = 0): ReactElement => {
    const replyDisplayName =
      reply.author?.forum_display_name || reply.author?.name || 'Community member'
    const replyInitials = replyDisplayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
    const replyOwner = user && reply.user_id === user.id
    const childReplies = replyChildrenMap.get(reply.id) || []

    return (
      <div key={reply.id} className="space-y-3" style={{ marginLeft: depth * 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl border border-gray-100 bg-white p-4 shadow-sm',
            depth > 0 && 'border-l-4 border-purple-100'
          )}
        >
          <div className="flex items-start gap-4">
            <Avatar className="mt-1 h-9 w-9">
              <AvatarImage src={reply.author?.avatar_url || undefined} alt={replyDisplayName} />
              <AvatarFallback>{replyInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{replyDisplayName}</span>
                <Badge variant="outline" className="uppercase text-[10px]">
                  {reply.author?.role.replace('_', ' ')}
                </Badge>
                <span>•</span>
                <span>{format(new Date(reply.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {reply.content}
              </div>
              {canReply && (
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startReplyTo(reply)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Reply
                  </Button>
                  {(isAdmin || replyOwner) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReply(reply)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
            {!canReply && (isAdmin || replyOwner) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteReply(reply)}
                className="text-red-500 hover:text-red-600"
                title="Delete reply"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {childReplies.length > 0 && (
          <div className="space-y-3">
            {childReplies.map((child) => renderReply(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = post?.author?.forum_display_name || post?.author?.name || 'Community member'
  const authorInitials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <AppLayout>
      <PageHeader
        title={post ? post.title : 'Forum Discussion'}
        subtitle={post?.category ? `${post.category.name} • ${post.category.access_level.toUpperCase()}` : ''}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {isAdmin && post && (
              <>
                <Button
                  variant="outline"
                  onClick={togglePinned}
                  disabled={performingAction}
                  className={cn('flex items-center gap-2', post.pinned && 'border-amber-400 text-amber-600')}
                >
                  {post.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  {post.pinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleLocked}
                  disabled={performingAction}
                  className={cn('flex items-center gap-2', post.locked && 'border-red-400 text-red-600')}
                >
                  {post.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {post.locked ? 'Unlock' : 'Lock'}
                </Button>
              </>
            )}
            {(isAdmin || isOwner) && post && (
              <Button
                variant="danger"
                onClick={handleDeletePost}
                disabled={performingAction}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        }
      />
      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading conversation…</span>
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : post ? (
          <div className="space-y-8">
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-start gap-4">
                <Avatar className="mt-1">
                  <AvatarImage src={post.author?.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl font-semibold text-gray-900">{post.title}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span>
                      Posted by <span className="font-medium text-gray-700">{displayName}</span>
                    </span>
                    <span>•</span>
                    <span>
                      {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    <Badge variant="outline" className="uppercase text-xs">
                      {post.author?.role.replace('_', ' ')}
                    </Badge>
                    {post.pinned && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        Pinned
                      </Badge>
                    )}
                    {post.locked && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-gray-700">
                {post.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-purple-500" />
                  Replies ({replies.length})
                </h2>
                {canReply && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetReplyTarget()
                      focusComposer()
                    }}
                    className="w-full sm:w-auto"
                  >
                    Add Reply
                  </Button>
                )}
              </div>
              {topLevelReplies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
                  No replies yet. Join the conversation as the first voice below.
                </div>
              ) : (
                <div className="space-y-4">
                  {topLevelReplies.map((reply) => renderReply(reply, 0))}
                </div>
              )}
            </section>

            {canReply ? (
              <section>
                <Card className="border border-purple-100 shadow-sm" id="reply-composer">
                  <CardHeader>
                    <CardTitle className="text-lg">Join the conversation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleReplySubmit} className="space-y-4">
                      {replyingTo && (
                        <div className="flex items-center justify-between rounded-md border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-700">
                          Replying to <span className="font-medium">{replyingTo}</span>
                          <button
                            type="button"
                            onClick={resetReplyTarget}
                            className="text-xs underline underline-offset-2"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      <div>
                        <textarea
                          value={replyContent}
                          onChange={(event) => setReplyContent(event.target.value)}
                          rows={5}
                          placeholder="Add your perspective, experience, or feedback…"
                          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 placeholder:text-gray-400 transition"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Please keep discussions professional and respectful. Replies are visible to everyone with access to this forum.
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Posting as <span className="font-medium text-gray-600">{user.forum_display_name || user.name}</span>
                        </span>
                        <Button type="submit" disabled={submittingReply || !replyContent.trim()}>
                          {submittingReply ? 'Posting…' : 'Submit Reply'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </section>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Replies are disabled for your current access level.
              </div>
            )}
          </div>
        ) : null}
      </PageContent>
    </AppLayout>
  )
}
