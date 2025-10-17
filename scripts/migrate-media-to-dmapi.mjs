#!/usr/bin/env node

/**
 * Castingly → DMAPI migration utility.
 *
 * Reads legacy `actor_media` records and uploads the underlying files into the
 * Dailey Media API (DMAPI), persisting rich metadata so Castingly v2 can rely
 * exclusively on DMAPI for actor assets.
 *
 * The script is idempotent: previously migrated media (identified via
 * `metadata.sourceMediaId`) will be skipped unless `--force` is passed.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import process from 'node:process'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(repoRoot, '.env.local') })

// -----------------------------------------------------------------------------
// Configuration helpers
// -----------------------------------------------------------------------------

const DMAPI_BASE_URL =
  process.env.DMAPI_BASE_URL ||
  process.env.NEXT_PUBLIC_DMAPI_BASE_URL ||
  'http://127.0.0.1:4100'

const DAILEY_CORE_AUTH_URL =
  process.env.DAILEY_CORE_AUTH_URL ||
  process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL ||
  'http://100.105.97.19:3002'

const DMAPI_APP_ID = process.env.DMAPI_APP_ID || 'castingly'
const DMAPI_APP_SLUG = process.env.DMAPI_APP_SLUG || DMAPI_APP_ID

const SERVICE_EMAIL =
  process.env.DMAPI_SERVICE_EMAIL ||
  process.env.DMAPI_MIGRATION_EMAIL ||
  process.env.DAILEY_CORE_ADMIN_EMAIL

const SERVICE_PASSWORD =
  process.env.DMAPI_SERVICE_PASSWORD ||
  process.env.DMAPI_MIGRATION_PASSWORD ||
  process.env.DAILEY_CORE_ADMIN_PASSWORD

const LEGACY_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'casting_portal',
  user: process.env.DB_USER || 'nikon',
  password: process.env.DB_PASSWORD || '@0509man1hattaN',
}

const DMAPI_DB_CONFIG = {
  ...LEGACY_DB_CONFIG,
  database: process.env.DMAPI_DATABASE || 'dailey_media',
}

const AUTH_DB_CONFIG = {
  ...LEGACY_DB_CONFIG,
  database: process.env.DAILEY_CORE_AUTH_DATABASE || 'dailey_core_auth',
}

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const LIMIT = parseInt(getFlagValue('--limit') || '0', 10) || undefined
const START_AT = getFlagValue('--start-at')

const UPLOAD_DELAY_MS = Number(process.env.DMAPI_MIGRATION_DELAY_MS || 150)
const RATE_LIMIT_WAIT_MS = Number(process.env.DMAPI_RATE_LIMIT_WAIT_MS || 5000)
const RATE_LIMIT_RETRIES = Number(process.env.DMAPI_RATE_LIMIT_RETRIES || 5)

function getFlagValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index >= 0 && index < process.argv.length - 1) {
    return process.argv[index + 1]
  }
  return undefined
}

function sanitizeEmail(value) {
  if (!value) return ''
  return String(value).trim().toLowerCase()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// -----------------------------------------------------------------------------
// DMAPI helpers
// -----------------------------------------------------------------------------

function resolveStorageLocation(userId, category) {
  const base = `actors/${userId}`

  switch (category) {
    case 'headshot':
      return { bucketId: 'castingly-public', folderPath: `${base}/headshots`, access: 'public' }
    case 'reel':
      return { bucketId: 'castingly-public', folderPath: `${base}/reels`, access: 'public' }
    case 'voice_over':
      return { bucketId: 'castingly-public', folderPath: `${base}/voice-over`, access: 'public' }
    case 'resume':
      return { bucketId: 'castingly-private', folderPath: `${base}/resumes`, access: 'private' }
    case 'self_tape':
      return { bucketId: 'castingly-private', folderPath: `${base}/self-tapes`, access: 'private' }
    case 'document':
      return { bucketId: 'castingly-private', folderPath: `${base}/documents`, access: 'private' }
    default:
      return { bucketId: 'castingly-private', folderPath: `${base}/misc`, access: 'private' }
  }
}

function mapCategory(record, mimeType) {
  if (record.media_type === 'resume' || mimeType === 'application/pdf') return 'resume'
  if (mimeType.startsWith('image/')) return 'headshot'
  if (mimeType.startsWith('video/')) return 'reel'
  if (mimeType.startsWith('audio/')) return 'voice_over'
  return 'other'
}

function detectMime(filename) {
  const ext = path.extname(filename).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.mp4':
      return 'video/mp4'
    case '.mov':
      return 'video/quicktime'
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.pdf':
      return 'application/pdf'
    case '.doc':
      return 'application/msword'
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default:
      return 'application/octet-stream'
  }
}

async function dmapiFetch(pathname, { method = 'GET', token, body, headers = {} }) {
  const url = `${DMAPI_BASE_URL.replace(/\/$/, '')}${pathname}`
  const response = await fetch(url, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'CastinglyMigration/1.0',
      ...headers,
    },
  })

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      // ignore
    }
    const message =
      payload?.error ||
      payload?.message ||
      `DMAPI request failed (${response.status})`
    throw new Error(message)
  }

  if (response.status === 204) return null

  try {
    return await response.json()
  } catch {
    return null
  }
}

// -----------------------------------------------------------------------------
// Data loading
// -----------------------------------------------------------------------------

async function loadActorMedia(connection) {
  const clauses = []
  const params = []

  if (START_AT) {
    clauses.push('am.id >= ?')
    params.push(Number(START_AT))
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const limitClause = LIMIT ? `LIMIT ${LIMIT}` : ''

  const [rows] = await connection.execute(
    `
    SELECT
      am.id AS media_id,
      am.actor_id,
      am.media_type,
      am.media_url,
      am.is_primary,
      TRIM(BOTH '\\n' FROM u.first_name) AS first_name,
      TRIM(BOTH '\\n' FROM u.last_name) AS last_name,
      TRIM(BOTH '\\r\\n' FROM u.email) AS email
    FROM actor_media am
    JOIN users u ON am.actor_id = u.id
    ${where}
    ORDER BY am.id ASC
    ${limitClause}
    `,
    params
  )

  return rows.map((row) => ({
    mediaId: row.media_id,
    actorId: row.actor_id,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    isPrimary: Boolean(row.is_primary),
    firstName: row.first_name,
    lastName: row.last_name,
    email: sanitizeEmail(row.email),
  }))
}

async function loadDaileyCoreUsers(connection) {
  const [rows] = await connection.execute(
    `
    SELECT id, LOWER(TRIM(BOTH '\\r\\n' FROM email)) AS email
    FROM users
    `
  )

  const map = new Map()
  for (const row of rows) {
    if (!row.email) continue
    map.set(row.email, row.id)
  }
  return map
}

async function loadExistingDmapiSourceIds(connection) {
  const [rows] = await connection.execute(
    `
    SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.sourceMediaId')) AS source_id
    FROM media_files
    WHERE application_id = ?
    `,
    [DMAPI_APP_ID]
  )

  const ids = new Set()
  for (const row of rows) {
    if (row.source_id) ids.add(String(row.source_id))
  }
  return ids
}

async function ensureDmapiApplicationRecord(connection) {
  const [rows] = await connection.execute(
    `
    SELECT id FROM applications WHERE id = ? OR slug = ? LIMIT 1
    `,
    [DMAPI_APP_ID, DMAPI_APP_SLUG]
  )

  if (rows.length > 0) return

  const settings = {
    buckets: ['castingly-public', 'castingly-private'],
    source: 'castingly-v2-migration',
  }

  await connection.execute(
    `
    INSERT INTO applications (id, name, slug, description, owner_user_id, settings)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      description = VALUES(description),
      owner_user_id = VALUES(owner_user_id),
      settings = VALUES(settings),
      updated_at = CURRENT_TIMESTAMP
    `,
    [
      DMAPI_APP_ID,
      'Castingly',
      DMAPI_APP_SLUG,
      'Castingly v2 media storage',
      'system',
      JSON.stringify(settings),
    ]
  )
}

const ensuredDmapiUsers = new Set()

async function ensureDmapiUserRecord(connection, daileyUserId, record) {
  if (!daileyUserId || ensuredDmapiUsers.has(daileyUserId)) return

  const [existing] = await connection.execute(
    `
    SELECT id FROM users WHERE external_id = ? LIMIT 1
    `,
    [daileyUserId]
  )

  if (existing.length === 0) {
    const displayName =
      `${record.firstName || ''} ${record.lastName || ''}`.trim() ||
      record.email ||
      daileyUserId

    const metadata = {
      source: 'castingly-v2-migration',
      legacyActorId: record.actorId,
      email: record.email || null,
    }

    await connection.execute(
      `
      INSERT INTO users (id, external_id, email, display_name, metadata)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        display_name = VALUES(display_name),
        metadata = VALUES(metadata),
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        daileyUserId,
        daileyUserId,
        record.email || null,
        displayName,
        JSON.stringify(metadata),
      ]
    )
  }

  ensuredDmapiUsers.add(daileyUserId)
}

// -----------------------------------------------------------------------------
// Authentication
// -----------------------------------------------------------------------------

async function acquireServiceToken() {
  if (!SERVICE_EMAIL || !SERVICE_PASSWORD) {
    throw new Error(
      'DMAPI service credentials missing. Set DMAPI_SERVICE_EMAIL and DMAPI_SERVICE_PASSWORD.'
    )
  }

  const response = await fetch(
    `${DAILEY_CORE_AUTH_URL.replace(/\/$/, '')}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': DMAPI_APP_SLUG,
        'User-Agent': 'CastinglyMigration/1.0',
      },
      body: JSON.stringify({
        email: SERVICE_EMAIL,
        password: SERVICE_PASSWORD,
        app_slug: DMAPI_APP_SLUG,
      }),
    }
  )

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      // ignore
    }
    const message =
      payload?.error ||
      payload?.message ||
      `Dailey Core authentication failed (${response.status})`
    throw new Error(message)
  }

  const payload = await response.json()
  return payload.access_token
}

// -----------------------------------------------------------------------------
// Upload logic
// -----------------------------------------------------------------------------

async function uploadFile({ token, record, daileyUserId, skipIds }) {
  if (!record.mediaUrl) {
    return { status: 'skipped', reason: 'missing-media-url' }
  }

  const relativePath = record.mediaUrl.replace(/^\//, '')
  const absolutePath = path.join(repoRoot, relativePath)
  const filename = path.basename(relativePath)

  let fileBuffer
  try {
    fileBuffer = await fs.readFile(absolutePath)
  } catch (error) {
    return {
      status: 'skipped',
      reason: 'file-not-found',
      details: absolutePath,
    }
  }

  if (!FORCE && skipIds.has(String(record.mediaId))) {
    return { status: 'skipped', reason: 'already-migrated' }
  }

  const mimeType = detectMime(filename)
  const category = mapCategory(record, mimeType)
  const { bucketId, folderPath, access } = resolveStorageLocation(
    daileyUserId,
    category
  )

  if (DRY_RUN) {
    return {
      status: 'dry-run',
      details: {
        filename,
        bucketId,
        folderPath,
        category,
        actorId: record.actorId,
        daileyUserId,
      },
    }
  }

  const blob = new Blob([fileBuffer], { type: mimeType })
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('bucket_id', bucketId)
  form.append('folder_path', folderPath)
  form.append('user_id', daileyUserId)
  form.append('app_id', DMAPI_APP_ID)

  const metadata = {
    category,
    tags: [category, 'casting', 'migration'],
    access,
    bucketId,
    folderPath,
    source: 'castingly-v2-migration',
    sourceMediaId: record.mediaId,
    sourceMediaType: record.mediaType,
    sourceActorId: record.actorId,
    originalPath: record.mediaUrl,
    isPrimary: record.isPrimary,
    migratedAt: new Date().toISOString(),
    actor: {
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      daileyCoreUserId: daileyUserId,
    },
  }

  form.append('metadata', JSON.stringify(metadata))
  form.append(
    'title',
    `${record.firstName || ''} ${record.lastName || ''}`.trim() || filename
  )
  form.append('category', category)
  form.append('is_public', access === 'public' ? 'true' : 'false')

  let payload
  try {
    payload = await dmapiFetch('/api/upload', {
      method: 'POST',
      token,
      body: form,
    })
  } catch (error) {
    if (error instanceof Error && /Duplicate entry/i.test(error.message)) {
      skipIds.add(String(record.mediaId))
      return {
        status: 'skipped',
        reason: 'duplicate-content-hash',
      }
    }
    throw error
  }

  skipIds.add(String(record.mediaId))
  return { status: 'uploaded', details: payload, category }
}

async function findMediaIdByStorageKey(connection, key) {
  if (!key) return null
  const [rows] = await connection.execute(
    `
    SELECT id FROM media_files
    WHERE storage_key = ?
    LIMIT 1
    `,
    [key]
  )
  return rows[0]?.id || null
}

async function enrichFileMetadata(connection, { fileId, record, category, daileyUserId }) {
  if (!fileId) return

  const [rows] = await connection.execute(
    `
    SELECT metadata, categories FROM media_files WHERE id = ? LIMIT 1
    `,
    [fileId]
  )

  if (rows.length === 0) return

  const existingMetadata = safeJson(rows[0].metadata, {})
  const existingCategories = safeJson(rows[0].categories, [])

  const updatedMetadata = {
    ...existingMetadata,
    sourceMediaId: record.mediaId,
    sourceMediaType: record.mediaType,
    sourceActorId: record.actorId,
    migrationSource: 'castingly-v2-migration',
    migratedAt: new Date().toISOString(),
    actor: {
      ...(existingMetadata.actor || {}),
      email: record.email || existingMetadata.actor?.email || null,
      firstName: record.firstName || existingMetadata.actor?.firstName || null,
      lastName: record.lastName || existingMetadata.actor?.lastName || null,
      daileyCoreUserId: daileyUserId,
    },
  }

  const categories = Array.isArray(existingCategories)
    ? Array.from(new Set([...existingCategories, category]))
    : [category]

  await connection.execute(
    `
    UPDATE media_files
    SET metadata = ?, categories = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [JSON.stringify(updatedMetadata), JSON.stringify(categories), fileId]
  )
}

function safeJson(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// -----------------------------------------------------------------------------
// Execution
// -----------------------------------------------------------------------------

async function run() {
  console.log('🚀 Castingly → DMAPI migration starting…')
  console.log(`DMAPI base URL: ${DMAPI_BASE_URL}`)
  console.log(`Dailey Core auth URL: ${DAILEY_CORE_AUTH_URL}`)
  console.log(`Mode: ${DRY_RUN ? 'Dry Run' : 'Live Uploads'}${FORCE ? ' (force)' : ''}`)

  const legacyPool = await mysql.createPool(LEGACY_DB_CONFIG)
  const dmapiPool = await mysql.createPool(DMAPI_DB_CONFIG)
  const authPool = await mysql.createPool(AUTH_DB_CONFIG)

  try {
    const [mediaRecords, daileyUsers, existingSourceIds] = await Promise.all([
      loadActorMedia(legacyPool),
      loadDaileyCoreUsers(authPool),
      (async () => {
        await ensureDmapiApplicationRecord(dmapiPool)
        return loadExistingDmapiSourceIds(dmapiPool)
      })(),
    ])

    console.log(`📦 Found ${mediaRecords.length} legacy media records`)
    console.log(`👤 Loaded ${daileyUsers.size} Dailey Core users`)
    console.log(`🧾 DMAPI already tracks ${existingSourceIds.size} media items`)

    if (mediaRecords.length === 0) {
      console.log('Nothing to migrate. Exiting.')
      return
    }

    const token = await acquireServiceToken()

    let processed = 0
    let uploaded = 0
    let skipped = 0
    let failed = 0

    for (const record of mediaRecords) {
      processed += 1

      if (!record.email) {
        console.warn(`⚠️  [${record.mediaId}] Missing email for actor ${record.actorId}; skipping`)
        skipped += 1
        continue
      }

      const daileyUserId = daileyUsers.get(record.email)
      if (!daileyUserId) {
        console.warn(`⚠️  [${record.mediaId}] No Dailey Core account for ${record.email}; skipping`)
        skipped += 1
        continue
      }

      try {
        await ensureDmapiUserRecord(dmapiPool, daileyUserId, record)
      } catch (error) {
        failed += 1
        console.error(
          `❌ Failed to ensure DMAPI user ${daileyUserId} for ${record.email}: ${error.message}`
        )
        continue
      }

      try {
        let attempt = 0
        let result = null

        while (attempt < RATE_LIMIT_RETRIES) {
          try {
            result = await uploadFile({
              token,
              record,
              daileyUserId,
              skipIds: existingSourceIds,
            })
            break
          } catch (error) {
            const isRateLimit =
              error instanceof Error && /rate limit exceeded/i.test(error.message)

            if (isRateLimit && attempt < RATE_LIMIT_RETRIES - 1) {
              attempt += 1
              const waitMs = RATE_LIMIT_WAIT_MS * attempt
              console.warn(
                `⏳ Rate limit hit for media ${record.mediaId}. Retrying in ${waitMs}ms (attempt ${attempt}/${RATE_LIMIT_RETRIES})`
              )
              await sleep(waitMs)
              continue
            }

            throw error
          }
        }

        if (!result) {
          throw new Error('Rate limit retries exhausted')
        }

        if (result.status === 'uploaded') {
          uploaded += 1
          console.log(
            `✅ Uploaded media ${record.mediaId} (${record.mediaType}) for ${record.email}`
          )

          let mediaFileId = result.details?.mediaId || null
          const storageKey = result.details?.file?.original?.key

          if (!mediaFileId && storageKey) {
            mediaFileId = await findMediaIdByStorageKey(dmapiPool, storageKey)
          }

          if (mediaFileId) {
            await enrichFileMetadata(dmapiPool, {
              fileId: mediaFileId,
              record,
              category: result.category,
              daileyUserId,
            })
          }
        } else if (result.status === 'dry-run') {
          skipped += 1
          console.log(
            `📝 DRY-RUN would upload ${record.mediaId} (${record.mediaType}) for ${record.email}`
          )
        } else if (result.status === 'skipped') {
          skipped += 1
          console.log(
            `⏭️  Skipped media ${record.mediaId} (${record.mediaType}) for ${record.email}: ${result.reason}`
          )
        } else {
          failed += 1
          console.error(
            `❌ Failed to upload media ${record.mediaId} (${record.mediaType}) for ${record.email}: ${result?.details?.error || result.reason}`
          )
        }
      } catch (error) {
        failed += 1
        console.error(
          `❌ Unexpected error uploading media ${record.mediaId} (${record.mediaType}) for ${record.email}:`,
          error
        )
      }

      if (UPLOAD_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, UPLOAD_DELAY_MS))
      }
    }

    console.log('\n=== Migration Summary ===')
    console.log(`Processed: ${processed}`)
    console.log(`Uploaded : ${uploaded}`)
    console.log(`Skipped  : ${skipped}`)
    console.log(`Failed   : ${failed}`)
  } finally {
    await Promise.all([legacyPool.end(), dmapiPool.end(), authPool.end()])
  }
}

run().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
