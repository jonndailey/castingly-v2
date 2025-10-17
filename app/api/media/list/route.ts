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
            const categoryValue = metadata['category'] as string | undefined
            const tags = metadata['tags']
            const firstTag =
              Array.isArray(tags) && tags.length > 0
                ? (tags[0] as string | undefined)
                : undefined
            const fileCategory = categoryValue ?? firstTag
            return fileCategory?.toLowerCase() === categoryFilter
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
