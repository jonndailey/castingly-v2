import { daileyCoreAuth } from '@/lib/auth/dailey-core'

const DMAPI_BASE_URL =
  process.env.DMAPI_BASE_URL ||
  process.env.NEXT_PUBLIC_DMAPI_BASE_URL ||
  'http://localhost:4100'

type HttpMethod = 'GET' | 'POST' | 'DELETE'

export interface DmapiFile {
  id: string
  original_filename: string
  file_size: number
  mime_type: string
  file_extension: string
  uploaded_at: string
  processing_status?: string
  is_public?: boolean
  public_url?: string | null
  signed_url?: string | null
  thumbnail_url?: string | null
  thumbnail_signed_url?: string | null
  metadata?: Record<string, unknown>
  categories?: string[]
}

interface DmapiListResponse {
  success: boolean
  files: DmapiFile[]
  pagination?: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

function ensureBaseUrl() {
  if (!DMAPI_BASE_URL) {
    throw new Error('DMAPI_BASE_URL is not configured')
  }
  return DMAPI_BASE_URL.replace(/\/$/, '')
}

async function dmapiFetch(
  path: string,
  options: {
    method?: HttpMethod
    token: string
    body?: BodyInit | null
    headers?: Record<string, string>
  }
) {
  const { method = 'GET', token, body, headers = {} } = options
  const baseUrl = ensureBaseUrl()

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  })

  if (!response.ok) {
    const errorPayload = await safeJson(response)
    throw new Error(
      errorPayload?.error ||
        errorPayload?.message ||
        `DMAPI request failed (${response.status})`
    )
  }

  return safeJson(response)
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function validateUserToken(
  authorizationHeader?: string | null
) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authorizationHeader.slice('Bearer '.length)
  const validation = await daileyCoreAuth.validateToken(token)
  if (!validation?.valid || !validation.user) {
    return null
  }

  return {
    token,
    userId: validation.user.id,
    email: validation.user.email,
  }
}

export type MediaCategory =
  | 'headshot'
  | 'gallery'
  | 'resume'
  | 'reel'
  | 'self_tape'
  | 'voice_over'
  | 'document'
  | 'other'

interface StorageLocation {
  bucketId: string
  folderPath: string
  access: 'public' | 'private'
}

export function resolveStorageLocation(
  userId: string,
  category: MediaCategory
): StorageLocation {
  switch (category) {
    case 'headshot':
      return {
        bucketId: 'castingly-private',
        folderPath: `actors/${userId}/headshots`,
        access: 'private',
      }
    case 'gallery':
      return {
        bucketId: 'castingly-public',
        folderPath: `actors/${userId}/gallery`,
        access: 'public',
      }
    case 'reel':
      return {
        bucketId: 'castingly-public',
        folderPath: `actors/${userId}/reels`,
        access: 'public',
      }
    case 'voice_over':
      return {
        bucketId: 'castingly-public',
        folderPath: `actors/${userId}/voice-over`,
        access: 'public',
      }
    case 'resume':
      return {
        bucketId: 'castingly-private',
        folderPath: `actors/${userId}/resumes`,
        access: 'private',
      }
    case 'self_tape':
      return {
        bucketId: 'castingly-private',
        folderPath: `actors/${userId}/self-tapes`,
        access: 'private',
      }
    case 'document':
      return {
        bucketId: 'castingly-private',
        folderPath: `actors/${userId}/documents`,
        access: 'private',
      }
    case 'other':
    default:
      return {
        bucketId: 'castingly-private',
        folderPath: `actors/${userId}/misc`,
        access: 'private',
      }
  }
}

export async function listFiles(
  token: string,
  params?: { limit?: number; offset?: number; metadata?: Record<string, string | number | boolean> }
) {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', params.limit.toString())
  if (params?.offset) query.set('offset', params.offset.toString())
  if (params?.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      if (v === undefined || v === null) continue
      query.append(`metadata[${k}]`, String(v))
    }
  }

  const data = (await dmapiFetch(`/api/files?${query.toString()}`, {
    method: 'GET',
    token,
  })) as DmapiListResponse

  return data
}

export async function deleteFile(token: string, fileId: string) {
  await dmapiFetch(`/api/files/${fileId}`, {
    method: 'DELETE',
    token,
  })
}

export async function uploadFileToDmapi(options: {
  token: string
  file: File | Blob
  filename: string
  bucketId: string
  folderPath: string
  access: 'public' | 'private'
  category: MediaCategory
  metadata?: Record<string, unknown>
}) {
  const form = new FormData()
  form.append('file', options.file, options.filename)
  form.append('bucket_id', options.bucketId)
  form.append('folder_path', options.folderPath)
  form.append('app_id', 'castingly')

  const metadata = {
    category: options.category,
    bucketId: options.bucketId,
    folderPath: options.folderPath,
    bucketAccess: options.access,
    access: options.access,
    tags: [options.category],
    ...options.metadata,
  }

  form.append('metadata', JSON.stringify(metadata))

  const response = await dmapiFetch('/api/upload', {
    method: 'POST',
    token: options.token,
    body: form as unknown as BodyInit,
  })

  return response
}
