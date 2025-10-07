const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'casting_portal',
  user: process.env.DB_USER || 'nikon',
  password: process.env.DB_PASSWORD || '@0509man1hattaN',
};

async function fixTopActors() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Fixing top actors media...\n');
    
    const actorsToFix = [
      { email: 'maurice_vaughan08@yahoo.com', name: 'L V' },
      { email: 'kaitlynbrookover@yahoo.com', name: 'K B' },
      { email: 'magjofogu@gmail.com', name: 'Johanna Forero' },
      { email: 'maria.brks@yahoo.com', name: 'Maria M' },
      { email: 'ravi.impinge@gmail.com', name: 'ravi kr' },
      { email: 'bethanyujoyle@gmail.com', name: 'bethany  coyle' },
      { email: 'elizarbourne@gmail.com', name: 'Elizabeth  Winterbourne' }
    ];
    
    for (const actorInfo of actorsToFix) {
      try {
        // Get user ID
        const [users] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [actorInfo.email]
        );
        
        if (users.length === 0) {
          console.log(`⚠️  User not found: ${actorInfo.email}`);
          continue;
        }
        
        const userId = users[0].id;
        
        // Find their folder
        const mediaDir = '/home/jonny/apps/castingly-v2/downloaded_images';
        const folders = await fs.readdir(mediaDir);
        const actorFolder = folders.find(folder => folder.includes(actorInfo.name));
        
        if (!actorFolder) {
          console.log(`⚠️  No folder found for ${actorInfo.name}`);
          continue;
        }
        
        console.log(`🔧 Fixing ${actorInfo.name} (${actorInfo.email})...`);
        
        // Clear existing media
        await connection.execute('DELETE FROM actor_media WHERE actor_id = ?', [userId]);
        
        // Process their actual folder
        const folderPath = path.join(mediaDir, actorFolder);
        const files = await fs.readdir(folderPath);
        const imageFiles = files.filter(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        
        let headshots = 0;
        let gallery = 0;
        
        for (const file of imageFiles) {
          const filePath = `/downloaded_images/${actorFolder}/${file}`;
          
          // Determine media type
          let mediaType = 'gallery';
          if (file.toLowerCase().includes('profile') || file.toLowerCase().includes('headshot')) {
            mediaType = 'headshot';
          }
          
          // Make the first headshot primary
          const isPrimary = mediaType === 'headshot' && headshots === 0;
          
          // Insert media record
          await connection.execute(
            `INSERT INTO actor_media (actor_id, media_type, media_url, is_primary, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [userId, mediaType, filePath, isPrimary ? 1 : 0]
          );
          
          if (mediaType === 'headshot') headshots++;
          else gallery++;
        }
        
        console.log(`  ✅ Added ${headshots} headshots, ${gallery} gallery images`);
        
      } catch (error) {
        console.error(`❌ Error fixing ${actorInfo.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Top actors fix complete!');
    
    // Show summary
    console.log('\n📋 Test accounts with fixed media:');
    for (const actorInfo of actorsToFix) {
      try {
        const [users] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [actorInfo.email]
        );
        
        if (users.length > 0) {
          const [media] = await connection.execute(
            'SELECT COUNT(*) as count FROM actor_media WHERE actor_id = ?',
            [users[0].id]
          );
          console.log(`   ${actorInfo.name} (${actorInfo.email}): ${media[0].count} media files`);
        }
      } catch (error) {
        // Skip errors in summary
      }
    }
    
  } catch (error) {
    console.error('Error fixing actors:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  fixTopActors()
    .then(() => {
      console.log('\n✅ Top actor media fix complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to fix top actor media:', error);
      process.exit(1);
    });
}

module.exports = { fixTopActors };