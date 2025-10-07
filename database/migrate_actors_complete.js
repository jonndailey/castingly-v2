const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');
const crypto = require('crypto');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'castingly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to parse JSON arrays from CSV
function parseJSONArray(str) {
  if (!str || str.trim() === '') return [];
  try {
    // Remove BOM if present
    str = str.replace(/^\ufeff/, '');
    // Try to parse as JSON
    return JSON.parse(str);
  } catch (e) {
    // If not valid JSON, try to clean it up
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

// Helper function to parse image gallery
function parseImageGallery(galleryStr) {
  if (!galleryStr) return [];
  try {
    const gallery = JSON.parse(galleryStr);
    return gallery.map(item => {
      if (item.src) {
        // Extract the actual filename from Wix URL
        const match = item.src.match(/\/([^\/]+\.(jpg|jpeg|png|gif))(?:#|$)/i);
        return match ? match[1] : null;
      }
      return null;
    }).filter(Boolean);
  } catch (e) {
    console.warn('Failed to parse image gallery');
    return [];
  }
}

// Helper function to parse video gallery  
function parseVideoGallery(galleryStr) {
  if (!galleryStr) return [];
  try {
    const gallery = JSON.parse(galleryStr);
    return gallery.filter(item => item.type === 'video').map(item => item.src);
  } catch (e) {
    return [];
  }
}

// Helper function to extract profile picture filename
function extractProfilePicture(profilePicStr) {
  if (!profilePicStr) return null;
  const match = profilePicStr.match(/\/([^\/]+\.(jpg|jpeg|png|gif))(?:#|$)/i);
  return match ? match[1] : null;
}

// Helper function to extract resume filename
function extractResumeFile(resumeStr) {
  if (!resumeStr) return null;
  const match = resumeStr.match(/\/([^\/]+\.(pdf|doc|docx))(?:#|$)/i);
  return match ? match[1] : null;
}

// Map specialties to database skills
function mapSpecialtiesToSkills(specialties, skillsets) {
  const skills = [];
  const performanceSkills = [];
  
  // Process specialties
  specialties.forEach(specialty => {
    const lower = specialty.toLowerCase();
    if (lower.includes('voice') || lower.includes('voiceover')) {
      performanceSkills.push('Voice Acting');
    } else if (lower.includes('theater') || lower.includes('theatre')) {
      performanceSkills.push('Theater');
    } else if (lower.includes('film')) {
      performanceSkills.push('Film Acting');
    } else if (lower.includes('comedy')) {
      performanceSkills.push('Comedy');
    } else if (lower.includes('drama')) {
      performanceSkills.push('Drama');
    } else if (lower.includes('stunt')) {
      skills.push('Stunt Performance');
    }
  });
  
  // Process skillsets
  if (skillsets && Array.isArray(skillsets)) {
    skillsets.forEach(skill => {
      if (!skills.includes(skill) && !performanceSkills.includes(skill)) {
        skills.push(skill);
      }
    });
  }
  
  return { skills, performanceSkills };
}

// Map actor data from CSV to database format
function mapActorData(row) {
  const specialties = parseJSONArray(row.Specialties);
  const skillsets = parseJSONArray(row.Skillsets);
  const { skills, performanceSkills } = mapSpecialtiesToSkills(specialties, skillsets);
  
  // Parse languages if available
  const languages = row['Languages Known'] ? 
    row['Languages Known'].split(',').map(l => l.trim()).filter(Boolean) : [];
  
  return {
    id: row.ID || crypto.randomUUID(),
    email: (row.Email || '').toLowerCase().trim(),
    fullName: row.Fullname || `${row.firstName} ${row.lastName}`.trim(),
    firstName: row.firstName,
    lastName: row.lastName,
    bio: cleanHTML(row.Experience),
    city: row.City || 'Los Angeles',
    zipcode: row.Zipcode,
    skills,
    performanceSkills,
    languages,
    gender: row.Gender,
    yearsExperience: row['Years of Experience'],
    height: row.Height,
    eyeColor: row['Eye Color'],
    hairColor: row['Hair Color'],
    hairType: row['Hair Type'],
    skinColor: row['Skin Color'],
    profilePicture: extractProfilePicture(row.Profilepicture),
    resumeFile: extractResumeFile(row.Resume),
    imageGallery: parseImageGallery(row.Imagegallery),
    videoGallery: parseVideoGallery(row.Videogallery),
    embeddedReels: row['Embedded Reels'],
    createdAt: row['Created Date'],
    updatedAt: row['Updated Date']
  };
}

async function migrateActors() {
  const csvPath = path.join(__dirname, '..', 'Actors.csv');
  const imageMappingPath = path.join(__dirname, '..', 'image_mapping.csv');
  
  // Load image mapping for cross-reference
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
  
  // Read and parse main Actors CSV
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Email && row.Fullname) { // Skip rows without essential data
          actors.push(row);
        }
      })
      .on('end', async () => {
        console.log(`Found ${actors.length} actors to migrate`);
        
        const client = await pool.connect();
        
        try {
          // Start transaction
          await client.query('BEGIN');
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const row of actors) {
            try {
              const actor = mapActorData(row);
              
              if (!actor.email || !actor.fullName) {
                console.log(`Skipping actor with missing data: ${actor.fullName || 'Unknown'}`);
                continue;
              }
              
              console.log(`\nMigrating actor: ${actor.fullName} (${actor.id})`);
              
              // Generate temporary password
              const tempPassword = hashPassword('changeme123');
              
              // 1. Create user account
              const userResult = await client.query(`
                INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
                VALUES ($1, $2, $3, $4, 'actor', true, false, $5, $6)
                ON CONFLICT (email) DO UPDATE SET
                  name = EXCLUDED.name,
                  updated_at = EXCLUDED.updated_at
                RETURNING id
              `, [
                actor.id,
                actor.email,
                tempPassword,
                actor.fullName,
                actor.createdAt || new Date(),
                actor.updatedAt || new Date()
              ]);
              
              const userId = userResult.rows[0].id;
              
              // 2. Create profile
              await client.query(`
                INSERT INTO profiles (
                  user_id, bio, location, 
                  skills, performance_skills, languages,
                  height, eye_color, hair_color,
                  available_for_work, profile_completion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
                ON CONFLICT (user_id) DO UPDATE SET
                  bio = EXCLUDED.bio,
                  location = EXCLUDED.location,
                  skills = EXCLUDED.skills,
                  performance_skills = EXCLUDED.performance_skills,
                  languages = EXCLUDED.languages,
                  height = EXCLUDED.height,
                  eye_color = EXCLUDED.eye_color,
                  hair_color = EXCLUDED.hair_color
              `, [
                userId,
                actor.bio || `Professional actor based in ${actor.city}`,
                actor.city,
                actor.skills,
                actor.performanceSkills,
                actor.languages,
                actor.height,
                actor.eyeColor,
                actor.hairColor,
                actor.bio ? 60 : 30 // Higher completion if bio exists
              ]);
              
              // 3. Add media files
              let mediaOrder = 0;
              
              // Add profile picture
              if (actor.profilePicture) {
                const mapping = imageMapping.get(actor.id);
                if (mapping) {
                  // Check if file exists in downloaded_images
                  const profilePath = `/${mapping.folderPath}/${mapping.imageFiles.find(f => f.includes('profile')) || actor.profilePicture}`;
                  await client.query(`
                    INSERT INTO media (
                      user_id, type, url, is_primary, caption, order_index
                    ) VALUES ($1, 'headshot', $2, true, 'Profile Photo', $3)
                    ON CONFLICT DO NOTHING
                  `, [userId, profilePath, mediaOrder++]);
                }
              }
              
              // Add gallery images
              if (actor.imageGallery && actor.imageGallery.length > 0) {
                const mapping = imageMapping.get(actor.id);
                if (mapping) {
                  for (const image of actor.imageGallery.slice(0, 10)) { // Limit to 10 gallery images
                    const imagePath = `/${mapping.folderPath}/${mapping.imageFiles.find(f => f.includes(image)) || image}`;
                    await client.query(`
                      INSERT INTO media (
                        user_id, type, url, is_primary, caption, order_index
                      ) VALUES ($1, 'headshot', $2, false, 'Gallery Photo', $3)
                      ON CONFLICT DO NOTHING
                    `, [userId, imagePath, mediaOrder++]);
                  }
                }
              }
              
              // Add resume if exists
              if (actor.resumeFile) {
                const resumePath = `/downloaded_resumes/${actor.id}_${actor.fullName}/${actor.resumeFile}`;
                await client.query(`
                  INSERT INTO media (
                    user_id, type, url, caption, order_index
                  ) VALUES ($1, 'resume', $2, 'Acting Resume', $3)
                  ON CONFLICT DO NOTHING
                `, [userId, resumePath, mediaOrder++]);
              }
              
              // Add video reels if any
              if (actor.videoGallery && actor.videoGallery.length > 0) {
                for (const video of actor.videoGallery) {
                  await client.query(`
                    INSERT INTO media (
                      user_id, type, url, caption, order_index
                    ) VALUES ($1, 'reel', $2, 'Demo Reel', $3)
                    ON CONFLICT DO NOTHING
                  `, [userId, video, mediaOrder++]);
                }
              }
              
              successCount++;
              console.log(`  ✓ Successfully migrated ${actor.fullName}`);
              
            } catch (error) {
              errorCount++;
              console.error(`  ✗ Error migrating actor ${row.Fullname}:`, error.message);
            }
          }
          
          // Commit transaction
          await client.query('COMMIT');
          
          console.log('\n' + '='.repeat(50));
          console.log('✅ Migration completed!');
          console.log(`Successfully migrated: ${successCount} actors`);
          console.log(`Errors: ${errorCount}`);
          console.log('='.repeat(50));
          
        } catch (error) {
          // Rollback on error
          await client.query('ROLLBACK');
          console.error('Migration failed:', error);
          throw error;
        } finally {
          client.release();
        }
        
        resolve();
      })
      .on('error', reject);
  });
}

// Run migration
if (require.main === module) {
  console.log('Starting complete actor migration...');
  console.log('='.repeat(50));
  
  migrateActors()
    .then(() => {
      console.log('\nMigration process finished!');
      console.log('\nNOTE: All actors have been created with password: changeme123');
      console.log('Make sure to implement password reset on first login!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateActors };