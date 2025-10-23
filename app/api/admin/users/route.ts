import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { resolveWebAvatarUrl } from '@/lib/image-url'

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
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    
    const offset = (page - 1) * limit

    const connection = await mysql.createConnection(dbConfig)

    let whereClause = '1=1'
    const queryParams: any[] = []

    if (search) {
      whereClause += ' AND (CONCAT(u.first_name, " ", u.last_name) LIKE ? OR u.email LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (role) {
      whereClause += ' AND u.role = ?'
      queryParams.push(role)
    }

    if (status) {
      whereClause += ' AND u.status = ?'
      queryParams.push(status)
    }

    const [users] = await connection.execute(
      `SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.role,
        COALESCE(u.status, 'active') as status,
        u.last_login,
        u.created_at,
        COALESCE(
          CASE WHEN u.role = 'actor' THEN a.profile_image END,
          u.profile_image
        ) as profile_image
       FROM users u 
       LEFT JOIN actors a ON u.id = a.user_id AND u.role = 'actor'
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    )

    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`,
      queryParams
    ) as any

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    await connection.end()

    const sanitizedUsers = (users as any[]).map((u: any) => ({
      ...u,
      profile_image: resolveWebAvatarUrl(u.profile_image, u.name)
    }))

    return NextResponse.json({
      users: sanitizedUsers,
      currentPage: page,
      totalPages,
      total,
      hasMore: page < totalPages
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
