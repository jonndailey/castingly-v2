import { NextRequest, NextResponse } from 'next/server'
import { resolveStorageLocation, uploadFileToDmapi, validateUserToken, type MediaCategory } from '@/lib/dmapi'
import { getFile as getDmapiFile, listFiles as listDmapiFilesServer, listBucketFolder } from '@/lib/server/dmapi-service'
import { maxBytesFor, maxCountFor, simplifyFileResponse } from '@/lib/server/upload-policy'
import { listFiles as listUserFiles } from '@/lib/dmapi'

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

    // Avoid referencing global File if not defined in this runtime
    if (!file || (typeof File !== 'undefined' && !(file instanceof File))) {
      return NextResponse.json(
        { error: 'File missing', message: 'Upload requires a file' },
        { status: 400 }
      )
    }

    const category = mapCategory(providedCategory)
    const { bucketId, folderPath, access } = resolveStorageLocation(authResult.userId, category)

    // Enforce size limit
    const bytes = (file as any)?.size ?? 0
    const maxBytes = maxBytesFor(category)
    if (bytes > maxBytes) {
      return NextResponse.json(
        { error: 'File too large', message: `Max size for ${category} is ${Math.round(maxBytes / (1024 * 1024))}MB` },
        { status: 413 }
      )
    }

    // Enforce count limit per category (can be disabled via DISABLE_IMAGE_LIMITS)
    const disableImageLimits = String(process.env.DISABLE_IMAGE_LIMITS || '').toLowerCase() === 'true'
    if (!disableImageLimits || (category !== 'headshot' && category !== 'gallery')) {
      try {
        const list = await listUserFiles(authResult.token, { limit: 1_000, metadata: { category } })
        const files = Array.isArray(list?.files) ? list.files : []
        const cur = files.filter((f: any) => {
        const metaCat = f?.metadata?.category
        const path = (f?.metadata?.folderPath || f?.folder_path || f?.path || '').toString()
        const byMeta = metaCat === category
        const byPath = category === 'headshot' ? /\/headshots\/?$/i.test(path) || path.includes('/headshots')
                      : category === 'gallery' ? path.includes('/gallery')
                      : true
        const isPublic = f?.is_public === true || String(f?.metadata?.access || '').toLowerCase() === 'public'
        // Only count public images for headshot/gallery limits
        if (category === 'headshot' || category === 'gallery') {
          return (byMeta || byPath) && isPublic
        }
        return byMeta || byPath
      })
      const current = cur.length
      const allowed = maxCountFor(category)
        if (current >= allowed) {
          try {
            console.warn('[media/upload] limit reached', {
              userId: authResult.userId,
              category,
              current,
              allowed,
            })
          } catch {}
          return NextResponse.json(
            { error: 'Limit reached', message: `You can have up to ${allowed} ${category}${allowed === 1 ? '' : 's'}` },
            { status: 409 }
          )
        }
      } catch {
        // Non-fatal; continue
      }
    }

    const metadata = {
      title: formData.get('title')?.toString() || (file as any).name || 'upload',
      description: formData.get('description')?.toString() || '',
    }

    let dmapiResponse: any = null
    try {
      dmapiResponse = await uploadFileToDmapi({
        token: authResult.token,
        file: file as unknown as Blob,
        filename: ((file as any).name as string) || 'upload.bin',
        bucketId,
        folderPath,
        access,
        category,
        metadata,
      })
    } catch (e) {
      // Fallback on duplicate/hash or transient failures: list folder and return latest
      try {
        const folder = await listBucketFolder({
          bucketId,
          userId: String(authResult.userId),
          path: folderPath,
        })
        const files = Array.isArray(folder?.files) ? folder.files : []
        const pick = (arr: any[]) =>
          arr.find((f) => /large\./i.test(String(f.name || ''))) ||
          arr.find((f) => /medium\./i.test(String(f.name || ''))) ||
          arr.find((f) => /small\./i.test(String(f.name || ''))) ||
          arr[0]
        const latest = pick(files)
        if (latest) {
          const simple = simplifyFileResponse(latest)
          let proxy_url: string | null = null
          try {
            const nameFromSigned = (latest?.signed_url || '').split('?')[0].split('/')
            const storedName = nameFromSigned[nameFromSigned.length - 1] || null
            if (storedName) {
              const qp = new URLSearchParams()
              qp.set('bucket', bucketId)
              qp.set('userId', authResult.userId)
              if (folderPath) qp.set('path', folderPath)
              qp.set('name', storedName)
              proxy_url = `/api/media/proxy?${qp.toString()}`
            }
          } catch {}
          return NextResponse.json({ success: true, file: { ...simple, proxy_url }, id: null })
        }
      } catch {}
      throw e
    }
    // Try to resolve a fully populated file record using mediaId
    let fileRecord: any = (dmapiResponse as any)?.file || null
    const dmapiId: string | null = (dmapiResponse as any)?.mediaId || fileRecord?.id || null
    if (dmapiId) {
      try {
        const full = await getDmapiFile(dmapiId)
        fileRecord = full || fileRecord
      } catch {}
    }
    // Fallback: attempt to locate newest file by listing when DB fetch fails
    if ((!fileRecord || !fileRecord.public_url) && category) {
      try {
        const list = await listUserFiles(authResult.token, { limit: 1000, metadata: { category } })
        const candidates = Array.isArray(list?.files) ? list.files : []
        const pathMatch = (v: any) => {
          const p = (v?.folder_path || v?.metadata?.folderPath || '').toString()
          return category === 'headshot' ? p.includes('/headshots') : category === 'gallery' ? p.includes('/gallery') : true
        }
        const filtered = candidates.filter(pathMatch)
        const latest = filtered.sort((a: any,b: any)=> new Date(b.uploaded_at||0).getTime()-new Date(a.uploaded_at||0).getTime())[0]
        if (latest) fileRecord = latest
      } catch {}
    }
    const simple = simplifyFileResponse(fileRecord)
    // Build a stable proxy URL if we can infer stored object name; include a presigned URL when available
    let proxy_url: string | null = null
    try {
      const nameFromSigned = (fileRecord?.signed_url || '').split('?')[0].split('/')
      const storedName = nameFromSigned[nameFromSigned.length - 1] || null
      if (storedName) {
        const qp = new URLSearchParams()
        qp.set('bucket', bucketId)
        qp.set('userId', authResult.userId)
        if (folderPath) qp.set('path', folderPath)
        qp.set('name', storedName)
        if (fileRecord?.signed_url) qp.set('signed', fileRecord.signed_url)
        proxy_url = `/api/media/proxy?${qp.toString()}`
      }
    } catch {}
    return NextResponse.json({ success: true, file: { ...simple, proxy_url }, id: dmapiId })
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
    case 'gallery':
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
