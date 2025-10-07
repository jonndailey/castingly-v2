import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const { status } = await request.json()

    if (!['active', 'inactive', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, inactive, or pending' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    const [result] = await connection.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, userId]
    ) as any

    await connection.end()

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `User status updated to ${status}`
    })
  } catch (error) {
    console.error('Failed to update user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}