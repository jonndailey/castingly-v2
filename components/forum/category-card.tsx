'use client'

import Link from 'next/link'
import type { ReactElement } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FolderKanban, Lock, Users, Star } from 'lucide-react'
import type { ForumCategory } from '@/types/forum'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const accessLevelLabels: Record<ForumCategory['access_level'], string> = {
  public: 'Public Forum',
  actor: 'Actors Only',
  professional: 'Industry Pros',
  vip: 'VIP Lounge'
}

const accessLevelIcons: Record<ForumCategory['access_level'], ReactElement> = {
  public: <Users className="w-4 h-4" />,
  actor: <Star className="w-4 h-4" />,
  professional: <FolderKanban className="w-4 h-4" />,
  vip: <Lock className="w-4 h-4" />
}

interface ForumCategoryCardProps {
  category: ForumCategory
  href: string
}

export function ForumCategoryCard({ category, href }: ForumCategoryCardProps) {
  const mostRecent = category.last_post_at
    ? formatDistanceToNow(new Date(category.last_post_at), { addSuffix: true })
    : 'No activity yet'

  return (
    <Link href={href} className="block">
      <Card className="transition-all hover:shadow-lg h-full border border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1 text-xs',
                category.access_level === 'public' && 'text-emerald-600 border-emerald-200',
                category.access_level === 'actor' && 'text-purple-600 border-purple-200',
                category.access_level === 'professional' && 'text-blue-600 border-blue-200',
                category.access_level === 'vip' && 'text-amber-600 border-amber-200'
              )}
            >
              {accessLevelIcons[category.access_level]}
              {accessLevelLabels[category.access_level]}
            </Badge>
            <CardTitle className="mt-3 text-xl font-semibold text-gray-900">
              {category.name}
            </CardTitle>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{category.thread_count} topics</p>
            <p>{category.post_count} posts</p>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <p className="line-clamp-3 leading-relaxed">{category.description || 'No description yet.'}</p>
          <div className="mt-4 text-xs text-gray-500">
            Latest activity: <span className="font-medium text-gray-700">{mostRecent}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
