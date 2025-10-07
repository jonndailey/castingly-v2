import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function POST(request: NextRequest) {
  try {
    const { action, userIds } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid action or user IDs' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)
    const placeholders = userIds.map(() => '?').join(',')
    let result: any
    let message = ''

    switch (action) {
      case 'activate':
        [result] = await connection.execute(
          `UPDATE users SET status = 'active', updated_at = NOW() WHERE id IN (${placeholders})`,
          userIds
        )
        message = `${result.affectedRows} users activated successfully`
        break

      case 'deactivate':
        [result] = await connection.execute(
          `UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id IN (${placeholders})`,
          userIds
        )
        message = `${result.affectedRows} users deactivated successfully`
        break

      case 'delete':
        // First, delete related records to avoid foreign key constraints
        
        // Delete actor media
        await connection.execute(
          `DELETE am FROM actor_media am 
           JOIN actors a ON am.actor_id = a.user_id 
           WHERE a.user_id IN (${placeholders})`,
          userIds
        )

        // Delete submission media
        await connection.execute(
          `DELETE sm FROM submission_media sm 
           JOIN submissions s ON sm.submission_id = s.id 
           WHERE s.actor_id IN (${placeholders})`,
          userIds
        )

        // Delete submissions
        await connection.execute(
          `DELETE FROM submissions WHERE actor_id IN (${placeholders})`,
          userIds
        )

        // Delete actors
        await connection.execute(
          `DELETE FROM actors WHERE user_id IN (${placeholders})`,
          userIds
        )

        // Delete agents
        await connection.execute(
          `DELETE FROM agents WHERE user_id IN (${placeholders})`,
          userIds
        )

        // Delete casting directors
        await connection.execute(
          `DELETE FROM casting_directors WHERE user_id IN (${placeholders})`,
          userIds
        )

        // Delete password reset tokens
        await connection.execute(
          `DELETE FROM password_reset_tokens WHERE user_id IN (${placeholders})`,
          userIds
        )

        // Finally, delete users
        [result] = await connection.execute(
          `DELETE FROM users WHERE id IN (${placeholders})`,
          userIds
        )
        message = `${result.affectedRows} users deleted successfully`
        break

      case 'export':
        // Generate CSV data
        const [exportResult] = await connection.execute(
          `SELECT 
            id,
            CONCAT(first_name, ' ', last_name) as name,
            email,
            role,
            COALESCE(status, 'active') as status,
            created_at,
            last_login
           FROM users 
           WHERE id IN (${placeholders})
           ORDER BY created_at DESC`,
          userIds
        ) as any

        await connection.end()

        // Convert to CSV
        const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At', 'Last Login']
        const csvData = [
          headers.join(','),
          ...exportResult.map((row: any) => [
            row.id,
            `"${row.name}"`,
            row.email,
            row.role,
            row.status,
            row.created_at,
            row.last_login || 'Never'
          ].join(','))
        ].join('\n')

        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
          }
        })

      default:
        await connection.end()
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    await connection.end()

    return NextResponse.json({ 
      success: true,
      message,
      affectedRows: result.affectedRows
    })
  } catch (error) {
    console.error('Failed to perform bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}