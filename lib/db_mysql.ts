import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'castingly',
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

// Helper function to get a connection from the pool
export async function getConnection() {
  return await pool.getConnection();
}

// Helper function for transactions
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Actor-specific queries
export const actors = {
  // Get all actors with basic info
  async getAll(limit = 100, offset = 0) {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, p.location, p.bio
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
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
      `SELECT u.*, p.*
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.role = 'actor'`,
      [id]
    ) as any[];
    return rows[0];
  },

  // Get actor's media
  async getMedia(actorId: string) {
    const rows = await query(
      `SELECT * FROM media
       WHERE user_id = ?
       ORDER BY order_index, created_at`,
      [actorId]
    ) as any[];
    return rows;
  },

  // Search actors
  async search(searchTerm: string) {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, p.location, p.bio
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'actor' 
       AND (u.name LIKE ? OR u.email LIKE ? OR p.bio LIKE ?)
       ORDER BY u.name`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    ) as any[];
    return rows;
  },

  // Get actors by location
  async getByLocation(location: string) {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, p.location, p.bio
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'actor' AND p.location LIKE ?
       ORDER BY u.name`,
      [`%${location}%`]
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

// Authentication helpers
export const auth = {
  async findByEmail(email: string) {
    const rows = await query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    ) as any[];
    return rows[0];
  },

  async verifyPassword(email: string, password: string) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const rows = await query(
      'SELECT * FROM users WHERE email = ? AND password_hash = ?',
      [email.toLowerCase(), hashedPassword]
    ) as any[];
    
    if (rows[0]) {
      // Update last login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [rows[0].id]
      );
    }
    
    return rows[0];
  },

  async createUser(userData: {
    id?: string;
    email: string;
    password: string;
    name: string;
    role: 'actor' | 'agent' | 'casting_director' | 'admin' | 'investor';
  }) {
    const id = userData.id || crypto.randomUUID();
    const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
    
    await query(
      `INSERT INTO users (id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userData.email.toLowerCase(), hashedPassword, userData.name, userData.role]
    );
    
    // Create empty profile
    await query(
      `INSERT INTO profiles (user_id) VALUES (?)`,
      [id]
    );
    
    return { id, email: userData.email, name: userData.name, role: userData.role };
  }
};

// Media helpers
export const media = {
  async create(mediaData: {
    userId: string;
    type: 'headshot' | 'resume' | 'reel' | 'clip' | 'self_tape';
    url: string;
    caption?: string;
    isPrimary?: boolean;
  }) {
    const id = crypto.randomUUID();
    
    await query(
      `INSERT INTO media (id, user_id, type, url, caption, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, mediaData.userId, mediaData.type, mediaData.url, mediaData.caption || null, mediaData.isPrimary || false]
    );
    
    return id;
  },

  async delete(id: string, userId: string) {
    await query(
      `DELETE FROM media WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  },

  async setPrimary(id: string, userId: string) {
    // First, unset all primary for this type
    await query(
      `UPDATE media m1
       JOIN media m2 ON m1.user_id = m2.user_id AND m1.type = m2.type
       SET m1.is_primary = FALSE
       WHERE m2.id = ? AND m2.user_id = ?`,
      [id, userId]
    );
    
    // Then set this one as primary
    await query(
      `UPDATE media SET is_primary = TRUE WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  }
};

export default pool;
