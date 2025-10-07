const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'casting_portal',
  user: process.env.DB_USER || 'nikon',
  password: process.env.DB_PASSWORD || '@0509man1hattaN',
};

async function fixMediaLinks() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Starting media link fix...');
    
    // Clear existing actor_media records to start fresh
    console.log('🗑️  Clearing existing media records...');
    await connection.execute('DELETE FROM actor_media');
    
    // Get all users with their names
    const [users] = await connection.execute(`
      SELECT u.id, u.first_name, u.last_name, 
             CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM users u 
      WHERE u.role = 'actor'
    `);
    
    console.log(`📋 Found ${users.length} actors in database`);
    
    // Get all image folders
    const imagesDir = path.join(process.cwd(), 'downloaded_images');
    const resumesDir = path.join(process.cwd(), 'downloaded_resumes');
    
    if (!fs.existsSync(imagesDir)) {
      console.log('❌ downloaded_images directory not found');
      return;
    }
    
    const imageFolders = fs.readdirSync(imagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`📁 Found ${imageFolders.length} image folders`);
    
    let mediaLinked = 0;
    let mediaId = 1;
    
    // Process each image folder
    for (const folderName of imageFolders) {
      // Extract actor name from folder (format: uuid_ActorName)
      const namePart = folderName.split('_').slice(1).join('_');
      
      if (!namePart) {
        console.log(`⚠️  Skipping folder with invalid format: ${folderName}`);
        continue;
      }
      
      // Find matching user by name (fuzzy matching)
      const matchingUser = users.find(user => {
        const userFullName = user.full_name.toLowerCase().trim();
        const folderName = namePart.toLowerCase().trim();
        
        // Exact match
        if (userFullName === folderName) return true;
        
        // Check if folder name contains both first and last name
        const firstName = user.first_name.toLowerCase().trim();
        const lastName = user.last_name.toLowerCase().trim();
        
        return folderName.includes(firstName) && folderName.includes(lastName);
      });
      
      if (!matchingUser) {
        console.log(`❌ No matching user found for folder: ${folderName}`);
        continue;
      }
      
      console.log(`✅ Linking media for: ${matchingUser.full_name} (ID: ${matchingUser.id})`);
      
      // Process images in the folder
      const folderPath = path.join(imagesDir, folderName);
      const imageFiles = fs.readdirSync(folderPath)
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      
      for (const imageFile of imageFiles) {
        const mediaUrl = `/downloaded_images/${folderName}/${imageFile}`;
        const isProfile = imageFile.toLowerCase().includes('profile');
        const isHeadshot = isProfile || imageFile.toLowerCase().includes('headshot');
        const mediaType = isHeadshot ? 'headshot' : 'gallery';
        
        try {
          await connection.execute(`
            INSERT INTO actor_media (id, actor_id, media_type, media_url, is_primary, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
          `, [mediaId++, matchingUser.id, mediaType, mediaUrl, isProfile ? 1 : 0]);
          
          mediaLinked++;
          
          // Update profile_image in actors table if this is a profile image
          if (isProfile) {
            await connection.execute(`
              UPDATE actors 
              SET profile_image = ? 
              WHERE user_id = ?
            `, [mediaUrl, matchingUser.id]);
          }
          
        } catch (error) {
          console.error(`❌ Error inserting media record for ${imageFile}:`, error.message);
        }
      }
      
      // Process resumes if they exist
      const resumeFolderPath = path.join(resumesDir, folderName);
      if (fs.existsSync(resumeFolderPath)) {
        const resumeFiles = fs.readdirSync(resumeFolderPath)
          .filter(file => /\.(pdf|doc|docx)$/i.test(file));
        
        for (const resumeFile of resumeFiles) {
          const mediaUrl = `/downloaded_resumes/${folderName}/${resumeFile}`;
          
          try {
            await connection.execute(`
              INSERT INTO actor_media (id, actor_id, media_type, media_url, is_primary, created_at)
              VALUES (?, ?, ?, ?, ?, NOW())
            `, [mediaId++, matchingUser.id, 'resume', mediaUrl, 1]);
            
            mediaLinked++;
            
            // Update resume_url in actors table
            await connection.execute(`
              UPDATE actors 
              SET resume_url = ? 
              WHERE user_id = ?
            `, [mediaUrl, matchingUser.id]);
            
          } catch (error) {
            console.error(`❌ Error inserting resume record for ${resumeFile}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n🎉 Media linking complete!');
    console.log(`📊 Total media files linked: ${mediaLinked}`);
    
    // Show some statistics
    const [stats] = await connection.execute(`
      SELECT 
        media_type,
        COUNT(*) as count
      FROM actor_media 
      GROUP BY media_type
    `);
    
    console.log('\n📈 Media Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat.media_type}: ${stat.count} files`);
    });
    
    // Show actors with media
    const [actorsWithMedia] = await connection.execute(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        COUNT(am.id) as media_count
      FROM users u
      LEFT JOIN actor_media am ON u.id = am.actor_id
      WHERE u.role = 'actor' AND am.id IS NOT NULL
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY media_count DESC
      LIMIT 10
    `);
    
    console.log('\n🎭 Top 10 Actors with Media:');
    actorsWithMedia.forEach(actor => {
      console.log(`   ${actor.name}: ${actor.media_count} files`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing media links:', error);
  } finally {
    await connection.end();
  }
}

// Run the migration
if (require.main === module) {
  fixMediaLinks()
    .then(() => {
      console.log('✅ Media link fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Media link fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMediaLinks };