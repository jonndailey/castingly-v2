import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Create a connection pool for the existing casting_portal database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'casting_portal',
  user: process.env.DB_USER || 'nikon',
  password: process.env.DB_PASSWORD || '@0509man1hattaN',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper function to execute queries
export async function query(sql: string, params?: any[]) {
  const start = Date.now();
  try {
    const [rows] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    console.log('Executed query', { sql: sql.substring(0, 100), duration });
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Lightweight column introspection with memoization to support mixed schemas safely
type ColumnsCacheKey = string
const columnsCache = new Map<ColumnsCacheKey, { cols: Set<string>; ts: number }>()
const COLS_TTL_MS = 5 * 60 * 1000

async function getCurrentDbName(): Promise<string | undefined> {
  try {
    const rows = (await query('SELECT DATABASE() AS db')) as Array<{ db: string }>
    return rows?.[0]?.db || undefined
  } catch {
    return undefined
  }
}

async function getTableColumns(table: string): Promise<Set<string>> {
  const db = await getCurrentDbName()
  const key = `${db || 'default'}:${table}`
  const now = Date.now()
  const cached = columnsCache.get(key)
  if (cached && now - cached.ts < COLS_TTL_MS) return cached.cols
  try {
    const cols = (await query(
      db
        ? 'SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?'
        : 'SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?',
      db ? [db, table] : [table]
    )) as Array<{ name: string }>
    const set = new Set((cols || []).map((c) => c.name))
    columnsCache.set(key, { cols: set, ts: now })
    return set
  } catch {
    const empty = new Set<string>()
    columnsCache.set(key, { cols: empty, ts: now })
    return empty
  }
}

// Actor-specific queries adapted for existing production schema (users + profiles + media)
export const actors = {
  // Get all actors with basic info (prefer modern schema; fallback to legacy)
  async getAll(limit = 100, offset = 0) {
    try {
      return (await query(
        `SELECT u.id, u.name, u.email,
                u.avatar_url AS avatar_url, p.bio
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.role = 'actor'
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      )) as any[]
    } catch {
      // Legacy local schema
      return (await query(
        `SELECT 
           u.id,
           CONCAT_WS(' ', u.first_name, u.last_name) AS name,
           u.email,
           COALESCE(u.profile_image, a.profile_image) AS avatar_url,
           a.bio
         FROM users u
         LEFT JOIN actors a ON a.user_id = u.id
         WHERE u.role = 'actor'
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      )) as any[]
    }
  },

  // Get single actor with full profile (prefer modern; fallback legacy)
  async getById(id: string) {
    try {
      const pCols = await getTableColumns('profiles')
      const resumeSel = pCols.has('resume_url') ? 'p.resume_url,' : ''
      const rows = (await query(
        `SELECT u.id, u.email, u.name, u.role, u.avatar_url AS profile_image,
                u.email_verified, u.forum_display_name, u.forum_signature,
                u.is_verified_professional, u.is_investor, u.forum_last_seen_at,
                u.created_at, u.updated_at,
                u.phone,
                p.bio, p.location, p.height, p.eye_color, p.hair_color,
                p.skills, p.website, p.instagram, p.twitter, p.age_range, ${resumeSel}
                p.metadata AS profile_metadata
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.id = ? AND u.role = 'actor'`,
        [id]
      )) as any[]
      const row = rows[0]
      if (!row) return undefined as any
      try {
        if (row && row.skills && typeof row.skills !== 'string') {
          const s = Array.isArray(row.skills) ? row.skills : JSON.parse(String(row.skills))
          if (Array.isArray(s)) row.skills = s.join(', ')
        }
      } catch {}
      return row
    } catch {
      const rows = (await query(
        `SELECT 
           u.id,
           u.email,
           CONCAT_WS(' ', u.first_name, u.last_name) AS name,
           u.role,
           COALESCE(u.profile_image, a.profile_image) AS profile_image,
           (u.status = 'active') AS email_verified,
           u.forum_display_name,
           u.forum_signature,
           u.is_verified_professional,
           u.is_investor,
           u.forum_last_seen_at,
           u.created_at,
           u.updated_at,
           a.bio,
           NULL AS location,
           a.height,
           a.eye_color,
           a.hair_color,
           a.skills,
           NULL AS profile_metadata
         FROM users u
         LEFT JOIN actors a ON a.user_id = u.id
         WHERE u.id = ? AND u.role = 'actor'`,
        [id]
      )) as any[]
      const row = rows[0]
      if (!row) return undefined as any
      try {
        if (row && row.skills && typeof row.skills !== 'string') {
          const s = Array.isArray(row.skills) ? row.skills : JSON.parse(String(row.skills))
          if (Array.isArray(s)) row.skills = s.join(', ')
        }
      } catch {}
      return row
    }
  },

  // Get single user profile without restricting role (owner/admin views)
  async getByIdAnyRole(id: string) {
    try {
      const pCols = await getTableColumns('profiles')
      const resumeSel = pCols.has('resume_url') ? 'p.resume_url,' : ''
      const rows = (await query(
        `SELECT u.id, u.email, u.name, u.role, u.avatar_url AS profile_image,
                u.email_verified, u.forum_display_name, u.forum_signature,
                u.is_verified_professional, u.is_investor, u.forum_last_seen_at,
                u.created_at, u.updated_at,
                u.phone,
                p.bio, p.location, p.height, p.eye_color, p.hair_color,
                p.skills, p.website, p.instagram, p.twitter, p.age_range, ${resumeSel}
                p.metadata AS profile_metadata
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.id = ?`,
        [id]
      )) as any[]
      const row = rows[0]
      if (!row) return undefined as any
      try {
        if (row && row.skills && typeof row.skills !== 'string') {
          const s = Array.isArray(row.skills) ? row.skills : JSON.parse(String(row.skills))
          if (Array.isArray(s)) row.skills = s.join(', ')
        }
      } catch {}
      return row
    } catch {
      const rows = (await query(
        `SELECT 
           u.id,
           u.email,
           CONCAT_WS(' ', u.first_name, u.last_name) AS name,
           u.role,
           COALESCE(u.profile_image, a.profile_image) AS profile_image,
           (u.status = 'active') AS email_verified,
           u.forum_display_name,
           u.forum_signature,
           u.is_verified_professional,
           u.is_investor,
           u.forum_last_seen_at,
           u.created_at,
           u.updated_at,
           a.bio,
           NULL AS location,
           a.height,
           a.eye_color,
           a.hair_color,
           a.skills,
           NULL AS profile_metadata
         FROM users u
         LEFT JOIN actors a ON a.user_id = u.id
         WHERE u.id = ?`,
        [id]
      )) as any[]
      const row = rows[0]
      if (!row) return undefined as any
      try {
        if (row && row.skills && typeof row.skills !== 'string') {
          const s = Array.isArray(row.skills) ? row.skills : JSON.parse(String(row.skills))
          if (Array.isArray(s)) row.skills = s.join(', ')
        }
      } catch {}
      return row
    }
  },

  // Get actor's media (prefer modern media table; fallback to actor_media)
  async getMedia(actorId: string) {
    try {
      const rows = (await query(
        `SELECT id, user_id, type, url, thumbnail_url, is_primary, caption, file_size,
                created_at
         FROM media
         WHERE user_id = ?
         ORDER BY is_primary DESC, created_at DESC`,
        [actorId]
      )) as any[]
      return rows.map((r: any) => ({
        id: r.id,
        media_type: r.type,
        media_url: r.url,
        is_primary: r.is_primary,
        caption: r.caption,
        created_at: r.created_at,
        file_size: r.file_size,
      }))
    } catch {
      try {
        const rows = (await query(
          `SELECT id, actor_id, media_type, media_url, is_primary, caption, created_at
           FROM actor_media
           WHERE actor_id = ?
           ORDER BY is_primary DESC, created_at DESC`,
          [actorId]
        )) as any[]
        return rows.map((r: any) => ({
          id: r.id,
          media_type: r.media_type,
          media_url: r.media_url,
          is_primary: r.is_primary,
          caption: r.caption,
          created_at: r.created_at,
          file_size: null,
        }))
      } catch {
        return [] as any[]
      }
    }
  },

  // Search actors (prefer modern; fallback legacy)
  async search(searchTerm: string) {
    const like = `%${searchTerm}%`
    try {
      return (await query(
        `SELECT u.id, u.name, u.email,
                u.avatar_url AS avatar_url, p.bio
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.role = 'actor'
           AND (u.name LIKE ? OR u.email LIKE ? OR p.bio LIKE ? OR p.searchable_text LIKE ?)
         ORDER BY u.name`,
        [like, like, like, like]
      )) as any[]
    } catch {
      return (await query(
        `SELECT 
           u.id,
           CONCAT_WS(' ', u.first_name, u.last_name) AS name,
           u.email,
           COALESCE(u.profile_image, a.profile_image) AS avatar_url,
           a.bio
         FROM users u
         LEFT JOIN actors a ON a.user_id = u.id
         WHERE u.role = 'actor'
           AND (CONCAT_WS(' ', u.first_name, u.last_name) LIKE ? OR u.email LIKE ? OR a.bio LIKE ?)
         ORDER BY name`,
        [like, like, like]
      )) as any[]
    }
  },

  // Get actors by skills (prefer modern; fallback legacy)
  async getBySkills(skills: string) {
    const like = `%${skills}%`
    try {
      return (await query(
        `SELECT u.id, u.name, u.email,
                u.avatar_url AS avatar_url, p.bio, p.skills
         FROM users u
         LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.role = 'actor' AND (JSON_SEARCH(p.skills, 'one', ?) IS NOT NULL OR p.searchable_text LIKE ?)
         ORDER BY u.name`,
        [skills, like]
      )) as any[]
    } catch {
      return (await query(
        `SELECT 
           u.id,
           CONCAT_WS(' ', u.first_name, u.last_name) AS name,
           u.email,
           COALESCE(u.profile_image, a.profile_image) AS avatar_url,
           a.bio,
           a.skills
         FROM users u
         LEFT JOIN actors a ON a.user_id = u.id
         WHERE u.role = 'actor' AND (a.skills LIKE ? OR a.bio LIKE ?)
         ORDER BY name`,
        [like, like]
      )) as any[]
    }
  },

  // Get actor count (compatible both schemas)
  async getCount() {
    const rows = await query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'actor'`
    ) as Array<{ count: number }>
    return rows[0]?.count ?? 0
  }
}

// Authentication helpers for existing schema
export const auth = {
  async findByEmail(email: string) {
    // Try modern schema first (name/avatar_url, boolean email_verified)
    try {
      const rowsModern = await query(
        `SELECT 
            id,
            email,
            name,
            role,
            avatar_url,
            email_verified,
            forum_display_name,
            forum_signature,
            is_verified_professional,
            is_investor,
            forum_last_seen_at
         FROM users WHERE email = ?`,
        [email.toLowerCase()]
      ) as any[]
      if (rowsModern && rowsModern[0]) return rowsModern[0]
    } catch {}
    // Fallback to legacy schema (first_name/last_name, status)
    try {
      const rowsLegacy = await query(
        `SELECT 
            id,
            email,
            CONCAT_WS(' ', first_name, last_name) AS name,
            role,
            COALESCE(profile_image, '') AS avatar_url,
            (status = 'active') AS email_verified,
            forum_display_name,
            forum_signature,
            is_verified_professional,
            is_investor,
            forum_last_seen_at
         FROM users WHERE email = ?`,
        [email.toLowerCase()]
      ) as any[]
      return rowsLegacy[0]
    } catch {}
    return undefined as any
  },

  async verifyPassword(email: string, password: string) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const rows = await query(
      `SELECT 
          id,
          email,
          CONCAT_WS(' ', first_name, last_name) AS name,
          role,
          COALESCE(profile_image, '') AS avatar_url,
          (status = 'active') AS email_verified,
          forum_display_name,
          forum_signature,
          is_verified_professional,
          is_investor,
          forum_last_seen_at
       FROM users WHERE email = ? AND password_hash = ?`,
      [email.toLowerCase(), hashedPassword]
    ) as any[];
    
    if (rows[0]) {
      // Update last login 
      await query('UPDATE users SET last_login = NOW() WHERE id = ?', [rows[0].id]);
    }
    
    return rows[0];
  },

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor';
  }) {
    const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
    
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userData.email.toLowerCase(), hashedPassword, userData.firstName, userData.lastName, userData.role]
    ) as mysql.ResultSetHeader;
    
    const userId = result.insertId;
    
    // Create actor profile if role is actor
    if (userData.role === 'actor') {
      await query(
        `INSERT INTO actors (user_id, bio) VALUES (?, ?)`,
        [userId, `Professional ${userData.role}`]
      );
    }
    
    return { 
      id: userId, 
      email: userData.email, 
      name: `${userData.firstName} ${userData.lastName}`, 
      role: userData.role 
    };
  }
};

// Profile updates for existing schema
export const profiles = {
  async updateActorProfile(
    id: string,
    data: Partial<{
      first_name: string
      last_name: string
      phone: string
      location: string
      bio: string
      skills: string[] | string
      height: string
      eye_color: string
      hair_color: string
      profile_image: string
      resume_url: string
      instagram: string
      twitter: string
      website: string
      age_range: string
    }>
  ) {
    // Determine which columns exist in profiles table to avoid unknown column errors on mixed schemas
    let profileColumns = new Set<string>()
    try {
      const dbNameRows = (await query('SELECT DATABASE() as db')) as Array<{ db: string }>
      const dbName = dbNameRows?.[0]?.db || undefined
      const cols = (await query(
        dbName
          ? 'SELECT COLUMN_NAME as name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = \"profiles\"'
          : 'SELECT COLUMN_NAME as name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \"profiles\"',
        dbName ? [dbName] : undefined as any
      )) as Array<{ name: string }>
      profileColumns = new Set((cols || []).map((c) => c.name))
    } catch {
      // If this fails, proceed; we'll still update safe/default columns
    }
    function normalizeAvatarUrl(value: unknown): string | null {
      if (!value || typeof value !== 'string') return null
      const input = value.trim()
      if (!input) return null
      // If it already fits in column, keep as-is
      if (input.length <= 480) return input
      // Try to build a short proxy URL from known S3 path shape
      try {
        const u = new URL(input)
        const parts = u.pathname.split('/').filter(Boolean)
        const idx = parts.indexOf('files')
        if (idx >= 0 && parts.length >= idx + 4) {
          const userId = parts[idx + 1]
          const bucket = parts[idx + 2]
          const name = parts[parts.length - 1]
          const pathParts = parts.slice(idx + 3, parts.length - 1) // between bucket and name
          const folderPath = pathParts.join('/')
          const qs = new URLSearchParams()
          qs.set('bucket', bucket)
          qs.set('userId', userId)
          if (folderPath) qs.set('path', folderPath)
          qs.set('name', name)
          const proxy = `/api/media/proxy?${qs.toString()}`
          if (proxy.length <= 500) return proxy
        }
      } catch {}
      // Fallback: drop query string which is the main size contributor
      const base = input.split('?')[0]
      if (base.length <= 500) return base
      // As a last resort, return null to avoid DB error
      return null
    }
    // Update users table (new schema fields)
    const userFields: string[] = []
    const userValues: any[] = []

    // If client supplies an avatar as profile_image, map to users.avatar_url
    if (data.profile_image !== undefined) {
      const safe = normalizeAvatarUrl(data.profile_image)
      userFields.push('avatar_url = ?')
      userValues.push(safe)
    }

    // Some callers may send first/last; if present, combine into name
    if (data.first_name !== undefined || data.last_name !== undefined) {
      userFields.push('name = ?')
      const first = (data.first_name || '').trim()
      const last = (data.last_name || '').trim()
      userValues.push([first, last].filter(Boolean).join(' ') || null)
    }
    if (data.phone !== undefined) {
      userFields.push('phone = ?')
      userValues.push(data.phone)
    }
    if ((data as any).forum_display_name !== undefined) {
      userFields.push('forum_display_name = ?')
      userValues.push((data as any).forum_display_name)
    }
    if ((data as any).forum_signature !== undefined) {
      userFields.push('forum_signature = ?')
      userValues.push((data as any).forum_signature)
    }

    if (userFields.length) {
      userValues.push(id)
      await query(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userValues)
    }

    // Update profiles table (production schema)
    const profileFields: string[] = []
    const profileValues: any[] = []

    if (data.location !== undefined && profileColumns.has('location')) {
      profileFields.push('location = ?')
      profileValues.push(data.location)
    }
    if (data.bio !== undefined && profileColumns.has('bio')) {
      profileFields.push('bio = ?')
      profileValues.push(data.bio)
    }
    if (data.skills !== undefined && profileColumns.has('skills')) {
      // Cast to JSON array when provided as CSV string
      const skillsVal = Array.isArray(data.skills)
        ? JSON.stringify(data.skills)
        : JSON.stringify(String(data.skills).split(',').map(s => s.trim()).filter(Boolean))
      profileFields.push('skills = ?')
      profileValues.push(skillsVal)
    }
    if (data.height !== undefined && profileColumns.has('height')) {
      profileFields.push('height = ?')
      profileValues.push(data.height)
    }
    if (data.eye_color !== undefined && profileColumns.has('eye_color')) {
      profileFields.push('eye_color = ?')
      profileValues.push(data.eye_color)
    }
    if (data.hair_color !== undefined && profileColumns.has('hair_color')) {
      profileFields.push('hair_color = ?')
      profileValues.push(data.hair_color)
    }
    if (data.resume_url !== undefined && profileColumns.has('resume_url')) {
      profileFields.push('resume_url = ?')
      profileValues.push(data.resume_url)
    }
    if (data.instagram !== undefined && profileColumns.has('instagram')) {
      profileFields.push('instagram = ?')
      profileValues.push(data.instagram)
    }
    if (data.twitter !== undefined && profileColumns.has('twitter')) {
      profileFields.push('twitter = ?')
      profileValues.push(data.twitter)
    }
    if (data.website !== undefined && profileColumns.has('website')) {
      profileFields.push('website = ?')
      profileValues.push(data.website)
    }
    if (data.age_range !== undefined && profileColumns.has('age_range')) {
      profileFields.push('age_range = ?')
      profileValues.push(data.age_range)
    }

    if (profileFields.length) {
      profileValues.push(id)
      await query(
        `UPDATE profiles SET ${profileFields.join(', ')} WHERE user_id = ?`,
        profileValues
      )
    }

    return true
  },
}

export default pool;
