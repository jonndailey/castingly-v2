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

// Actor-specific queries adapted for existing schema
export const actors = {
  // Get all actors with basic info
  async getAll(limit = 100, offset = 0) {
    const rows = await query(
      `SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name, u.email, 
              a.profile_image as avatar_url, a.bio
       FROM users u
       LEFT JOIN actors a ON u.id = a.user_id
       WHERE u.role = 'actor'
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  },

  // Get single actor with full profile
  async getById(id: string) {
    const rows = await query(
      `SELECT u.*, a.*, CONCAT(u.first_name, ' ', u.last_name) as name
       FROM users u
       LEFT JOIN actors a ON u.id = a.user_id
       WHERE u.id = ? AND u.role = 'actor'`,
      [id]
    );
    return rows[0];
  },

  // Get actor's media
  async getMedia(actorId: string) {
    const rows = await query(
      `SELECT * FROM actor_media
       WHERE actor_id = ?
       ORDER BY is_primary DESC, id`,
      [actorId]
    );
    return rows;
  },

  // Search actors
  async search(searchTerm: string) {
    const rows = await query(
      `SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name, u.email,
              a.profile_image as avatar_url, a.bio
       FROM users u
       LEFT JOIN actors a ON u.id = a.user_id
       WHERE u.role = 'actor' 
       AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR a.bio LIKE ?)
       ORDER BY u.first_name, u.last_name`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows;
  },

  // Get actors by skills
  async getBySkills(skills: string) {
    const rows = await query(
      `SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name, u.email,
              a.profile_image as avatar_url, a.bio, a.skills
       FROM users u
       LEFT JOIN actors a ON u.id = a.user_id
       WHERE u.role = 'actor' AND a.skills LIKE ?
       ORDER BY u.first_name, u.last_name`,
      [`%${skills}%`]
    );
    return rows;
  },

  // Get actor count
  async getCount() {
    const rows = await query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'actor'`
    );
    return rows[0].count;
  }
};

// Authentication helpers for existing schema
export const auth = {
  async findByEmail(email: string) {
    const rows = await query(
      'SELECT *, CONCAT(first_name, " ", last_name) as name FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return rows[0];
  },

  async verifyPassword(email: string, password: string) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    const rows = await query(
      'SELECT *, CONCAT(first_name, " ", last_name) as name FROM users WHERE email = ? AND password_hash = ?',
      [email.toLowerCase(), hashedPassword]
    );
    
    if (rows[0]) {
      // Update last login would go here if the table had that field
      // await query('UPDATE users SET last_login = NOW() WHERE id = ?', [rows[0].id]);
    }
    
    return rows[0];
  },

  async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'actor' | 'agent' | 'casting_director';
  }) {
    const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
    
    const [result] = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [userData.email.toLowerCase(), hashedPassword, userData.firstName, userData.lastName, userData.role]
    );
    
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

export default pool;