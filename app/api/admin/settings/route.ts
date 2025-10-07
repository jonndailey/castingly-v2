import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

// Default settings structure
const defaultSettings = {
  general: {
    siteName: 'Castingly',
    siteDescription: 'Professional casting platform connecting actors, agents, and casting directors',
    contactEmail: 'contact@castingly.com',
    supportEmail: 'support@castingly.com',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    maintenanceMode: false
  },
  email: {
    provider: 'sendgrid',
    sendgridApiKey: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@castingly.com',
    fromName: 'Castingly'
  },
  security: {
    requireEmailVerification: true,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    sessionTimeout: 720, // 12 hours
    maxLoginAttempts: 5,
    accountLockoutDuration: 30, // minutes
    twoFactorEnabled: false
  },
  uploads: {
    maxFileSize: 10485760, // 10MB
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    allowedVideoTypes: ['mp4', 'webm', 'mov', 'avi'],
    allowedDocumentTypes: ['pdf', 'doc', 'docx'],
    imageQuality: 85,
    generateThumbnails: true,
    storageProvider: 'local',
    s3Bucket: '',
    s3Region: 'us-west-2',
    s3AccessKey: '',
    s3SecretKey: ''
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    notifyOnNewUser: true,
    notifyOnPasswordReset: true,
    notifyOnSystemError: true,
    notifyOnHighUsage: false
  },
  features: {
    userRegistrationEnabled: true,
    publicProfilesEnabled: true,
    messagingEnabled: true,
    submissionSystemEnabled: true,
    analyticsEnabled: true,
    maintenancePageEnabled: false
  }
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig)

    // Create settings table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Get all settings
    const [rows] = await connection.execute(
      'SELECT setting_key, setting_value FROM system_settings'
    ) as any

    await connection.end()

    // Build settings object from database
    const settings = { ...defaultSettings }
    
    rows.forEach((row: any) => {
      const keys = row.setting_key.split('.')
      let current = settings as any
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = row.setting_value
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()
    
    const connection = await mysql.createConnection(dbConfig)

    // Create settings table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Function to flatten settings object
    const flattenSettings = (obj: any, prefix = ''): Array<{key: string, value: any}> => {
      const result: Array<{key: string, value: any}> = []
      
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result.push(...flattenSettings(value, fullKey))
        } else {
          result.push({ key: fullKey, value })
        }
      }
      
      return result
    }

    const flatSettings = flattenSettings(settings)

    // Update or insert each setting
    for (const setting of flatSettings) {
      await connection.execute(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_at = CURRENT_TIMESTAMP
      `, [setting.key, JSON.stringify(setting.value)])
    }

    await connection.end()

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}