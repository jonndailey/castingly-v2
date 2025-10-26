'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, MessageSquareText, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { forumClient } from '@/lib/forum-client'
import useAuthStore from '@/lib/store/auth-store'
import type { ForumPost, ForumReply } from '@/types/forum'
import { cn } from '@/lib/utils'

interface ForumActivityPanelProps {
  userId: string
  className?: string
}

export function ForumActivityPanel({ userId, className }: ForumActivityPanelProps) {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!user || hasLoaded) return
    let cancelled = false
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await forumClient.getActivity(user, userId, 5)
        if (cancelled) return
        setPosts(data.posts)
        setReplies(data.replies)
        setHasLoaded(true)
      } catch (activityError: any) {
        if (cancelled) return
        setError(activityError.message || 'Unable to load forum activity.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // If small screen, defer until visible for better TTI
    const prefersDefer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 640px)').matches
    if (prefersDefer && rootRef.current && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          observer.disconnect()
          fetchData()
        }
      }, { rootMargin: '100px' })
      observer.observe(rootRef.current)
      return () => { cancelled = true; observer.disconnect() }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user, userId, hasLoaded])

  if (!user) {
    return null
  }

  return (
    <Card ref={rootRef} className={cn('border border-gray-100 shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          Recent Forum Activity
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/forum">Open Forum</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading activity…
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : posts.length === 0 && replies.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            No forum interactions yet. Join the conversation to build your reputation.
          </div>
        ) : (
          <>
            {posts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MessageSquareText className="w-4 h-4 text-purple-500" />
                  Latest Topics
                </div>
                <ul className="space-y-3">
                  {posts.map((post) => (
                    <li key={post.id} className="rounded-lg border border-gray-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <Link href={`/forum/post/${post.id}`} className="font-medium text-purple-600 hover:text-purple-700">
                          {post.title}
                        </Link>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {post.category?.name || 'Forum'}
                        </Badge>
                        <span>•</span>
                        <span>{post.reply_count} replies</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {replies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  Recent Replies
                </div>
                <ul className="space-y-3">
                  {replies.map((reply) => (
                    <li key={reply.id} className="rounded-lg border border-gray-100 bg-white p-3">
                      <div className="text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
                        {reply.content}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <Link
                          href={`/forum/post/${reply.post_id}`}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {reply.post_title || 'View discussion'}
                        </Link>
                        <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
