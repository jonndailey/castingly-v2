import { randomUUID } from 'crypto'
import { query, transaction } from '@/lib/db_mysql'

let initializationPromise: Promise<void> | null = null

async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS forum_categories (
      id CHAR(36) PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      access_level ENUM('public', 'actor', 'professional', 'vip') NOT NULL DEFAULT 'public',
      is_active TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      thread_count INT DEFAULT 0,
      post_count INT DEFAULT 0,
      last_post_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_forum_categories_access (access_level),
      INDEX idx_forum_categories_sort (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id CHAR(36) PRIMARY KEY,
      category_id CHAR(36) NOT NULL,
      user_id CHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content LONGTEXT NOT NULL,
      pinned TINYINT(1) DEFAULT 0,
      locked TINYINT(1) DEFAULT 0,
      view_count INT DEFAULT 0,
      reply_count INT DEFAULT 0,
      last_reply_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_forum_posts_category FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FULLTEXT KEY ft_forum_posts_content (title, content),
      INDEX idx_forum_posts_category (category_id),
      INDEX idx_forum_posts_user (user_id),
      INDEX idx_forum_posts_pinned (pinned),
      INDEX idx_forum_posts_locked (locked),
      INDEX idx_forum_posts_last_reply (last_reply_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS forum_replies (
      id CHAR(36) PRIMARY KEY,
      post_id CHAR(36) NOT NULL,
      parent_id CHAR(36) NULL,
      user_id CHAR(36) NOT NULL,
      content LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_forum_replies_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_replies_parent FOREIGN KEY (parent_id) REFERENCES forum_replies(id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_replies_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_forum_replies_post (post_id),
      INDEX idx_forum_replies_parent (parent_id),
      INDEX idx_forum_replies_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS forum_moderation_events (
      id CHAR(36) PRIMARY KEY,
      post_id CHAR(36) NOT NULL,
      performed_by CHAR(36),
      action ENUM('pin', 'unpin', 'lock', 'unlock', 'delete_post', 'delete_reply') NOT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_forum_mod_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_mod_user FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_forum_mod_action (action),
      INDEX idx_forum_mod_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

async function seedDefaultCategories() {
  const rows: any = await query(`SELECT COUNT(*) AS count FROM forum_categories`)
  const count = Array.isArray(rows) && rows.length ? Number(rows[0].count ?? 0) : 0
  if (count > 0) {
    return
  }

  const defaults = [
    {
      slug: 'public-forum',
      name: 'Public Forum',
      description: 'General discussions and platform updates accessible to all users.',
      access_level: 'public',
      sort_order: 1
    },
    {
      slug: 'actor-lounge',
      name: 'Actor Lounge',
      description: 'Peer support, audition prep, and career strategies for actors.',
      access_level: 'actor',
      sort_order: 2
    },
    {
      slug: 'industry-insights',
      name: 'Industry Insights',
      description: 'Professional discussions for agents and casting directors.',
      access_level: 'professional',
      sort_order: 3
    },
    {
      slug: 'investor-circle',
      name: 'Investor Circle',
      description: 'Exclusive updates and discussions for verified investors.',
      access_level: 'vip',
      sort_order: 4
    }
  ] as const

  for (const category of defaults) {
    await query(
      `INSERT INTO forum_categories (id, slug, name, description, access_level, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         access_level = VALUES(access_level),
         sort_order = VALUES(sort_order),
         is_active = VALUES(is_active)`,
      [
        randomUUID(),
        category.slug,
        category.name,
        category.description,
        category.access_level,
        category.sort_order
      ]
    )
  }
}

async function findUserByRole(role: 'actor' | 'agent' | 'casting_director' | 'admin') {
  const rows = await query(
    `SELECT id, name FROM users WHERE role = ? ORDER BY created_at ASC LIMIT 1`,
    [role]
  ) as Array<{ id: string; name?: string }>

  return rows.length
    ? {
        id: rows[0].id,
        name: (rows[0].name || role)
      }
    : null
}

async function seedSampleContent() {
  const postCountRows = await query(`SELECT COUNT(*) as count FROM forum_posts`) as Array<{ count: number }>
  if (postCountRows[0]?.count > 0) {
    return
  }

  const categories = await query(
    `SELECT id, slug FROM forum_categories WHERE slug IN (?, ?)`,
    ['public-forum', 'actor-lounge']
  ) as Array<{ id: string; slug: string }>

  const publicCategory = categories.find((cat) => cat.slug === 'public-forum')
  const actorCategory = categories.find((cat) => cat.slug === 'actor-lounge')

  if (!publicCategory || !actorCategory) {
    return
  }

  const adminUser = await findUserByRole('admin')
  const castingUser = await findUserByRole('casting_director')
  const agentUser = await findUserByRole('agent')
  const actorUser = await findUserByRole('actor')

  if (!adminUser || !castingUser || !agentUser || !actorUser) {
    console.warn('[forum-setup] Skipping forum sample seed because required user roles are missing')
    return
  }

  const now = new Date()

  type SeedReply = {
    id: string
    userId: string
    content: string
    createdAtOffsetMinutes: number
  }

  type SeedPost = {
    id: string
    categoryId: string
    userId: string
    title: string
    content: string
    pinned: boolean
    replies: SeedReply[]
  }

  const publicPosts: SeedPost[] = [
    {
      id: randomUUID(),
      categoryId: publicCategory.id,
      userId: adminUser.id,
      title: 'Welcome to the Castingly Community',
      content: `Thanks for joining the new Castingly forum! This space is where we share platform updates, casting wins, and best practices from across the industry.

Introduce yourself in the replies and let us know what you would like to see next.`,
      pinned: true,
      replies: [
        {
          id: randomUUID(),
          userId: agentUser.id,
          content: `Excited to have this forum live. I'll share a few workflow tips we've discovered while submitting talent through Castingly.`,
          createdAtOffsetMinutes: 15
        },
        {
          id: randomUUID(),
          userId: castingUser.id,
          content: `Welcome everyone! We have two pilot-season briefs dropping later this week—keep an eye out.`,
          createdAtOffsetMinutes: 90
        }
      ]
    },
    {
      id: randomUUID(),
      categoryId: publicCategory.id,
      userId: castingUser.id,
      title: 'Platform Roadmap Highlights',
      content: `Quick look at what is shipping next:
- Enhanced submission analytics for agents
- Callback scheduling inside the submissions dashboard
- Investor only forum coming next month

Drop questions or feature requests in this thread.`,
      pinned: false,
      replies: []
    }
  ]

  const actorPosts: SeedPost[] = [
    {
      id: randomUUID(),
      categoryId: actorCategory.id,
      userId: actorUser.id,
      title: 'Self-Tape Setup Checklist',
      content: `Sharing the checklist I run through before every self-tape:
1. Two-point lighting with daylight bulbs
2. Slate in landscape AND portrait
3. Backup audio running on my phone
4. Upload the tape to Castingly first to confirm playback

What are your go-to tips?`,
      pinned: false,
      replies: [
        {
          id: randomUUID(),
          userId: agentUser.id,
          content: `From the rep side: label files with \'Role_ActorName_Agency\' so casting can keep things organized.`,
          createdAtOffsetMinutes: 25
        }
      ]
    }
  ]

  await transaction(async (connection) => {
    const insertPost = async (post: SeedPost) => {
      const createdAt = new Date(now)
      await connection.execute(
        `INSERT INTO forum_posts (id, category_id, user_id, title, content, pinned, last_reply_at, reply_count, view_count, locked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          post.id,
          post.categoryId,
          post.userId,
          post.title,
          post.content,
          post.pinned ? 1 : 0,
          post.replies.length ? new Date(createdAt.getTime() + post.replies[post.replies.length - 1].createdAtOffsetMinutes * 60000) : createdAt,
          post.replies.length,
          0
        ]
      )

      for (const reply of post.replies) {
        const replyCreatedAt = new Date(createdAt.getTime() + reply.createdAtOffsetMinutes * 60000)
        await connection.execute(
          `INSERT INTO forum_replies (id, post_id, parent_id, user_id, content, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            reply.id,
            post.id,
            null,
            reply.userId,
            reply.content,
            replyCreatedAt,
            replyCreatedAt
          ]
        )
      }

      const totalMessages = 1 + post.replies.length
      const latestTimestamp = post.replies.length
        ? new Date(createdAt.getTime() + post.replies[post.replies.length - 1].createdAtOffsetMinutes * 60000)
        : createdAt

      await connection.execute(
        `UPDATE forum_categories
         SET thread_count = thread_count + 1,
             post_count = post_count + ?,
             last_post_at = ?
         WHERE id = ?`,
        [totalMessages, latestTimestamp, post.categoryId]
      )
    }

    for (const post of [...publicPosts, ...actorPosts]) {
      await insertPost(post)
    }
  })
}

async function initializeForum(): Promise<void> {
  await createTables()
  await seedDefaultCategories()
  await seedSampleContent()
}

export async function ensureForumSetup(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializeForum().catch((error) => {
      initializationPromise = null
      throw error
    })
  }
  return initializationPromise
}
