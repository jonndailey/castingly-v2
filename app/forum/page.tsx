'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Compass } from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ForumCategoryCard } from '@/components/forum/category-card'
import { ForumPostCard } from '@/components/forum/post-card'
import { forumClient } from '@/lib/forum-client'
import useAuthStore from '@/lib/store/auth-store'
import type { ForumCategory, ForumPost } from '@/types/forum'

export default function ForumHomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ForumPost[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const data = await forumClient.getCategories(user)
        setCategories(data)
      } catch (fetchError: any) {
        setError(fetchError.message || 'Unable to load the forum right now.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, router])

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return

    if (!searchTerm.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setSearching(true)
    setHasSearched(true)
    try {
      const results = await forumClient.searchPosts(user, searchTerm.trim())
      setSearchResults(results)
    } catch (searchError: any) {
      setError(searchError.message || 'Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <PageHeader
        title="Community Forum"
        subtitle="Connect with actors, agents, casting directors, and investors across the Castingly network."
        actions={
          <Button onClick={() => router.push('/forum')} variant="outline" className="hidden md:flex">
            Refresh
          </Button>
        }
      />
      <PageContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <form onSubmit={handleSearch} className="relative flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search topics, questions, or discussions..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={searching}>
                {searching ? 'Searching…' : 'Search'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSearchResults([])
                  setHasSearched(false)
                }}
              >
                Clear
              </Button>
            </div>
          </form>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
              <Compass className="mx-auto mb-4 h-10 w-10 text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-700">No forums available yet</h2>
              <p className="mt-2 text-sm text-gray-500">
                Your account does not currently have access to any discussion boards. An administrator can
                invite you when new communities open up.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => (
                  <ForumCategoryCard
                    key={category.id}
                    category={category}
                    href={`/forum/category/${category.slug}`}
                  />
                ))}
              </div>

              {hasSearched && (
                <section className="mt-10 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                    <p className="text-sm text-gray-500">
                      {searchResults.length > 0
                        ? `Found ${searchResults.length} discussion${searchResults.length === 1 ? '' : 's'} matching "${searchTerm}".`
                        : 'No discussions found. Try a different phrase or keyword.'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    {searchResults.map((post) => (
                      <ForumPostCard key={post.id} post={post} href={`/forum/post/${post.id}`} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </motion.div>
      </PageContent>
    </AppLayout>
  )
}
