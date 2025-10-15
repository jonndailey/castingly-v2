'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { ForumPostCard } from '@/components/forum/post-card'
import { ForumPostComposer } from '@/components/forum/post-composer'
import { forumClient } from '@/lib/forum-client'
import useAuthStore from '@/lib/store/auth-store'
import type { ForumCategory, ForumPost } from '@/types/forum'

export default function ForumCategoryPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [category, setCategory] = useState<ForumCategory | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingPost, setCreatingPost] = useState(false)

  const slug = params?.slug

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!slug) {
      router.push('/forum')
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const data = await forumClient.getPosts(user, { categorySlug: slug })
        setCategory(data.category)
        setPosts(data.posts)
      } catch (fetchError: any) {
        setError(fetchError.message || 'Unable to load this forum category.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, slug, router])

  const canPost = useMemo(() => {
    if (!user || !category) return false
    if (category.access_level === 'public') return true
    if (category.access_level === 'actor') return user.role === 'actor' || user.role === 'admin'
    if (category.access_level === 'professional') {
      return ['agent', 'casting_director', 'admin'].includes(user.role)
    }
    if (category.access_level === 'vip') {
      return user.role === 'admin' || user.is_verified_professional || user.is_investor || user.role === 'investor'
    }
    return false
  }, [category, user])

  const refreshPosts = async () => {
    if (!user || !slug) return
    try {
      const data = await forumClient.getPosts(user, { categorySlug: slug })
      setPosts(data.posts)
    } catch (refreshError: any) {
      setError(refreshError.message || 'Failed to refresh posts.')
    }
  }

  const handleCreatePost = async (payload: { title: string; content: string }) => {
    if (!user || !category) return
    setCreatingPost(true)
    try {
      await forumClient.createPost(user, {
        categorySlug: category.slug,
        title: payload.title,
        content: payload.content
      })
      await refreshPosts()
    } finally {
      setCreatingPost(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <PageHeader
        title={category ? category.name : 'Forum'}
        subtitle={
          category
            ? category.description || 'Community-driven discussions.'
            : 'Loading forum category…'
        }
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/forum')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="outline" onClick={refreshPosts}>
              Refresh
            </Button>
          </div>
        }
      />
      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading discussions…</span>
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {category && canPost && user && (
              <ForumPostComposer
                user={user}
                categoryName={category.name}
                onSubmit={handleCreatePost}
                isSubmitting={creatingPost}
              />
            )}

            {category && !canPost && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Your role does not grant posting privileges here. You can still explore conversations.
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                  Be the first to start a conversation in this forum.
                </div>
              ) : (
                posts.map((post) => (
                  <ForumPostCard key={post.id} post={post} href={`/forum/post/${post.id}`} />
                ))
              )}
            </motion.div>
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}
