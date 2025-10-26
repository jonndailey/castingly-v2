export type UploadCategory =
  | 'headshot'
  | 'gallery'
  | 'reel'
  | 'resume'
  | 'self_tape'
  | 'voice_over'
  | 'document'
  | 'other'

export function maxCountFor(category: UploadCategory): number {
  switch (category) {
    case 'headshot':
    case 'gallery':
      return parseInt(process.env.MEDIA_LIMIT_IMAGE_COUNT || '20', 10)
    case 'reel':
      return parseInt(process.env.MEDIA_LIMIT_REEL_COUNT || '10', 10)
    case 'resume':
    case 'document':
      return parseInt(process.env.MEDIA_LIMIT_DOC_COUNT || '20', 10)
    case 'self_tape':
    case 'voice_over':
      return parseInt(process.env.MEDIA_LIMIT_AV_COUNT || '20', 10)
    default:
      return parseInt(process.env.MEDIA_LIMIT_DEFAULT_COUNT || '20', 10)
  }
}

export function maxBytesFor(category: UploadCategory): number {
  // Defaults can be tuned via env vars
  const MB = 1024 * 1024
  switch (category) {
    case 'reel':
      return parseInt(process.env.MEDIA_LIMIT_REEL_MAX_MB || '500', 10) * MB
    case 'headshot':
    case 'gallery':
      return parseInt(process.env.MEDIA_LIMIT_IMAGE_MAX_MB || '25', 10) * MB
    case 'resume':
    case 'document':
      return parseInt(process.env.MEDIA_LIMIT_DOC_MAX_MB || '20', 10) * MB
    case 'self_tape':
    case 'voice_over':
      return parseInt(process.env.MEDIA_LIMIT_AV_MAX_MB || '500', 10) * MB
    default:
      return parseInt(process.env.MEDIA_LIMIT_DEFAULT_MAX_MB || '50', 10) * MB
  }
}

export function simplifyFileResponse(file: any) {
  if (!file || typeof file !== 'object') return null
  return {
    id: file.id,
    name: file.original_filename || file.caption || file.name || null,
    url: file.public_url || file.url || null,
    signed_url: file.signed_url || null,
    thumbnail_url: file.thumbnail_url || file.thumbnail_signed_url || null,
    uploaded_at: file.uploaded_at || null,
    category: file?.metadata?.category || null,
  }
}

