import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const tokenId = parseInt(id, 10)

    const connection = await mysql.createConnection(dbConfig)

    // Mark the token as expired by setting expires_at to now
    const [result] = await connection.execute(
      'UPDATE password_reset_tokens SET expires_at = NOW() WHERE id = ? AND used = 0',
      [tokenId]
    ) as any

    await connection.end()

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Token not found or already used/expired' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password reset token revoked successfully'
    })
  } catch (error) {
    console.error('Failed to revoke password reset token:', error)
    return NextResponse.json(
      { error: 'Failed to revoke password reset token' },
      { status: 500 }
    )
  }
}
