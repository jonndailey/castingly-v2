import { randomUUID } from 'crypto'
import { query, transaction } from '@/lib/db_mysql'
import { resolveWebAvatarUrl } from '@/lib/image-url'
import { ensureForumSetup } from '@/lib/forum-setup'
import type {
  ForumAccessLevel,
  ForumCategory,
  ForumPost,
  ForumPostAuthor,
  ForumPostCategorySummary,
  ForumReply,
  ForumUserContext
} from '@/types/forum'

const ACCESS_LEVELS: ForumAccessLevel[] = ['public', 'actor', 'professional', 'vip']

async function ensureReady() {
  await ensureForumSetup()
}

export function getAccessibleLevelsForUser(user: ForumUserContext | null): ForumAccessLevel[] {
  if (!user) {
    return ['public']
  }

  if (user.role === 'admin') {
    return ACCESS_LEVELS
  }

  const levels: Set<ForumAccessLevel> = new Set(['public'])

  switch (user.role) {
    case 'actor':
      levels.add('actor')
      break
    case 'agent':
    case 'casting_director':
      levels.add('professional')
      if (user.is_verified_professional) {
        levels.add('vip')
      }
      break
    case 'investor':
      levels.add('vip')
      break
  }

  if (user.is_investor) {
    levels.add('vip')
  }

  return Array.from(levels)
}

export function canAccessCategory(user: ForumUserContext | null, accessLevel: ForumAccessLevel) {
  return getAccessibleLevelsForUser(user).includes(accessLevel)
}

function mapCategory(row: any): ForumCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    access_level: row.access_level,
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
    thread_count: Number(row.thread_count ?? 0),
    post_count: Number(row.post_count ?? 0),
    last_post_at: row.last_post_at ? new Date(row.last_post_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  }
}

function mapPost(row: any): ForumPost {
  return {
    id: row.id,
    category_id: row.category_id,
    user_id: row.user_id,
    title: row.title,
    content: row.content,
    pinned: Boolean(row.pinned),
    locked: Boolean(row.locked),
    view_count: Number(row.view_count ?? 0),
    reply_count: Number(row.reply_count ?? 0),
    last_reply_at: row.last_reply_at ? new Date(row.last_reply_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    author: row.author_id
      ? {
          id: row.author_id,
          name: row.author_name,
          // Use canonical avatar endpoint to avoid stale proxy pointers
          avatar_url: `/api/media/avatar/safe/${encodeURIComponent(String(row.author_id))}`,
          forum_display_name: row.author_forum_display_name,
          forum_signature: row.author_forum_signature,
          role: row.author_role
        }
      : undefined,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
          access_level: row.category_access_level
        }
      : undefined
  }
}

function mapReply(row: any): ForumReply {
  return {
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id,
    user_id: row.user_id,
    content: row.content,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    post_title: row.post_title,
    author: row.author_id
      ? {
          id: row.author_id,
          name: row.author_name,
          // Use canonical avatar endpoint to avoid stale proxy pointers
          avatar_url: `/api/media/avatar/safe/${encodeURIComponent(String(row.author_id))}`,
          forum_display_name: row.author_forum_display_name,
          forum_signature: row.author_forum_signature,
          role: row.author_role
        }
      : undefined
  }
}

