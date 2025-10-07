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

    const [totalRequestsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM password_reset_tokens'
    ) as any

    const [pendingRequestsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM password_reset_tokens WHERE used = 0 AND expires_at > NOW()'
    ) as any

    const [usedRequestsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM password_reset_tokens WHERE used = 1'
    ) as any

    const [expiredRequestsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM password_reset_tokens WHERE used = 0 AND expires_at <= NOW()'
    ) as any

    const [requestsTodayResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM password_reset_tokens WHERE DATE(created_at) = CURDATE()'
    ) as any

    const [requestsThisWeekResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM password_reset_tokens WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any

    await connection.end()

    const stats = {
      totalRequests: totalRequestsResult[0].total,
      pendingRequests: pendingRequestsResult[0].total,
      usedRequests: usedRequestsResult[0].total,
      expiredRequests: expiredRequestsResult[0].total,
      requestsToday: requestsTodayResult[0].total,
      requestsThisWeek: requestsThisWeekResult[0].total,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch password reset stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch password reset stats' },
      { status: 500 }
    )
  }
}