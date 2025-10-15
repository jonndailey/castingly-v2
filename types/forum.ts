export type ForumAccessLevel = 'public' | 'actor' | 'professional' | 'vip'

export type ForumUserRole = 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor'

export interface ForumUserContext {
  id: string
  role: ForumUserRole
  is_verified_professional?: boolean
  is_investor?: boolean
}

export interface ForumCategory {
  id: string
  slug: string
  name: string
  description: string | null
  access_level: ForumAccessLevel
  is_active: boolean
  sort_order: number
  thread_count: number
  post_count: number
  last_post_at: string | null
  created_at: string
  updated_at: string
}

export interface ForumPostAuthor {
  id: string
  name: string
  avatar_url?: string | null
  forum_display_name?: string | null
  forum_signature?: string | null
  role: ForumUserRole
}

export interface ForumPostCategorySummary {
  id: string
  name: string
  slug: string
  access_level: ForumAccessLevel
}

export interface ForumPost {
  id: string
  category_id: string
  user_id: string
  title: string
  content: string
  pinned: boolean
  locked: boolean
  view_count: number
  reply_count: number
  last_reply_at: string | null
  created_at: string
  updated_at: string
  author?: ForumPostAuthor
  category?: ForumPostCategorySummary
}

export interface ForumReply {
  id: string
  post_id: string
  parent_id: string | null
  user_id: string
  content: string
  created_at: string
  updated_at: string
  author?: ForumPostAuthor
  post_title?: string
}
