const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'casting_portal',
  user: process.env.DB_USER || 'nikon',
  password: process.env.DB_PASSWORD || '@0509man1hattaN',
};

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test users to create for existing database structure
const TEST_USERS = [
  // Test Actors
  {
    email: 'test.actor1@castingly.com',
    password: 'test123',
    firstName: 'Test',
    lastName: 'Actor One',
    role: 'actor',
    bio: 'Experienced actor with theater and film background. Specializing in dramatic roles.',
    skills: 'Theater, Film, Drama, Character Work'
  },
  {
    email: 'test.actor2@castingly.com',
    password: 'test123',
    firstName: 'Test',
    lastName: 'Actor Two',
    role: 'actor',
    bio: 'Comedy and improv specialist with extensive commercial experience.',
    skills: 'Comedy, Improv, Commercial, Voice Acting'
  },
  {
    email: 'test.actor3@castingly.com',
    password: 'test123',
    firstName: 'Test',
    lastName: 'Actor Three',
    role: 'actor',
    bio: 'Voice acting and motion capture performer with video game credits.',
    skills: 'Voice Acting, Motion Capture, Video Games, Animation'
  },
  
  // Test Agents
  {
    email: 'test.agent@castingly.com',
    password: 'agent123',
    firstName: 'Test',
    lastName: 'Agent',
    role: 'agent'
  },
  {
    email: 'super.agent@castingly.com',
    password: 'agent123',
    firstName: 'Super',
    lastName: 'Agent',
    role: 'agent'
  },
  
  // Test Casting Directors
  {
    email: 'test.casting@castingly.com',
    password: 'casting123',
    firstName: 'Test',
    lastName: 'Casting Director',
    role: 'casting_director'
  },
  {
    email: 'indie.casting@castingly.com',
    password: 'casting123',
    firstName: 'Indie',
    lastName: 'Casting Director',
    role: 'casting_director'
  }
];

async function createTestUsersExisting() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Creating test users for existing database...\n');
    console.log('=' .repeat(60));
    
    for (const testUser of TEST_USERS) {
      const hashedPassword = hashPassword(testUser.password);
      
      try {
        // Check if user already exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [testUser.email]
        );
        
        if (existing.length > 0) {
          console.log(`⚠️  User already exists: ${testUser.email}`);
          continue;
        }
        
        // Create user
        const [userResult] = await connection.execute(
          `INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES (?, ?, ?, ?, ?)`,
          [testUser.email, hashedPassword, testUser.firstName, testUser.lastName, testUser.role]
        );
        
        const userId = userResult.insertId;
        
        // Create actor profile if role is actor
        if (testUser.role === 'actor') {
          await connection.execute(
            `INSERT INTO actors (user_id, bio, skills, representation_status)
             VALUES (?, ?, ?, 'seeking')`,
            [userId, testUser.bio || 'Professional actor', testUser.skills || 'Acting']
          );
        }
        
        console.log(`✅ Created ${testUser.role}: ${testUser.email} (password: ${testUser.password})`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${testUser.email}:`, error.message);
      }
    }
    
    // Show some existing actors from migration
    console.log('\n' + '=' .repeat(60));
    console.log('Sample Migrated Actors (use password: changeme123):\n');
    
    const [actors] = await connection.execute(
      `SELECT u.email, CONCAT(u.first_name, ' ', u.last_name) as name, a.bio
       FROM users u 
       LEFT JOIN actors a ON u.id = a.user_id 
       WHERE u.role = 'actor' 
       ORDER BY u.id DESC
       LIMIT 5`
    );
    
    actors.forEach((actor, index) => {
      console.log(`${index + 1}. ${actor.name}`);
      console.log(`   Email: ${actor.email}`);
      console.log(`   Bio: ${(actor.bio || '').substring(0, 60)}...`);
      console.log('   Password: changeme123\n');
    });
    
    console.log('=' .repeat(60));
    console.log('\n📋 Test User Summary:\n');
    console.log('ACTORS:');
    console.log('  • test.actor1@castingly.com (password: test123)');
    console.log('  • test.actor2@castingly.com (password: test123)');
    console.log('  • test.actor3@castingly.com (password: test123)');
    console.log('\nAGENTS:');
    console.log('  • test.agent@castingly.com (password: agent123)');
    console.log('  • super.agent@castingly.com (password: agent123)');
    console.log('\nCASTING DIRECTORS:');
    console.log('  • test.casting@castingly.com (password: casting123)');
    console.log('  • indie.casting@castingly.com (password: casting123)');
    console.log('\nMIGRATED ACTORS:');
    console.log('  • Any migrated actor email (password: changeme123)');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  createTestUsersExisting()
    .then(() => {
      console.log('\n✅ Test user creation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create test users:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsersExisting };