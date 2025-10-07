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

    // Get actor media stats
    const [actorMediaResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM actor_media'
    ) as any

    // Get submission media stats  
    const [submissionMediaResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM submission_media'
    ) as any

    // Get media type breakdown
    const [headshotsResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM actor_media WHERE media_type = 'headshot'"
    ) as any

    const [videosResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM (SELECT id FROM actor_media WHERE media_type = 'reel' UNION ALL SELECT id FROM submission_media WHERE media_type = 'audition_video') as videos"
    ) as any

    const [reelsResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM actor_media WHERE media_type = 'reel'"
    ) as any

    const [resumesResult] = await connection.execute(
      "SELECT COUNT(*) as total FROM actor_media WHERE media_type = 'resume'"
    ) as any

    // Get recent uploads (last 7 days)
    const [recentUploadsResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM (
        SELECT created_at FROM actor_media WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL 
        SELECT created_at FROM submission_media WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ) as recent`
    ) as any

    await connection.end()

    const totalFiles = actorMediaResult[0].total + submissionMediaResult[0].total

    const stats = {
      totalFiles,
      totalSize: `${(totalFiles * 2.5).toFixed(1)} MB`, // Estimated average file size
      actorMedia: actorMediaResult[0].total,
      submissionMedia: submissionMediaResult[0].total,
      headshots: headshotsResult[0].total,
      videos: videosResult[0].total,
      reels: reelsResult[0].total,
      resumes: resumesResult[0].total,
      recentUploads: recentUploadsResult[0].total,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch media stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media stats' },
      { status: 500 }
    )
  }
}