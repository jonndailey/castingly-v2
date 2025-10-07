const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'castingly',
  user: process.env.DB_USER || 'nikon',
  password: process.env.DB_PASSWORD || '@0509man1hattaN',
};

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test users to create
const TEST_USERS = [
  // Test Actors (pick 3 from the migrated actors)
  {
    email: 'test.actor1@castingly.com',
    password: 'test123',
    name: 'Test Actor One',
    role: 'actor',
    bio: 'Experienced actor with theater and film background. Specializing in dramatic roles.'
  },
  {
    email: 'test.actor2@castingly.com',
    password: 'test123',
    name: 'Test Actor Two',
    role: 'actor',
    bio: 'Comedy and improv specialist with extensive commercial experience.'
  },
  {
    email: 'test.actor3@castingly.com',
    password: 'test123',
    name: 'Test Actor Three',
    role: 'actor',
    bio: 'Voice acting and motion capture performer with video game credits.'
  },
  
  // Test Agents
  {
    email: 'test.agent@castingly.com',
    password: 'agent123',
    name: 'Test Agent',
    role: 'agent',
    agencyName: 'Test Talent Agency',
    bio: 'Representing top talent in film, TV, and theater.'
  },
  {
    email: 'super.agent@castingly.com',
    password: 'agent123',
    name: 'Super Agent',
    role: 'agent',
    agencyName: 'Elite Talent Management',
    bio: 'Boutique agency focusing on emerging talent.'
  },
  
  // Test Casting Directors
  {
    email: 'test.casting@castingly.com',
    password: 'casting123',
    name: 'Test Casting Director',
    role: 'casting_director',
    companyName: 'Test Casting Company',
    bio: 'Casting for major studio productions and independent films.'
  },
  {
    email: 'indie.casting@castingly.com',
    password: 'casting123',
    name: 'Indie Casting Director',
    role: 'casting_director',
    companyName: 'Indie Film Casting',
    bio: 'Specializing in character-driven independent films.'
  }
];

async function createTestUsers() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Creating test users...\n');
    console.log('=' .repeat(60));
    
    for (const testUser of TEST_USERS) {
      const userId = crypto.randomUUID();
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
        await connection.execute(
          `INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified)
           VALUES (?, ?, ?, ?, ?, true, true)`,
          [userId, testUser.email, hashedPassword, testUser.name, testUser.role]
        );
        
        // Create profile with role-specific fields
        const profileData = {
          user_id: userId,
          bio: testUser.bio || `Professional ${testUser.role.replace('_', ' ')}`,
          location: 'Los Angeles',
          profile_completion: 75
        };
        
        if (testUser.role === 'agent' && testUser.agencyName) {
          profileData.agency_name = testUser.agencyName;
        } else if (testUser.role === 'casting_director' && testUser.companyName) {
          profileData.company_name = testUser.companyName;
        }
        
        // Build the insert query dynamically
        const fields = Object.keys(profileData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(profileData);
        
        await connection.execute(
          `INSERT INTO profiles (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
        
        console.log(`✅ Created ${testUser.role}: ${testUser.email} (password: ${testUser.password})`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${testUser.email}:`, error.message);
      }
    }
    
    // Also show some existing actors from migration
    console.log('\n' + '=' .repeat(60));
    console.log('Sample Migrated Actors (use password: changeme123):\n');
    
    const [actors] = await connection.execute(
      `SELECT u.email, u.name, p.location 
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.user_id 
       WHERE u.role = 'actor' 
       LIMIT 5`
    );
    
    actors.forEach((actor, index) => {
      console.log(`${index + 1}. ${actor.name}`);
      console.log(`   Email: ${actor.email}`);
      console.log(`   Location: ${actor.location || 'N/A'}`);
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
  createTestUsers()
    .then(() => {
      console.log('\n✅ Test user creation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create test users:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsers };