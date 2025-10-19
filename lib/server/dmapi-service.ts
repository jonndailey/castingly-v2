import type { DmapiFile } from '@/lib/dmapi'

const DMAPI_BASE_URL =
  process.env.DMAPI_BASE_URL ||
  process.env.NEXT_PUBLIC_DMAPI_BASE_URL ||
  'http://localhost:4100'

const DAILEY_CORE_AUTH_URL =
  process.env.DAILEY_CORE_AUTH_URL ||
  process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL ||
  'http://100.105.97.19:3002'

const DMAPI_APP_ID = process.env.DMAPI_APP_ID || 'castingly'
const DMAPI_APP_SLUG = process.env.DMAPI_APP_SLUG || DMAPI_APP_ID

const DMAPI_SERVICE_EMAIL =
  process.env.DMAPI_SERVICE_EMAIL ||
  process.env.DMAPI_MIGRATION_EMAIL ||
  process.env.DAILEY_CORE_ADMIN_EMAIL

const DMAPI_SERVICE_PASSWORD =
  process.env.DMAPI_SERVICE_PASSWORD ||
  process.env.DMAPI_MIGRATION_PASSWORD ||
  process.env.DAILEY_CORE_ADMIN_PASSWORD

// Optional subject scoping for list operations (e.g., 'test-user-id')
const DMAPI_LIST_USER_ID =
  process.env.DMAPI_LIST_USER_ID || process.env.DMAPI_SERVICE_SUBJECT_ID || undefined

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface AuthPayload {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

export interface ServiceListParams {
  limit?: number
  offset?: number
  search?: string
  userId?: string
  category?: string
  bucketId?: string
  visibility?: 'public' | 'private'
  metadata?: Record<string, string | number | boolean | undefined | null>
  includeAppId?: boolean
  useMetadataFilter?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

interface ServiceListResponse {
  success: boolean
  files: DmapiFile[]
  pagination?: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

// Bucket folder listing response (via /api/buckets/:bucketId/files)
interface BucketFolderResponseItem extends DmapiFile {
  user_id?: string
  bucket_id?: string
  folder_path?: string
  path?: string
  is_folder?: boolean
}

interface BucketFolderResponse {
  success: boolean
  files: BucketFolderResponseItem[]
  current_path?: string
  bucket_id?: string
}

interface CachedToken {
  token: string
  refreshToken?: string
  expiresAt: number
}

let cachedToken: CachedToken | null = null
let pendingTokenPromise: Promise<string> | null = null

function ensureBaseUrl(url: string | undefined | null) {
  if (!url) {
    throw new Error('DMAPI service configuration is missing required base URL')
  }
  return url.replace(/\/$/, '')
}

async function authenticateService(): Promise<AuthPayload> {
  if (!DMAPI_SERVICE_EMAIL || !DMAPI_SERVICE_PASSWORD) {
    throw new Error(
      'DMAPI service credentials are not configured. Set DMAPI_SERVICE_EMAIL and DMAPI_SERVICE_PASSWORD.'
    )
  }

  const response = await fetch(
    `${ensureBaseUrl(DAILEY_CORE_AUTH_URL)}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': DMAPI_APP_SLUG,
        'User-Agent': 'Castingly/DMAPI-Service',
      },
      body: JSON.stringify({
        email: DMAPI_SERVICE_EMAIL,
        password: DMAPI_SERVICE_PASSWORD,
        app_slug: DMAPI_APP_SLUG,
      }),
    }
  )

  if (!response.ok) {
    let body: any = null
    try {
      body = await response.json()
    } catch {
      // ignore
    }

    const errorMessage =
      body?.error ||
      body?.message ||
      `Dailey Core authentication failed (${response.status})`

    throw new Error(errorMessage)
  }

  const payload = (await response.json()) as AuthPayload
  if (!payload.access_token) {
    throw new Error('Dailey Core authentication response missing access token')
  }

  return payload
}

async function obtainServiceToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  if (pendingTokenPromise && !forceRefresh) {
    return pendingTokenPromise
  }

  const tokenPromise = (async () => {
    const auth = await authenticateService()
    const expiresIn = Math.max(60, (auth.expires_in ?? 3600) - 60)
    cachedToken = {
      token: auth.access_token,
      refreshToken: auth.refresh_token,
      expiresAt: Date.now() + expiresIn * 1000,
    }
    return auth.access_token
  })()

  pendingTokenPromise = tokenPromise
  try {
    const token = await tokenPromise
    return token
  } finally {
    pendingTokenPromise = null
  }
}

function buildQueryString(params?: ServiceListParams) {
  const searchParams = new URLSearchParams()

  if (!params?.includeAppId) {
    searchParams.set('app_id', DMAPI_APP_ID)
  }

  if (typeof params?.limit === 'number') {
    searchParams.set('limit', params.limit.toString())
  }

  if (typeof params?.offset === 'number') {
    searchParams.set('offset', params.offset.toString())
  }

  if (params?.search) {
    searchParams.set('search', params.search)
  }

  if (params?.userId) {
    searchParams.set('user_id', params.userId)
  }

  if (params?.category) {
    searchParams.set('category', params.category)
  }

  if (params?.bucketId) {
    searchParams.set('bucket_id', params.bucketId)
  }

  if (params?.visibility) {
    searchParams.set('visibility', params.visibility)
  }

  // Map to DMAPI's expected names
  if (params?.sort) {
    searchParams.set('order_by', params.sort)
  }

  if (params?.order) {
    searchParams.set('order_direction', params.order)
  }

  if (params?.metadata) {
    for (const [key, value] of Object.entries(params.metadata)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.length === 0)
      ) {
        continue
      }

      searchParams.append(`metadata[${key}]`, String(value))
    }
  }

  return searchParams.toString()
}

async function serviceFetch<T>(
  path: string,
  options: {
    method?: HttpMethod
    body?: BodyInit | null
    headers?: Record<string, string>
    retryOnAuthFailure?: boolean
  } = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, retryOnAuthFailure = true } =
    options

  const token = await obtainServiceToken()
  const response = await fetch(`${ensureBaseUrl(DMAPI_BASE_URL)}${path}`, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Castingly/DMAPI-Service',
      ...headers,
    },
  })

  if (response.status === 401 && retryOnAuthFailure) {
    await obtainServiceToken(true)
    return serviceFetch(path, { method, body, headers, retryOnAuthFailure: false })
  }

  if (!response.ok) {
    let errorBody: any = null
    try {
      errorBody = await response.json()
    } catch {
      // ignore
    }
    const message =
      errorBody?.error ||
      errorBody?.message ||
      `DMAPI service request failed (${response.status})`
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    return undefined as T
  }
}

export async function listFiles(params: ServiceListParams = {}) {
  const query = buildQueryString(params)
  return serviceFetch<ServiceListResponse>(`/api/files?${query}`)
}

export async function getFile(fileId: string) {
  if (!fileId) {
    throw new Error('File ID is required')
  }
  return serviceFetch<DmapiFile>(`/api/files/${fileId}`)
}

export async function deleteFile(fileId: string) {
  if (!fileId) {
    throw new Error('File ID is required')
  }
  await serviceFetch(`/api/files/${fileId}`, {
    method: 'DELETE',
  })
}

export async function listActorFiles(
  actorId: string | number,
  options: ServiceListParams = {}
) {
  const metadata = {
    ...(options.metadata || {}),
    ...(options.useMetadataFilter === false ? {} : { sourceActorId: actorId }),
  }

  return listFiles({
    ...options,
    ...(DMAPI_LIST_USER_ID ? { userId: DMAPI_LIST_USER_ID } : {}),
    metadata,
  })
}

/**
 * List a bucket folder path for a given user scope.
 */
export async function listBucketFolder(options: {
  bucketId: string
  userId: string
  path: string
  includeAppId?: boolean
}) {
  const searchParams = new URLSearchParams()
  if (!options.includeAppId) {
    searchParams.set('app_id', DMAPI_APP_ID)
  }

  // DMAPI expects the first segment of `path` to be the user id
  const normalizedPath = `${options.userId.replace(/\/+$/, '')}/${String(options.path || '')
    .replace(/^\/+/, '')}`
  searchParams.set('path', normalizedPath)

  return serviceFetch<BucketFolderResponse>(
    `/api/buckets/${encodeURIComponent(options.bucketId)}/files?${searchParams.toString()}`
  )
}

export function clearServiceTokenCache() {
  cachedToken = null
}

export async function uploadFileForActor(options: {
  actorId: string | number
  file: File | Blob
  filename: string
  category: 'headshot' | 'reel' | 'resume' | 'self_tape' | 'voice_over' | 'document' | 'other'
  metadata?: Record<string, unknown>
  bucketId?: string
  folderPath?: string
  access?: 'public' | 'private'
}) {
  const token = await obtainServiceToken()

  // Compute storage location if not provided
  let bucketId = options.bucketId
  let folderPath = options.folderPath
  let access = options.access
  if (!bucketId || !folderPath || !access) {
    // Lazy import to avoid circular deps at module init
    const { resolveStorageLocation } = await import('@/lib/dmapi')
    const loc = resolveStorageLocation(String(options.actorId), options.category)
    bucketId = loc.bucketId
    folderPath = loc.folderPath
    access = loc.access
  }

  const form = new FormData()
  form.append('file', options.file, options.filename)
  form.append('bucket_id', String(bucketId))
  form.append('folder_path', String(folderPath))
  form.append('app_id', DMAPI_APP_ID)

  const metadata = {
    category: options.category,
    tags: [options.category],
    bucketAccess: access,
    access,
    source: 'castingly',
    sourceActorId: String(options.actorId),
    ...options.metadata,
  }
  form.append('metadata', JSON.stringify(metadata))

  const response = await fetch(`${ensureBaseUrl(DMAPI_BASE_URL)}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Castingly/DMAPI-Service',
    },
    body: form as unknown as BodyInit,
  })

  if (!response.ok) {
    let errorBody: any = null
    try {
      errorBody = await response.json()
    } catch {}
    const message = errorBody?.error || errorBody?.message || 'DMAPI upload failed'
    throw new Error(message)
  }

  try {
    return await response.json()
  } catch {
    return { success: true }
  }
}
