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
    const action = searchParams.get('action') || ''
    const severity = searchParams.get('severity') || ''
    const date = searchParams.get('date') || ''
    const exportData = searchParams.get('export') === 'true'
    
    const offset = (page - 1) * limit

    const connection = await mysql.createConnection(dbConfig)

    let whereClause = '1=1'
    const queryParams: any[] = []

    if (search) {
      whereClause += ' AND (CONCAT(admin_u.first_name, " ", admin_u.last_name) LIKE ? OR al.action LIKE ? OR al.details LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (action) {
      whereClause += ' AND al.action = ?'
      queryParams.push(action)
    }

    if (severity) {
      whereClause += ' AND al.severity = ?'
      queryParams.push(severity)
    }

    if (date) {
      switch (date) {
        case 'today':
          whereClause += ' AND DATE(al.created_at) = CURDATE()'
          break
        case 'week':
          whereClause += ' AND al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
          break
        case 'month':
          whereClause += ' AND al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
          break
      }
    }

    const selectQuery = `
      SELECT 
        al.id,
        al.admin_id,
        CONCAT(admin_u.first_name, ' ', admin_u.last_name) as admin_name,
        admin_u.email as admin_email,
        al.action,
        al.resource_type,
        al.resource_id,
        al.target_user_id,
        CASE 
          WHEN al.target_user_id IS NOT NULL 
          THEN CONCAT(target_u.first_name, ' ', target_u.last_name)
          ELSE NULL 
        END as target_user_name,
        al.details,
        al.ip_address,
        al.user_agent,
        al.severity,
        al.created_at
      FROM audit_logs al
      JOIN users admin_u ON al.admin_id = admin_u.id
      LEFT JOIN users target_u ON al.target_user_id = target_u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
    `

    if (exportData) {
      // Export all matching records as CSV
      const [logs] = await connection.execute(selectQuery, queryParams)
      await connection.end()

      // Convert to CSV
      const headers = ['ID', 'Admin', 'Action', 'Resource Type', 'Target User', 'Details', 'IP Address', 'Severity', 'Created At']
      const csvData = [
        headers.join(','),
        ...(logs as any[]).map((log: any) => [
          log.id,
          `"${log.admin_name}"`,
          log.action,
          log.resource_type,
          log.target_user_name ? `"${log.target_user_name}"` : '',
          `"${log.details.replace(/"/g, '""')}"`,
          log.ip_address,
          log.severity,
          log.created_at
        ].join(','))
      ].join('\n')

      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    const [logs] = await connection.execute(
      selectQuery + ' LIMIT ? OFFSET ?',
      [...queryParams, limit, offset]
    )

    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total 
       FROM audit_logs al
       JOIN users admin_u ON al.admin_id = admin_u.id
       LEFT JOIN users target_u ON al.target_user_id = target_u.id
       WHERE ${whereClause}`,
      queryParams
    ) as any

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    await connection.end()

    return NextResponse.json({
      logs,
      currentPage: page,
      totalPages,
      total,
      hasMore: page < totalPages
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}