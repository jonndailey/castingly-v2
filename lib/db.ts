import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'castingly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to get a client from the pool
export async function getClient() {
  return await pool.connect();
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Actor-specific queries
export const actors = {
  // Get all actors with basic info
  async getAll(limit = 100, offset = 0) {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, p.location, p.bio
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'actor'
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  // Get single actor with full profile
  async getById(id: string) {
    const result = await query(
      `SELECT u.*, p.*
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1 AND u.role = 'actor'`,
      [id]
    );
    return result.rows[0];
  },

  // Get actor's media
  async getMedia(actorId: string) {
    const result = await query(
      `SELECT * FROM media
       WHERE user_id = $1
       ORDER BY order_index, created_at`,
      [actorId]
    );
    return result.rows;
  },

  // Search actors
  async search(searchTerm: string) {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, p.location, p.bio
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'actor' 
       AND (u.name ILIKE $1 OR u.email ILIKE $1 OR p.bio ILIKE $1)
       ORDER BY u.name`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  },

  // Get actors by location
  async getByLocation(location: string) {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, p.location, p.bio
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.role = 'actor' AND p.location ILIKE $1
       ORDER BY u.name`,
      [`%${location}%`]
    );
    return result.rows;
  }
};

// Authentication helpers
export const auth = {
  async findByEmail(email: string) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0];
  },

  async verifyPassword(email: string, password: string) {
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND password_hash = $2',
      [email.toLowerCase(), hashedPassword]
    );
    
    if (result.rows[0]) {
      // Update last login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [result.rows[0].id]
      );
    }
    
    return result.rows[0];
  }
};

export default pool;