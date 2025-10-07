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

    const [totalLogsResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM audit_logs'
    ) as any

    const [logsTodayResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM audit_logs WHERE DATE(created_at) = CURDATE()'
    ) as any

    const [logsThisWeekResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any

    const [highSeverityLogsResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM audit_logs WHERE severity IN ('high', 'critical')"
    ) as any

    const [topActionsResult] = await connection.execute(
      `SELECT action, COUNT(*) as count 
       FROM audit_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY action 
       ORDER BY count DESC 
       LIMIT 5`
    ) as any

    const [topAdminsResult] = await connection.execute(
      `SELECT CONCAT(u.first_name, ' ', u.last_name) as admin_name, COUNT(*) as count
       FROM audit_logs al
       JOIN users u ON al.admin_id = u.id
       WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY al.admin_id, u.first_name, u.last_name
       ORDER BY count DESC 
       LIMIT 5`
    ) as any

    await connection.end()

    const stats = {
      totalLogs: totalLogsResult[0].total,
      logsToday: logsTodayResult[0].total,
      logsThisWeek: logsThisWeekResult[0].total,
      highSeverityLogs: highSeverityLogsResult[0].total,
      topActions: topActionsResult,
      topAdmins: topAdminsResult,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch audit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit stats' },
      { status: 500 }
    )
  }
}