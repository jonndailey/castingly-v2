import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig)

    const [totalUsersResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users'
    ) as any

    const [activeUsersResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM users WHERE COALESCE(status, 'active') = 'active'"
    ) as any

    const [totalActorsResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM users WHERE role = 'actor'"
    ) as any

    const [recentLoginsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any

    let totalMedia = 0
    let passwordResets = 0

    try {
      const [mediaResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM media_files'
      ) as any
      totalMedia = mediaResult[0].total
    } catch (error) {
    }

    try {
      const [resetResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM password_reset_tokens WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      ) as any
      passwordResets = resetResult[0].total
    } catch (error) {
    }

    await connection.end()

    const stats = {
      totalUsers: totalUsersResult[0].total,
      activeUsers: activeUsersResult[0].total,
      totalActors: totalActorsResult[0].total,
      totalMedia,
      recentLogins: recentLoginsResult[0].total,
      passwordResets,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}