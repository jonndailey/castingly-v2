import type { ForumCategory, ForumPost, ForumReply } from '@/types/forum'
import type { User } from '@/lib/store/auth-store'

interface FetchOptions extends RequestInit {
  user?: User | null
}

function buildHeaders(user?: User | null, additional?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (additional) {
    Object.assign(headers, additional as Record<string, string>)
  }

  if (user) {
    headers['x-user-id'] = user.id
    headers['x-user-role'] = user.role
    if (user.is_verified_professional !== undefined) {
      headers['x-user-verified'] = String(user.is_verified_professional)
    }
    if (user.is_investor !== undefined) {
      headers['x-user-investor'] = String(user.is_investor)
    }
  }

  return headers
}

async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { user, headers, ...rest } = options
  const response = await fetch(url, {
    ...rest,
    headers: buildHeaders(user, headers),
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Forum request failed')
  }

  return response.json()
}

export const forumClient = {
  async getCategories(user: User | null): Promise<ForumCategory[]> {
    const data = await apiFetch<{ categories: ForumCategory[] }>('/api/forum/categories', { user })
    return data.categories
  },

  async getCategory(user: User | null, slug: string): Promise<ForumCategory | null> {
    const data = await apiFetch<{ category: ForumCategory }>(`/api/forum/categories/${slug}`, {
      user
    })
    return data.category ?? null
  },

  async getPosts(user: User | null, params: { categorySlug: string }): Promise<{ posts: ForumPost[]; category: ForumCategory }> {
    const query = new URLSearchParams({ categorySlug: params.categorySlug })
    const data = await apiFetch<{ posts: ForumPost[]; category: ForumCategory }>(
      `/api/forum/posts?${query.toString()}`,
      { user }
    )
    return data
  },

  async getPost(user: User | null, postId: string): Promise<{ post: ForumPost; replies: ForumReply[] }> {
    const data = await apiFetch<{ post: ForumPost; replies: ForumReply[] }>(
      `/api/forum/posts/${postId}`,
      { user }
    )
    return data
  },

  async searchPosts(user: User | null, query: string): Promise<ForumPost[]> {
    const params = new URLSearchParams({ q: query })
    const data = await apiFetch<{ posts: ForumPost[] }>(`/api/forum/search?${params.toString()}`, {
      user
    })
    return data.posts
  },

  async createPost(user: User, payload: { categorySlug: string; title: string; content: string }) {
    return apiFetch<{ post: ForumPost }>('/api/forum/posts', {
      method: 'POST',
      body: JSON.stringify({
        categorySlug: payload.categorySlug,
        title: payload.title,
        content: payload.content
      }),
      user
    })
  },

  async createReply(
    user: User,
    payload: { postId: string; content: string; parentId?: string | null }
  ) {
    return apiFetch<{ reply: ForumReply }>(`/api/forum/posts/${payload.postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({
        content: payload.content,
        parent_id: payload.parentId || null
      }),
      user
    })
  },

  async deletePost(user: User, postId: string) {
    return apiFetch<{ success: boolean }>(`/api/forum/posts/${postId}`, {
      method: 'DELETE',
      user
    })
  },

  async deleteReply(user: User, postId: string, replyId: string) {
    return apiFetch<{ success: boolean }>(`/api/forum/posts/${postId}/replies/${replyId}`, {
      method: 'DELETE',
      user
    })
  },

  async updatePost(
    user: User,
    postId: string,
    payload: Partial<Pick<ForumPost, 'title' | 'content' | 'pinned' | 'locked'>>
  ) {
    return apiFetch<{ post: ForumPost }>(`/api/forum/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      user
    })
  },

  async getActivity(user: User, targetUserId: string, limit = 5) {
    const params = new URLSearchParams({ limit: String(limit) })
    return apiFetch<{ posts: ForumPost[]; replies: ForumReply[] }>(
      `/api/forum/activity/${targetUserId}?${params.toString()}`,
      { user }
    )
  }
}
