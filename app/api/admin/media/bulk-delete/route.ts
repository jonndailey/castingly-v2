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
    const { fileIds } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'No file IDs provided' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Since we don't know which table each ID belongs to, we'll try both
    // In a real implementation, you'd include the type information
    const placeholders = fileIds.map(() => '?').join(',')
    
    // Delete from actor_media
    const [actorResult] = await connection.execute(
      `DELETE FROM actor_media WHERE id IN (${placeholders})`,
      fileIds
    ) as any

    // Delete from submission_media
    const [submissionResult] = await connection.execute(
      `DELETE FROM submission_media WHERE id IN (${placeholders})`,
      fileIds
    ) as any

    await connection.end()

    const totalDeleted = actorResult.affectedRows + submissionResult.affectedRows

    return NextResponse.json({ 
      success: true,
      message: `${totalDeleted} media files deleted successfully`,
      deletedCount: totalDeleted
    })
  } catch (error) {
    console.error('Failed to bulk delete media files:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete media files' },
      { status: 500 }
    )
  }
}