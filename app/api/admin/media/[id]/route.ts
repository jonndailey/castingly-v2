import { NextRequest, NextResponse } from 'next/server'
import { deleteFile as deleteDmapiFile } from '@/lib/server/dmapi-service'

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    await deleteDmapiFile(id)

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully',
    })
  } catch (error) {
    console.error(`Failed to delete DMAPI media file ${id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    )
  }
}
