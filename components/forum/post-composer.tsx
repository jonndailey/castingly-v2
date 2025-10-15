'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { User } from '@/lib/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ForumPostComposerProps {
  user: User
  categoryName: string
  onSubmit: (payload: { title: string; content: string }) => Promise<void>
  isSubmitting?: boolean
}

export function ForumPostComposer({
  user,
  categoryName,
  onSubmit,
  isSubmitting
}: ForumPostComposerProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('A clear topic title helps others understand your post.')
      return
    }

    if (!content.trim()) {
      setError('Please add some details so the community can respond.')
      return
    }

    try {
      await onSubmit({ title: title.trim(), content: content.trim() })
      setTitle('')
      setContent('')
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to publish your post.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-purple-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Start a new conversation in <span className="text-purple-600">{categoryName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Topic title
              </label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What would you like to discuss?"
                maxLength={255}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-400">
                Posting as <span className="font-medium text-gray-600">{user.forum_display_name || user.name}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Details
              </label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share insights, ask questions, or add context for fellow members…"
                rows={6}
                className={cn(
                  'mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition',
                  'placeholder:text-gray-400'
                )}
              />
              <p className="mt-1 text-xs text-gray-400">
                Markdown support coming soon. For now, keep paragraphs short for readability.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Community guidelines apply. Be respectful and keep discussions on topic.
              </span>
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                {isSubmitting ? 'Posting…' : 'Publish Topic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
