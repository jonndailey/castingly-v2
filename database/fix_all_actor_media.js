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

async function fixAllActorMedia() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Starting media fix for all actors...\n');
    
    // Get all actors who have associated media folders
    const mediaDir = '/home/jonny/apps/castingly-v2/downloaded_images';
    const folders = await fs.readdir(mediaDir);
    
    // Filter folders that match the pattern: UUID_ActorName
    const actorFolders = folders.filter(folder => 
      folder.includes('_') && folder.length > 20
    );
    
    console.log(`Found ${actorFolders.length} actor media folders to process\n`);
    
    let processedCount = 0;
    let fixedCount = 0;
    
    for (const folder of actorFolders) {
      try {
        // Extract actor name from folder (everything after the first underscore)
        const actorName = folder.split('_').slice(1).join('_');
        
        // Find the actor in the database
        const [actors] = await connection.execute(
          `SELECT u.id, u.first_name, u.last_name, u.email
           FROM users u 
           WHERE u.role = 'actor' 
           AND CONCAT(u.first_name, ' ', u.last_name) = ?`,
          [actorName]
        );
        
        if (actors.length === 0) {
          console.log(`⚠️  No actor found for folder: ${folder}`);
          continue;
        }
        
        const actor = actors[0];
        const actorId = actor.id;
        
        // Clear existing media for this actor
        await connection.execute(
          'DELETE FROM actor_media WHERE actor_id = ?',
          [actorId]
        );
        
        // Get all images in the actor's folder
        const folderPath = path.join(mediaDir, folder);
        const files = await fs.readdir(folderPath);
        const imageFiles = files.filter(file => 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        
        let mediaInserted = 0;
        
        for (const file of imageFiles) {
          const filePath = `/downloaded_images/${folder}/${file}`;
          
          // Determine media type based on filename
          let mediaType = 'gallery';
          if (file.toLowerCase().includes('profile') || file.toLowerCase().includes('headshot')) {
            mediaType = 'headshot';
          }
          
          // Make the first headshot primary
          const isPrimary = mediaType === 'headshot' && mediaInserted === 0;
          
          // Insert media record
          await connection.execute(
            `INSERT INTO actor_media (actor_id, media_type, media_url, is_primary, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [actorId, mediaType, filePath, isPrimary ? 1 : 0]
          );
          
          mediaInserted++;
        }
        
        if (mediaInserted > 0) {
          console.log(`✅ Fixed ${actor.first_name} ${actor.last_name} (${actor.email}): ${mediaInserted} media files`);
          fixedCount++;
        }
        
        processedCount++;
        
        // Progress indicator
        if (processedCount % 10 === 0) {
          console.log(`📊 Progress: ${processedCount}/${actorFolders.length} folders processed`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing folder ${folder}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Media fix complete!`);
    console.log(`📁 Processed: ${processedCount} folders`);
    console.log(`✅ Fixed: ${fixedCount} actors`);
    
    // Verify some results
    console.log('\n📋 Sample verification:');
    const [sampleActors] = await connection.execute(
      `SELECT u.email, CONCAT(u.first_name, ' ', u.last_name) as name, COUNT(am.id) as media_count
       FROM users u
       JOIN actor_media am ON u.id = am.actor_id
       WHERE u.role = 'actor'
       GROUP BY u.id
       ORDER BY media_count DESC
       LIMIT 5`
    );
    
    sampleActors.forEach(actor => {
      console.log(`   ${actor.name} (${actor.email}): ${actor.media_count} media files`);
    });
    
  } catch (error) {
    console.error('Error fixing actor media:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
if (require.main === module) {
  fixAllActorMedia()
    .then(() => {
      console.log('\n✅ All actor media fix complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to fix actor media:', error);
      process.exit(1);
    });
}

module.exports = { fixAllActorMedia };