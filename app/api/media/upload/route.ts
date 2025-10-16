import { NextRequest, NextResponse } from 'next/server'
import {
  resolveStorageLocation,
  uploadFileToDmapi,
  validateUserToken,
  type MediaCategory,
} from '@/lib/dmapi'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file')
    const providedCategory = formData.get('category')?.toString()

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File missing', message: 'Upload requires a file' },
        { status: 400 }
      )
    }

    const category = mapCategory(providedCategory)
    const { bucketId, folderPath, access } = resolveStorageLocation(
      authResult.userId,
      category
    )

    const metadata = {
      title: formData.get('title')?.toString() || file.name,
      description: formData.get('description')?.toString() || '',
    }

    const dmapiResponse = await uploadFileToDmapi({
      token: authResult.token,
      file,
      filename: file.name,
      bucketId,
      folderPath,
      access,
      category,
      metadata,
    })

    return NextResponse.json(dmapiResponse)
  } catch (error) {
    console.error('DMAPI upload failed:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        message:
          error instanceof Error ? error.message : 'Unknown upload error',
      },
      { status: 500 }
    )
  }
}

function mapCategory(value?: string): MediaCategory {
  switch (value) {
    case 'headshot':
    case 'reel':
    case 'resume':
    case 'self_tape':
    case 'voice_over':
    case 'document':
      return value
    default:
      return 'other'
  }
}
