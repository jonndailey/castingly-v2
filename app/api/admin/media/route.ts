import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const mediaType = searchParams.get('media_type') || ''
    
    const offset = (page - 1) * limit

    const connection = await mysql.createConnection(dbConfig)

    // Build the query to get media files from both tables
    let actorMediaQuery = `
      SELECT 
        am.id,
        'actor_media' as type,
        am.media_type,
        am.media_url,
        am.caption,
        am.is_primary,
        CONCAT(u.first_name, ' ', u.last_name) as owner_name,
        u.email as owner_email,
        u.id as owner_id,
        am.created_at
      FROM actor_media am
      JOIN actors a ON am.actor_id = a.user_id
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `

    let submissionMediaQuery = `
      SELECT 
        sm.id,
        'submission_media' as type,
        sm.media_type,
        sm.media_url,
        NULL as caption,
        0 as is_primary,
        CONCAT(u.first_name, ' ', u.last_name) as owner_name,
        u.email as owner_email,
        u.id as owner_id,
        sm.created_at
      FROM submission_media sm
      JOIN submissions s ON sm.submission_id = s.id
      JOIN users u ON s.actor_id = u.id
      WHERE 1=1
    `

    const queryParams: any[] = []

    // Add search conditions
    if (search) {
      const searchCondition = ` AND (CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.email LIKE ? OR am.caption LIKE ?)`
      actorMediaQuery += searchCondition
      submissionMediaQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR u.email LIKE ?)`
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    // Add media type filter
    if (mediaType) {
      actorMediaQuery += ` AND am.media_type = ?`
      submissionMediaQuery += ` AND sm.media_type = ?`
      queryParams.push(mediaType, mediaType)
    }

    // Combine queries based on type filter
    let finalQuery = ''
    if (type === 'actor_media') {
      finalQuery = actorMediaQuery
    } else if (type === 'submission_media') {
      finalQuery = submissionMediaQuery
    } else {
      finalQuery = `(${actorMediaQuery}) UNION ALL (${submissionMediaQuery})`
    }

    finalQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`

    const [files] = await connection.execute(finalQuery, [...queryParams, limit, offset])

    // Get total count for pagination
    let countQuery = ''
    let countParams = [...queryParams]
    
    if (type === 'actor_media') {
      countQuery = actorMediaQuery.replace('SELECT am.id, \'actor_media\' as type, am.media_type, am.media_url, am.caption, am.is_primary, CONCAT(u.first_name, \' \', u.last_name) as owner_name, u.email as owner_email, u.id as owner_id, am.created_at', 'SELECT COUNT(*) as total')
    } else if (type === 'submission_media') {
      countQuery = submissionMediaQuery.replace('SELECT sm.id, \'submission_media\' as type, sm.media_type, sm.media_url, NULL as caption, 0 as is_primary, CONCAT(u.first_name, \' \', u.last_name) as owner_name, u.email as owner_email, u.id as owner_id, sm.created_at', 'SELECT COUNT(*) as total')
    } else {
      countQuery = `SELECT COUNT(*) as total FROM ((${actorMediaQuery.replace('SELECT am.id, \'actor_media\' as type, am.media_type, am.media_url, am.caption, am.is_primary, CONCAT(u.first_name, \' \', u.last_name) as owner_name, u.email as owner_email, u.id as owner_id, am.created_at', 'SELECT 1')}) UNION ALL (${submissionMediaQuery.replace('SELECT sm.id, \'submission_media\' as type, sm.media_type, sm.media_url, NULL as caption, 0 as is_primary, CONCAT(u.first_name, \' \', u.last_name) as owner_name, u.email as owner_email, u.id as owner_id, sm.created_at', 'SELECT 1')})) as combined`
    }

    const [countResult] = await connection.execute(countQuery, countParams) as any
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    await connection.end()

    return NextResponse.json({
      files,
      currentPage: page,
      totalPages,
      total,
      hasMore: page < totalPages
    })
  } catch (error) {
    console.error('Failed to fetch media files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    )
  }
}