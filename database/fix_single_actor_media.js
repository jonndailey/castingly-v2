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

async function fixSingleActorMedia() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔧 Fixing media for Johanna Forero (ID: 1051)...');
    
    // Clear existing media records for this actor
    await connection.execute('DELETE FROM actor_media WHERE actor_id = 1051');
    
    const folderName = 'fbb63bf3-9533-4c1b-a4c9-e71140170845_Johanna Forero';
    const imagesDir = path.join(process.cwd(), 'downloaded_images');
    const resumesDir = path.join(process.cwd(), 'downloaded_resumes');
    
    // Get next available media ID
    const [maxIdResult] = await connection.execute('SELECT MAX(id) as max_id FROM actor_media');
    let mediaId = (maxIdResult[0].max_id || 0) + 1;
    
    // Process images
    const folderPath = path.join(imagesDir, folderName);
    const imageFiles = fs.readdirSync(folderPath)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    
    console.log(`📁 Found ${imageFiles.length} image files:`, imageFiles);
    
    for (const imageFile of imageFiles) {
      const mediaUrl = `/downloaded_images/${folderName}/${imageFile}`;
      const isProfile = imageFile.toLowerCase().includes('profile');
      const isHeadshot = isProfile || imageFile.toLowerCase().includes('headshot');
      const mediaType = isHeadshot ? 'headshot' : 'gallery';
      
      console.log(`   Processing: ${imageFile} -> Type: ${mediaType}, Primary: ${isProfile}`);
      
      try {
        await connection.execute(`
          INSERT INTO actor_media (id, actor_id, media_type, media_url, is_primary, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [mediaId++, 1051, mediaType, mediaUrl, isProfile ? 1 : 0]);
        
        console.log(`   ✅ Added ${imageFile} as ${mediaType}`);
        
      } catch (error) {
        console.error(`   ❌ Error inserting ${imageFile}:`, error.message);
      }
    }
    
    // Process resume
    const resumeFolderPath = path.join(resumesDir, folderName);
    if (fs.existsSync(resumeFolderPath)) {
      const resumeFiles = fs.readdirSync(resumeFolderPath)
        .filter(file => /\.(pdf|doc|docx)$/i.test(file));
      
      console.log(`📄 Found ${resumeFiles.length} resume files:`, resumeFiles);
      
      for (const resumeFile of resumeFiles) {
        const mediaUrl = `/downloaded_resumes/${folderName}/${resumeFile}`;
        
        try {
          await connection.execute(`
            INSERT INTO actor_media (id, actor_id, media_type, media_url, is_primary, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
          `, [mediaId++, 1051, 'resume', mediaUrl, 1]);
          
          console.log(`   ✅ Added ${resumeFile} as resume`);
          
        } catch (error) {
          console.error(`   ❌ Error inserting ${resumeFile}:`, error.message);
        }
      }
    }
    
    // Check final results
    const [results] = await connection.execute(`
      SELECT media_type, media_url, is_primary 
      FROM actor_media 
      WHERE actor_id = 1051 
      ORDER BY media_type, is_primary DESC
    `);
    
    console.log('\n📊 Final Media Records for Johanna Forero:');
    results.forEach(record => {
      console.log(`   ${record.media_type}: ${record.media_url} ${record.is_primary ? '(PRIMARY)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing media:', error);
  } finally {
    await connection.end();
  }
}

// Run the fix
if (require.main === module) {
  fixSingleActorMedia()
    .then(() => {
      console.log('✅ Single actor media fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Single actor media fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixSingleActorMedia };