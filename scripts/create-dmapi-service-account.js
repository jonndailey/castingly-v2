#!/usr/bin/env node

/**
 * Create a service account for DMAPI migration in Dailey Core Auth
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'nikon',
    password: '@0509man1hattaN',
    database: 'dailey_core_auth'
  });

  try {
    const serviceEmail = 'dmapi-service@castingly.com';
    const servicePassword = 'castingly_dmapi_service_2025';
    const userId = uuidv4();
    
    // Check if user already exists
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [serviceEmail]
    );
    
    if (existing.length > 0) {
      console.log('Service account already exists, updating password...');
      const passwordHash = await bcrypt.hash(servicePassword, 12);
      await db.execute(
        'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?',
        [passwordHash, serviceEmail]
      );
    } else {
      console.log('Creating new service account...');
      const passwordHash = await bcrypt.hash(servicePassword, 12);
      
      // Create the service user
      await db.execute(`
        INSERT INTO users (
          id, email, email_verified, password_hash, status,
          created_at, updated_at
        ) VALUES (?, ?, 1, ?, 'active', NOW(), NOW())
      `, [userId, serviceEmail, passwordHash]);
      
      // Add to Castingly tenant with admin role
      await db.execute(`
        INSERT INTO user_tenants (
          user_id, tenant_id, roles, status, joined_at
        ) VALUES (?, '22222222-2222-2222-2222-222222222222', '["user", "admin", "service"]', 'active', NOW())
      `, [userId]);
      
      // Enroll in Castingly app
      await db.execute(`
        INSERT INTO service_enrollments (
          id, user_id, app_id, status, plan, enrolled_at
        ) VALUES (?, ?, '55555555-5555-5555-5555-555555555555', 'active', 'service', NOW())
      `, [uuidv4(), userId]);
    }
    
    console.log('✅ Service account ready:');
    console.log('   Email:', serviceEmail);
    console.log('   Password:', servicePassword);
    console.log('   Tenant: Castingly');
    console.log('');
    console.log('These credentials are already in your .env.local file.');
    
  } catch (error) {
    console.error('❌ Failed to create service account:', error);
  } finally {
    await db.end();
  }
}

main().catch(console.error);