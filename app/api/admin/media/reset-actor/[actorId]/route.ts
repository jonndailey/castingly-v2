import { NextRequest, NextResponse } from 'next/server'
import { listActorFiles, deleteFile as deleteDmapiFile, listBucketFolder } from '@/lib/server/dmapi-service'

// Danger: one-off maintenance endpoint to purge an actor's image files (headshots + gallery)
// Require an explicit confirmation header to avoid accidental use.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ actorId: string }> }
) {
  try {
    const { actorId } = await context.params
    const confirm = request.headers.get('x-confirm')
    if (!actorId) return NextResponse.json({ error: 'Actor ID required' }, { status: 400 })
    if (confirm !== 'purge') {
      return NextResponse.json({ error: 'Confirmation required: set x-confirm: purge' }, { status: 400 })
    }

    let targets: any[] = []
    try {
      const res = await listActorFiles(actorId, { limit: 2000 }) as any
      const files: any[] = Array.isArray(res?.files) ? res.files : []
      targets = files.filter((f) => {
        const cat = f?.metadata?.category
        const path = (f?.metadata?.folderPath || f?.folder_path || f?.path || '').toString()
        const isImage = (f?.mime_type || '').startsWith('image/')
        const isHeadshot = cat === 'headshot' || path.includes('/headshots')
        const isGallery = cat === 'gallery' || path.includes('/gallery')
        return isImage && (isHeadshot || isGallery)
      })
    } catch {}

    // If DB list failed or empty, fall back to bucket folder listings
    if (targets.length === 0) {
      const buckets = ['castingly-public', 'castingly-private']
      const folders = [`actors/${actorId}/headshots`, `actors/${actorId}/gallery`]
      for (const bucket of buckets) {
        for (const path of folders) {
          try {
            const folder = await listBucketFolder({ bucketId: bucket, userId: String(actorId), path })
            const items = Array.isArray(folder?.files) ? folder.files : []
            for (const it of items) {
              if (it && it.is_folder === false) targets.push(it)
            }
          } catch {}
        }
      }
    }

    let deleted = 0
    const failures: Array<{ id: string; error: string }> = []
    for (const f of targets) {
      const id = String(f?.id || '')
      if (!id) continue
      try {
        await deleteDmapiFile(id)
        deleted += 1
      } catch (e: any) {
        failures.push({ id, error: e?.message || 'delete failed' })
      }
    }
    return NextResponse.json({ success: failures.length === 0, deleted, failed: failures })
  } catch (error) {
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
