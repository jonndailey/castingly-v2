const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database connection configuration - using existing casting_portal database
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

// Helper function to parse JSON arrays from CSV
function parseJSONArray(str) {
  if (!str || str.trim() === '') return [];
  try {
    str = str.replace(/^\ufeff/, '');
    return JSON.parse(str);
  } catch (e) {
    try {
      const cleaned = str.replace(/^["']|["']$/g, '');
      return JSON.parse(cleaned);
    } catch (e2) {
      console.warn('Failed to parse array:', str);
      return [];
    }
  }
}

// Helper function to clean HTML
function cleanHTML(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Extract profile picture filename
function extractProfilePicture(profilePicStr) {
  if (!profilePicStr) return null;
  const match = profilePicStr.match(/\/([^\/]+\.(jpg|jpeg|png|gif))(?:#|$)/i);
  return match ? match[1] : null;
}

// Extract resume filename
function extractResumeFile(resumeStr) {
  if (!resumeStr) return null;
  const match = resumeStr.match(/\/([^\/]+\.(pdf|doc|docx))(?:#|$)/i);
  return match ? match[1] : null;
}

async function migrateToExistingDB() {
  const csvPath = path.join(__dirname, '..', 'Actors.csv');
  const imageMappingPath = path.join(__dirname, '..', 'image_mapping.csv');
  
  const connection = await mysql.createConnection(dbConfig);
  
  // Load image mapping
  const imageMapping = new Map();
  if (fs.existsSync(imageMappingPath)) {
    await new Promise((resolve, reject) => {
      fs.createReadStream(imageMappingPath)
        .pipe(csv())
        .on('data', (row) => {
          imageMapping.set(row.Actor_ID, {
            folderName: row.Folder_Name,
            folderPath: row.Folder_Path,
            imageFiles: row.Image_Files ? row.Image_Files.split(';').map(f => f.trim()) : []
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }
  
  const actors = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Email && row.Fullname) {
          actors.push(row);
        }
      })
      .on('end', async () => {
        console.log(`Found ${actors.length} actors to migrate`);
        
        try {
          await connection.beginTransaction();
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const row of actors) {
            try {
              const specialties = parseJSONArray(row.Specialties);
              const skillsets = parseJSONArray(row.Skillsets);
              const allSkills = [...specialties, ...skillsets].join(', ');
              
              const firstName = row.firstName || row.Fullname.split(' ')[0] || 'Unknown';
              const lastName = row.lastName || row.Fullname.split(' ').slice(1).join(' ') || '';
              const bio = cleanHTML(row.Experience) || `Professional actor based in ${row.City || 'Los Angeles'}`;
              
              console.log(`\\nMigrating: ${row.Fullname} (${row.Email})`);
              
              // Check if user already exists
              const [existing] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [row.Email.toLowerCase()]
              );
              
              if (existing.length > 0) {
                console.log(`  ⚠️  User already exists: ${row.Email}`);
                continue;
              }
              
              // Generate temporary password
              const tempPassword = hashPassword('changeme123');
              
              // Insert user
              const [userResult] = await connection.execute(
                `INSERT INTO users (email, password_hash, role, first_name, last_name)
                 VALUES (?, ?, 'actor', ?, ?)`,
                [row.Email.toLowerCase(), tempPassword, firstName, lastName]
              );
              
              const userId = userResult.insertId;
              
              // Insert actor profile
              const profileImage = extractProfilePicture(row.Profilepicture);
              const resumeFile = extractResumeFile(row.Resume);
              
              // Map profile image path
              let profileImagePath = null;
              if (profileImage) {
                const mapping = imageMapping.get(row.ID);
                if (mapping) {
                  profileImagePath = `/${mapping.folderPath}/${mapping.imageFiles.find(f => f.includes('profile')) || profileImage}`;
                }
              }
              
              // Map resume path
              let resumePath = null;
              if (resumeFile) {
                resumePath = `/downloaded_resumes/${row.ID}_${row.Fullname}/${resumeFile}`;
              }
              
              await connection.execute(
                `INSERT INTO actors (
                  user_id, bio, skills, profile_image, resume_url,
                  height, eye_color, hair_color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  userId,
                  bio,
                  allSkills,
                  profileImagePath,
                  resumePath,
                  row.Height,
                  row['Eye Color'],
                  row['Hair Color']
                ]
              );
              
              // Add media entries if we have images
              const mapping = imageMapping.get(row.ID);
              if (mapping && mapping.imageFiles.length > 0) {
                for (const imageFile of mapping.imageFiles.slice(0, 5)) { // Limit to 5 images
                  const imagePath = `/${mapping.folderPath}/${imageFile}`;
                  const isProfile = imageFile.includes('profile');
                  
                  await connection.execute(
                    `INSERT INTO actor_media (user_id, media_type, media_url, is_primary)
                     VALUES (?, 'image', ?, ?)`,
                    [userId, imagePath, isProfile ? 1 : 0]
                  );
                }
              }
              
              successCount++;
              console.log(`  ✓ Successfully migrated ${row.Fullname}`);
              
            } catch (error) {
              errorCount++;
              console.error(`  ✗ Error migrating ${row.Fullname}:`, error.message);
            }
          }
          
          await connection.commit();
          
          console.log('\\n' + '='.repeat(50));
          console.log('✅ Migration completed!');
          console.log(`Successfully migrated: ${successCount} actors`);
          console.log(`Errors: ${errorCount}`);
          console.log('='.repeat(50));
          
        } catch (error) {
          await connection.rollback();
          console.error('Migration failed:', error);
          throw error;
        } finally {
          await connection.end();
        }
        
        resolve();
      })
      .on('error', reject);
  });
}

// Run migration
if (require.main === module) {
  console.log('Starting migration to existing casting_portal database...');
  console.log('='.repeat(60));
  
  migrateToExistingDB()
    .then(() => {
      console.log('\\nMigration process finished!');
      console.log('\\nNOTE: All migrated actors have password: changeme123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\nMigration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToExistingDB };