import { NextRequest, NextResponse } from 'next/server'
import { deleteFile, validateUserToken } from '@/lib/dmapi'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateUserToken(
      request.headers.get('authorization')
    )

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Valid token required' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      )
    }

    await deleteFile(authResult.token, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DMAPI delete failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete media',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
