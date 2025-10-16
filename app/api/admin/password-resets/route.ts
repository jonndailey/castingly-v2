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
    const status = searchParams.get('status') || ''
    
    const offset = (page - 1) * limit

    const connection = await mysql.createConnection(dbConfig)

    let whereClause = '1=1'
    const queryParams: any[] = []

    if (search) {
      whereClause += ' AND (CONCAT(u.first_name, " ", u.last_name) LIKE ? OR u.email LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (status) {
      switch (status) {
        case 'pending':
          whereClause += ' AND prt.used = 0 AND prt.expires_at > NOW()'
          break
        case 'used':
          whereClause += ' AND prt.used = 1'
          break
        case 'expired':
          whereClause += ' AND prt.used = 0 AND prt.expires_at <= NOW()'
          break
      }
    }

    const selectWithMetadata = `SELECT 
        prt.id,
        prt.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        prt.token,
        prt.created_at,
        prt.expires_at,
        prt.used,
        prt.used_at,
        prt.ip_address,
        prt.user_agent
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE ${whereClause}
       ORDER BY prt.created_at DESC
       LIMIT ? OFFSET ?`

    const selectWithoutMetadata = `SELECT 
        prt.id,
        prt.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        prt.token,
        prt.created_at,
        prt.expires_at,
        prt.used,
        prt.used_at,
        NULL as ip_address,
        NULL as user_agent
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE ${whereClause}
       ORDER BY prt.created_at DESC
       LIMIT ? OFFSET ?`

    let requests: any[] = []

    try {
      const [rows] = await connection.execute(
        selectWithMetadata,
        [...queryParams, limit, offset]
      )
      requests = rows as any[]
    } catch (selectError: any) {
      if (selectError?.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await connection.execute(
          selectWithoutMetadata,
          [...queryParams, limit, offset]
        )
        requests = rows as any[]
      } else {
        throw selectError
      }
    }

    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total 
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE ${whereClause}`,
      queryParams
    ) as any

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    await connection.end()

    return NextResponse.json({
      requests,
      currentPage: page,
      totalPages,
      total,
      hasMore: page < totalPages
    })
  } catch (error) {
    console.error('Failed to fetch password resets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch password resets' },
      { status: 500 }
    )
  }
}
