'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Pin, Lock } from 'lucide-react'
import type { ForumPost } from '@/types/forum'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface ForumPostCardProps {
  post: ForumPost
  href: string
}

export function ForumPostCard({ post, href }: ForumPostCardProps) {
  const lastActivity = post.last_reply_at || post.updated_at || post.created_at
  const relativeTime = formatDistanceToNow(new Date(lastActivity), { addSuffix: true })

  const displayName = post.author?.forum_display_name || post.author?.name || 'Unknown member'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <Link href={href} className="block">
      <Card className="border border-gray-100 hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={post.author?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {post.pinned && (
                    <Badge className="flex items-center gap-1 bg-amber-100 text-amber-700 border-amber-200">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </Badge>
                  )}
                  {post.locked && (
                    <Badge className="flex items-center gap-1 bg-red-100 text-red-700 border-red-200">
                      <Lock className="w-3 h-3" />
                      Locked
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Started by <span className="font-medium text-gray-700">{displayName}</span> •{' '}
                  {relativeTime}
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{post.content}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.reply_count}</span>
              </div>
              <div className="text-xs text-gray-400">
                Views: <span className="font-medium text-gray-600">{post.view_count}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
