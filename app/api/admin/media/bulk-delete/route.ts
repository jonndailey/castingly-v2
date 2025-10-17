import { NextRequest, NextResponse } from 'next/server'
import { deleteFile as deleteDmapiFile } from '@/lib/server/dmapi-service'

export async function POST(request: NextRequest) {
  try {
    const { fileIds } = await request.json()

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'No file IDs provided' },
        { status: 400 }
      )
    }

    let deletedCount = 0
    const failures: Array<{ id: string; error: string }> = []

    for (const rawId of fileIds) {
      const id = String(rawId)
      if (!id) continue

      try {
        await deleteDmapiFile(id)
        deletedCount += 1
      } catch (error) {
        console.error(`Failed to delete DMAPI file ${id}:`, error)
        failures.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      deletedCount,
      failedCount: failures.length,
      failures,
    })
  } catch (error) {
    console.error('Failed to bulk delete DMAPI media files:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete media files' },
      { status: 500 }
    )
  }
}
