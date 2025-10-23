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
      'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE'
    ) as any

    const [inactiveUsersResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE is_active = FALSE'
    ) as any

    const [newThisMonthResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)'
    ) as any

    await connection.end()

    const stats = {
      totalUsers: totalUsersResult[0].total,
      activeUsers: activeUsersResult[0].total,
      inactiveUsers: inactiveUsersResult[0].total,
      newThisMonth: newThisMonthResult[0].total,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
