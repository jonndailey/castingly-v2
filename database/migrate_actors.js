const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'castingly',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Helper function to parse specialties from CSV format
function parseSpecialties(specialtiesStr) {
  if (!specialtiesStr) return [];
  try {
    // Remove outer quotes and parse as JSON
    const cleaned = specialtiesStr.replace(/^"|"$/g, '').replace(/""/g, '"');
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Failed to parse specialties:', specialtiesStr);
    return [];
  }
}

// Helper function to parse image files
function parseImageFiles(imageFilesStr) {
  if (!imageFilesStr) return [];
  // Split by semicolon and trim
  return imageFilesStr.split(';').map(f => f.trim()).filter(f => f);
}

// Helper function to clean HTML from experience summary
function cleanHTML(html) {
  if (!html) return '';
  // Basic HTML tag removal
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

// Map specialties to skills and performance skills
function mapSpecialtiesToSkills(specialties) {
  const skills = [];
  const performanceSkills = [];
  
  specialties.forEach(specialty => {
    const lower = specialty.toLowerCase();
    if (['voice acting', 'voiceover', 'voice'].includes(lower)) {
      performanceSkills.push('Voice Acting');
    } else if (['theater', 'theatre'].includes(lower)) {
      performanceSkills.push('Theater');
    } else if (['film', 'movies'].includes(lower)) {
      performanceSkills.push('Film Acting');
    } else if (['comedy', 'stand-up', 'improv'].includes(lower)) {
      performanceSkills.push('Comedy');
    } else if (['drama', 'dramatic'].includes(lower)) {
      performanceSkills.push('Drama');
    } else if (['stunt', 'stunts', 'stunt performance'].includes(lower)) {
      skills.push('Stunt Performance');
    } else {
      skills.push(specialty);
    }
  });
  
  return { skills, performanceSkills };
}

async function migrateActors() {
  const csvPath = path.join(__dirname, '..', 'image_mapping.csv');
  const actors = [];
  
  // Read and parse CSV
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        actors.push(row);
      })
      .on('end', async () => {
        console.log(`Found ${actors.length} actors to migrate`);
        
        const client = await pool.connect();
        
        try {
          // Start transaction
          await client.query('BEGIN');
          
          for (const actor of actors) {
            console.log(`\nMigrating actor: ${actor.Full_Name}`);
            
            // Parse data
            const specialties = parseSpecialties(actor.Specialties);
            const { skills, performanceSkills } = mapSpecialtiesToSkills(specialties);
            const imageFiles = parseImageFiles(actor.Image_Files);
            const bio = cleanHTML(actor.Experience_Summary);
            
            // Generate a temporary password (you'll want to force password reset on first login)
            const tempPassword = 'changeme123';
            
            // 1. Create user account
            const userResult = await client.query(`
              INSERT INTO users (id, email, password_hash, name, role, is_active, email_verified)
              VALUES ($1, $2, $3, $4, 'actor', true, false)
              ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name
              RETURNING id
            `, [
              actor.Actor_ID,
              actor.Email.toLowerCase(),
              tempPassword, // In production, this should be hashed
              actor.Full_Name
            ]);
            
            const userId = userResult.rows[0].id;
            console.log(`  Created user: ${userId}`);
            
            // 2. Create profile
            await client.query(`
              INSERT INTO profiles (
                user_id, bio, location, skills, performance_skills,
                available_for_work, profile_completion
              ) VALUES ($1, $2, $3, $4, $5, true, 50)
              ON CONFLICT (user_id) DO UPDATE SET
                bio = EXCLUDED.bio,
                location = EXCLUDED.location,
                skills = EXCLUDED.skills,
                performance_skills = EXCLUDED.performance_skills
            `, [
              userId,
              bio || `Professional actor based in ${actor.City || 'Los Angeles'}`,
              actor.City || 'Los Angeles',
              skills,
              performanceSkills
            ]);
            console.log(`  Created profile`);
            
            // 3. Add media (headshots and gallery images)
            let primarySet = false;
            
            for (const imageFile of imageFiles) {
              const isProfile = imageFile.startsWith('profile_');
              const isGallery = imageFile.startsWith('gallery_');
              
              if (isProfile || isGallery) {
                const imagePath = `/${actor.Folder_Path}/${imageFile}`;
                
                await client.query(`
                  INSERT INTO media (
                    user_id, type, url, is_primary, caption, order_index
                  ) VALUES ($1, 'headshot', $2, $3, $4, $5)
                  ON CONFLICT DO NOTHING
                `, [
                  userId,
                  imagePath,
                  !primarySet && isProfile, // First profile image is primary
                  isProfile ? 'Profile Photo' : 'Gallery Photo',
                  isProfile ? 0 : 1
                ]);
                
                if (isProfile) primarySet = true;
              }
            }
            console.log(`  Added ${imageFiles.length} media files`);
            
            // 4. Check for resume file
            const resumePath = `/${actor.Folder_Path.replace('downloaded_images', 'downloaded_resumes')}`;
            const resumeFolder = path.join(__dirname, '..', 'downloaded_resumes', `${actor.Actor_ID}_${actor.Full_Name}`);
            
            if (fs.existsSync(resumeFolder)) {
              const resumeFiles = fs.readdirSync(resumeFolder);
              for (const resumeFile of resumeFiles) {
                if (resumeFile.endsWith('.pdf') || resumeFile.endsWith('.doc') || resumeFile.endsWith('.docx')) {
                  await client.query(`
                    INSERT INTO media (
                      user_id, type, url, caption
                    ) VALUES ($1, 'resume', $2, $3)
                    ON CONFLICT DO NOTHING
                  `, [
                    userId,
                    `/downloaded_resumes/${actor.Actor_ID}_${actor.Full_Name}/${resumeFile}`,
                    'Acting Resume'
                  ]);
                  console.log(`  Added resume: ${resumeFile}`);
                }
              }
            }
          }
          
          // Commit transaction
          await client.query('COMMIT');
          console.log('\n✅ Migration completed successfully!');
          console.log(`Migrated ${actors.length} actors with their media files`);
          
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
  console.log('Starting actor migration...');
  console.log('================================');
  
  migrateActors()
    .then(() => {
      console.log('\n================================');
      console.log('Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n================================');
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateActors };