import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'actor_media' // Default to actor_media

    const connection = await mysql.createConnection(dbConfig)

    let result: any
    if (type === 'submission_media') {
      [result] = await connection.execute(
        'DELETE FROM submission_media WHERE id = ?',
        [fileId]
      )
    } else {
      [result] = await connection.execute(
        'DELETE FROM actor_media WHERE id = ?',
        [fileId]
      )
    }

    await connection.end()

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Media file deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete media file:', error)
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    )
  }
}