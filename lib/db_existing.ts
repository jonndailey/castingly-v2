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

// Actor-specific queries adapted for existing production schema (users + profiles + media)
export const actors = {
  // Get all actors with basic info
  async getAll(limit = 100, offset = 0) {
    const rows = await query(
      `SELECT u.id, u.name, u.email,
              u.avatar_url AS avatar_url, p.bio
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.role = 'actor'
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];
    return rows;
  },

  // Get single actor with full profile
  async getById(id: string) {
    const rows = await query(
      `SELECT u.id, u.email, u.name, u.role, u.avatar_url AS profile_image,
              u.email_verified, u.forum_display_name, u.forum_signature,
              u.is_verified_professional, u.is_investor, u.forum_last_seen_at,
              u.created_at, u.updated_at,
              p.bio, p.location, p.height, p.eye_color, p.hair_color,
              p.skills, p.metadata AS profile_metadata
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ? AND u.role = 'actor'`,
      [id]
    ) as any[];
    const row = rows[0];
    if (!row) return undefined as any;
    // Normalize JSON skills to comma-delimited string for API consumers
    try {
      if (row && row.skills && typeof row.skills !== 'string') {
        const s = Array.isArray(row.skills) ? row.skills : JSON.parse(String(row.skills));
        if (Array.isArray(s)) row.skills = s.join(', ');
      }
    } catch {
      // leave as-is on parse failure
    }
    return row;
  },

  // Get actor's media
  async getMedia(actorId: string) {
    const rows = await query(
      `SELECT id, user_id, type, url, thumbnail_url, is_primary, caption, file_size,
              created_at
       FROM media
       WHERE user_id = ?
       ORDER BY is_primary DESC, created_at DESC`,
      [actorId]
    ) as any[];
    // Map to legacy-like shape expected by API route
    return rows.map((r: any) => ({
      id: r.id,
      media_type: r.type,
      media_url: r.url,
      is_primary: r.is_primary,
      caption: r.caption,
      created_at: r.created_at,
      file_size: r.file_size,
    }));
  },

  // Search actors
  async search(searchTerm: string) {
    const like = `%${searchTerm}%`;
    const rows = await query(
      `SELECT u.id, u.name, u.email,
              u.avatar_url AS avatar_url, p.bio
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.role = 'actor'
         AND (u.name LIKE ? OR u.email LIKE ? OR p.bio LIKE ? OR p.searchable_text LIKE ?)
       ORDER BY u.name`,
      [like, like, like, like]
    ) as any[];
    return rows;
  },

  // Get actors by skills
  async getBySkills(skills: string) {
    const like = `%${skills}%`;
    const rows = await query(
      `SELECT u.id, u.name, u.email,
              u.avatar_url AS avatar_url, p.bio, p.skills
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.role = 'actor' AND (JSON_SEARCH(p.skills, 'one', ?) IS NOT NULL OR p.searchable_text LIKE ?)
       ORDER BY u.name`,
      [skills, like]
    ) as any[];
    return rows;
  },

  // Get actor count
  async getCount() {
    const rows = await query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'actor'`
    ) as Array<{ count: number }>;
    return rows[0]?.count ?? 0;
  }
};

// Authentication helpers for existing schema
export const auth = {
  async findByEmail(email: string) {
    const rows = await query(
      `SELECT id, email, name, role, avatar_url,
              email_verified, forum_display_name, forum_signature,
              is_verified_professional, is_investor, forum_last_seen_at
       FROM users WHERE email = ?`,
      [email.toLowerCase()]
    ) as any[];
    return rows[0];
  },

  async verifyPassword(email: string, password: string) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const rows = await query(
      `SELECT id, email, name, role, avatar_url, email_verified,
              forum_display_name, forum_signature, is_verified_professional,
              is_investor, forum_last_seen_at
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

    if (userFields.length) {
      userValues.push(id)
      await query(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userValues)
    }

    // Update profiles table (production schema)
    const profileFields: string[] = []
    const profileValues: any[] = []

    if (data.location !== undefined) {
      profileFields.push('location = ?')
      profileValues.push(data.location)
    }
    if (data.bio !== undefined) {
      profileFields.push('bio = ?')
      profileValues.push(data.bio)
    }
    if (data.skills !== undefined) {
      // Cast to JSON array when provided as CSV string
      const skillsVal = Array.isArray(data.skills)
        ? JSON.stringify(data.skills)
        : JSON.stringify(String(data.skills).split(',').map(s => s.trim()).filter(Boolean))
      profileFields.push('skills = ?')
      profileValues.push(skillsVal)
    }
    if (data.height !== undefined) {
      profileFields.push('height = ?')
      profileValues.push(data.height)
    }
    if (data.eye_color !== undefined) {
      profileFields.push('eye_color = ?')
      profileValues.push(data.eye_color)
    }
    if (data.hair_color !== undefined) {
      profileFields.push('hair_color = ?')
      profileValues.push(data.hair_color)
    }
    if (data.resume_url !== undefined) {
      profileFields.push('resume_url = ?')
      profileValues.push(data.resume_url)
    }
    if (data.instagram !== undefined) {
      profileFields.push('instagram = ?')
      profileValues.push(data.instagram)
    }
    if (data.twitter !== undefined) {
      profileFields.push('twitter = ?')
      profileValues.push(data.twitter)
    }
    if (data.website !== undefined) {
      profileFields.push('website = ?')
      profileValues.push(data.website)
    }
    if (data.age_range !== undefined) {
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