export const forumCategories = {
  async list(user: ForumUserContext | null) {
    await ensureReady()
    const rows = await query(
      `SELECT * FROM forum_categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`
    ) as any[]
    const allowed = rows.filter((row) => canAccessCategory(user, row.access_level))
    return allowed.map(mapCategory)
  },

  async getBySlug(slug: string) {
    await ensureReady()
    const rows = await query(
      `SELECT * FROM forum_categories WHERE slug = ? LIMIT 1`,
      [slug]
    ) as any[]
    return rows.length ? mapCategory(rows[0]) : null
  },

  async getById(id: string) {
    await ensureReady()
    const rows = await query(
      `SELECT * FROM forum_categories WHERE id = ? LIMIT 1`,
      [id]
    ) as any[]
    return rows.length ? mapCategory(rows[0]) : null
  },

  async create(payload: {
    name: string
    slug: string
    description?: string
    access_level: ForumAccessLevel
    sort_order?: number
  }) {
    await ensureReady()
    const id = randomUUID()
    await query(
      `INSERT INTO forum_categories (id, slug, name, description, access_level, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.slug,
        payload.name,
        payload.description || null,
        payload.access_level,
        payload.sort_order ?? 0
      ]
    )
    const rows = await query(
      `SELECT * FROM forum_categories WHERE id = ?`,
      [id]
    ) as any[]
    return rows.length ? mapCategory(rows[0]) : null
  },

  async update(id: string, payload: Partial<Omit<ForumCategory, 'id' | 'created_at' | 'updated_at' | 'thread_count' | 'post_count' | 'last_post_at'>>) {
    await ensureReady()
    const fields: string[] = []
    const values: any[] = []

    if (payload.slug !== undefined) {
      fields.push('slug = ?')
      values.push(payload.slug)
    }
    if (payload.name !== undefined) {
      fields.push('name = ?')
      values.push(payload.name)
    }
    if (payload.description !== undefined) {
      fields.push('description = ?')
      values.push(payload.description)
    }
    if (payload.access_level !== undefined) {
      fields.push('access_level = ?')
      values.push(payload.access_level)
    }
    if (payload.is_active !== undefined) {
      fields.push('is_active = ?')
      values.push(payload.is_active)
    }
    if (payload.sort_order !== undefined) {
      fields.push('sort_order = ?')
      values.push(payload.sort_order)
    }

    if (!fields.length) {
      return this.getById(id)
    }

    values.push(id)
    await query(
      `UPDATE forum_categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    return this.getById(id)
  }
}

export const forumPosts = {
  async listByCategory(categoryId: string) {
    await ensureReady()
    const rows = await query(
      `SELECT 
        fp.*,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_posts fp
       INNER JOIN users u ON fp.user_id = u.id
       WHERE fp.category_id = ?
       ORDER BY 
         fp.pinned DESC,
         fp.last_reply_at IS NULL ASC,
       fp.last_reply_at DESC,
       fp.created_at DESC`,
      [categoryId]
    ) as any[]
    return rows.map(mapPost)
  },

  async search(term: string, accessibleLevels: ForumAccessLevel[]) {
    await ensureReady()
    if (!term.trim()) {
      return []
    }

    const rows = await query(
      `SELECT 
        fp.*,
        fc.name as category_name,
        fc.slug as category_slug,
        fc.access_level as category_access_level,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role,
        MATCH(fp.title, fp.content) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance
       FROM forum_posts fp
       INNER JOIN forum_categories fc ON fp.category_id = fc.id
       INNER JOIN users u ON fp.user_id = u.id
       WHERE fc.access_level IN (${accessibleLevels.map(() => '?').join(', ')})
         AND MATCH(fp.title, fp.content) AGAINST (? IN NATURAL LANGUAGE MODE)
       ORDER BY relevance DESC, fp.updated_at DESC
       LIMIT 50`,
      [...accessibleLevels, term, term]
    ) as any[]
    return rows.map(mapPost)
  },

  async listRecentByUser(userId: string, limit = 5) {
    await ensureReady()
    const rows = await query(
      `SELECT 
        fp.*,
        fc.name as category_name,
        fc.slug as category_slug,
        fc.access_level as category_access_level,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_posts fp
       INNER JOIN forum_categories fc ON fp.category_id = fc.id
       INNER JOIN users u ON fp.user_id = u.id
       WHERE fp.user_id = ?
       ORDER BY fp.created_at DESC
       LIMIT ?`,
      [userId, limit]
    ) as any[]
    return rows.map(mapPost)
  },

  async getById(postId: string) {
    await ensureReady()
    const rows = await query(
      `SELECT 
        fp.*,
        fc.name as category_name,
        fc.slug as category_slug,
        fc.access_level as category_access_level,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_posts fp
       INNER JOIN forum_categories fc ON fp.category_id = fc.id
       INNER JOIN users u ON fp.user_id = u.id
       WHERE fp.id = ?
       LIMIT 1`,
      [postId]
    ) as any[]
    return rows.length ? mapPost(rows[0]) : null
  },

  async create(payload: {
    category_id: string
    user_id: string
    title: string
    content: string
  }) {
    await ensureReady()
    const id = randomUUID()
    const now = new Date()

    await transaction(async (connection) => {
      await connection.execute(
        `INSERT INTO forum_posts (id, category_id, user_id, title, content, last_reply_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          payload.category_id,
          payload.user_id,
          payload.title,
          payload.content,
          now
        ]
      )

      await connection.execute(
        `UPDATE forum_categories 
         SET thread_count = thread_count + 1,
             post_count = post_count + 1,
             last_post_at = ?
         WHERE id = ?`,
        [now, payload.category_id]
      )
    })

    return this.getById(id)
  },

  async update(postId: string, payload: Partial<Pick<ForumPost, 'title' | 'content' | 'pinned' | 'locked'>>) {
    await ensureReady()
    const fields: string[] = []
    const values: any[] = []

    if (payload.title !== undefined) {
      fields.push('title = ?')
      values.push(payload.title)
    }
    if (payload.content !== undefined) {
      fields.push('content = ?')
      values.push(payload.content)
    }
    if (payload.pinned !== undefined) {
      fields.push('pinned = ?')
      values.push(payload.pinned)
    }
    if (payload.locked !== undefined) {
      fields.push('locked = ?')
      values.push(payload.locked)
    }

    if (!fields.length) {
      return this.getById(postId)
    }

    values.push(postId)
    await query(
      `UPDATE forum_posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    return this.getById(postId)
  },

  async incrementViewCount(postId: string) {
    await ensureReady()
    await query(
      `UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?`,
      [postId]
    )
  },

  async delete(postId: string) {
    await ensureReady()
    await transaction(async (connection) => {
      const [rows] = await connection.execute<any[]>(
        `SELECT category_id, reply_count 
         FROM forum_posts 
         WHERE id = ? 
         LIMIT 1`,
        [postId]
      )

      if (!rows.length) {
        return
      }

      const postRow: any = rows[0]
      const totalMessages = Number(postRow.reply_count ?? 0) + 1

      await connection.execute(
        `DELETE FROM forum_posts WHERE id = ?`,
        [postId]
      )

      await connection.execute(
        `UPDATE forum_categories
         SET thread_count = GREATEST(thread_count - 1, 0),
             post_count = GREATEST(post_count - ?, 0)
         WHERE id = ?`,
        [totalMessages, postRow.category_id]
      )
    })
  }
}

export const forumReplies = {
  async listByPost(postId: string) {
    await ensureReady()
    const rows = await query(
      `SELECT 
        fr.*,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_replies fr
       INNER JOIN users u ON fr.user_id = u.id
       WHERE fr.post_id = ?
       ORDER BY fr.created_at ASC`,
      [postId]
    ) as any[]
    return rows.map(mapReply)
  },

  async getById(replyId: string) {
    await ensureReady()
    const rows = await query(
      `SELECT 
        fr.*,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_replies fr
       INNER JOIN users u ON fr.user_id = u.id
       WHERE fr.id = ?
       LIMIT 1`,
      [replyId]
    ) as any[]
    return rows.length ? mapReply(rows[0]) : null
  },

  async create(payload: {
    post_id: string
    user_id: string
    content: string
    parent_id?: string | null
  }) {
    await ensureReady()
    const id = randomUUID()
    const now = new Date()

    await transaction(async (connection) => {
      await connection.execute(
        `INSERT INTO forum_replies (id, post_id, parent_id, user_id, content)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          payload.post_id,
          payload.parent_id || null,
          payload.user_id,
          payload.content
        ]
      )

      await connection.execute(
        `UPDATE forum_posts
         SET reply_count = reply_count + 1,
             last_reply_at = ?
         WHERE id = ?`,
        [now, payload.post_id]
      )

      await connection.execute(
        `UPDATE forum_categories
         SET post_count = post_count + 1,
             last_post_at = ?
         WHERE id = (SELECT category_id FROM forum_posts WHERE id = ?)`,
        [now, payload.post_id]
      )
    })

    const rows = await query(
      `SELECT 
        fr.*,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_replies fr
       INNER JOIN users u ON fr.user_id = u.id
       WHERE fr.id = ?`,
      [id]
    ) as any[]
    return rows.length ? mapReply(rows[0]) : null
  },

  async listRecentByUser(userId: string, limit = 5) {
    await ensureReady()
    const rows = await query(
      `SELECT 
        fr.*,
        fp.title as post_title,
        u.id as author_id,
        u.name as author_name,
        u.avatar_url as author_avatar_url,
        u.forum_display_name as author_forum_display_name,
        u.forum_signature as author_forum_signature,
        u.role as author_role
       FROM forum_replies fr
       INNER JOIN users u ON fr.user_id = u.id
       INNER JOIN forum_posts fp ON fr.post_id = fp.id
       WHERE fr.user_id = ?
       ORDER BY fr.created_at DESC
       LIMIT ?`,
      [userId, limit]
    ) as any[]
    return rows.map(mapReply)
  },

  async delete(replyId: string) {
    await ensureReady()
    await transaction(async (connection) => {
      const [rows] = await connection.execute<any[]>(
        `SELECT fr.post_id, fp.category_id
         FROM forum_replies fr
         INNER JOIN forum_posts fp ON fr.post_id = fp.id
         WHERE fr.id = ?
         LIMIT 1`,
        [replyId]
      )

      if (!rows.length) {
        return
      }

      const row: any = rows[0]

      await connection.execute(
        `DELETE FROM forum_replies WHERE id = ?`,
        [replyId]
      )

      await connection.execute(
        `UPDATE forum_posts
         SET reply_count = GREATEST(reply_count - 1, 0)
         WHERE id = ?`,
        [row.post_id]
      )

      await connection.execute(
        `UPDATE forum_categories
         SET post_count = GREATEST(post_count - 1, 0)
         WHERE id = ?`,
        [row.category_id]
      )
    })
  }
}

export const forumModeration = {
  async recordEvent(payload: {
    post_id: string
    performed_by: string | null
    action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete_post' | 'delete_reply'
    metadata?: any
  }) {
    await ensureReady()
    await query(
      `INSERT INTO forum_moderation_events (id, post_id, performed_by, action, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        payload.post_id,
        payload.performed_by,
        payload.action,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    )
  }
}

export type {
  ForumAccessLevel,
  ForumCategory,
  ForumPost,
  ForumPostAuthor,
  ForumPostCategorySummary,
  ForumReply,
  ForumUserContext
} from '@/types/forum'
