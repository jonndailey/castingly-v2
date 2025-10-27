import { NextRequest, NextResponse } from 'next/server'
import { listFiles, validateUserToken } from '@/lib/dmapi'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '100', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)
    const categoryFilter = searchParams.get('category')?.toLowerCase()

    const dmapiData = await listFiles(authResult.token, { limit, offset })
    const files = (dmapiData?.files ?? []).map((file) => ({
      ...file,
      metadata: file.metadata || {},
    }))

    const filtered =
      categoryFilter && categoryFilter !== 'all'
        ? files.filter((file) => {
            const metadata = (file.metadata || {}) as Record<string, unknown>
            const categoryValue = (metadata['category'] as string | undefined)?.toLowerCase()
            const tags = metadata['tags']
            const firstTag = Array.isArray(tags) && tags.length > 0 ? String(tags[0]).toLowerCase() : undefined
            const folderPath = String((metadata['folderPath'] || (file as any).folder_path || '') || '').toLowerCase()
            const storageKey = String((file as any).storage_key || '').toLowerCase()
            const name = String((file as any).original_filename || (file as any).name || '').toLowerCase()

            // Derive category from multiple hints
            const isHeadshot =
              categoryFilter === 'headshot' && (
                categoryValue === 'headshot' ||
                firstTag === 'headshot' ||
                folderPath.includes('/headshots') ||
                storageKey.includes('/headshots') ||
                name.includes('headshot')
              )

            const isResume =
              categoryFilter === 'resume' && (
                categoryValue === 'resume' || firstTag === 'resume' || folderPath.includes('/resumes') || storageKey.includes('/resumes')
              )

            const isReel =
              categoryFilter === 'reel' && (
                categoryValue === 'reel' || firstTag === 'reel' || folderPath.includes('/reels') || storageKey.includes('/reels')
              )

            const isSelfTape =
              categoryFilter === 'self_tape' && (
                categoryValue === 'self_tape' || firstTag === 'self_tape' || folderPath.includes('self-tape') || folderPath.includes('self_tape')
              )

            const isVoiceOver =
              categoryFilter === 'voice_over' && (
                categoryValue === 'voice_over' || firstTag === 'voice_over' || folderPath.includes('voice')
              )

            const isDocument =
              categoryFilter === 'document' && (
                categoryValue === 'document' || firstTag === 'document' || folderPath.includes('/documents')
              )

            const matchByValue = categoryValue === categoryFilter || firstTag === categoryFilter
            return (
              matchByValue || isHeadshot || isResume || isReel || isSelfTape || isVoiceOver || isDocument
            )
          })
        : files

    return NextResponse.json({
      success: true,
      files: filtered,
      pagination: dmapiData.pagination,
    })
  } catch (error) {
    console.error('DMAPI list failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to list media',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
