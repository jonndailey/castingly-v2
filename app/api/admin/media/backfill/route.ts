import { NextRequest, NextResponse } from 'next/server'
import { listFiles as serviceListFiles, updateFileMetadata, listBucketFolder as serviceListBucketFolder, findFileByStorageKey } from '@/lib/server/dmapi-service'

function inferCategoryFromPath(path?: string | null, name?: string | null): string | null {
  const p = String(path || '').toLowerCase()
  const n = String(name || '').toLowerCase()
  if (!p && !n) return null
  if (p.includes('/headshot') || n.includes('headshot')) return 'headshot'
  if (p.includes('/gallery')) return 'gallery'
  if (p.includes('/resume') || /\.(pdf|docx?)$/i.test(n)) return 'resume'
  if (p.includes('/reel') || /\.(mp4|mov|m4v|mpeg|mpg)$/i.test(n)) return 'reel'
  if (p.includes('self-tape') || p.includes('self_tape')) return 'self_tape'
  if (p.includes('voice') || /\.(mp3|wav|aac)$/i.test(n)) return 'voice_over'
  if (p.includes('/document')) return 'document'
  if (/\.(jpe?g|png|webp|gif)$/i.test(n)) return 'gallery'
  return null
}

function extractUserIdFromPath(path?: string | null): string | null {
  const p = String(path || '').trim()
  if (!p) return null
  // Expect: actors/<actorId>/...
  const idx = p.toLowerCase().indexOf('actors/')
  if (idx >= 0) {
    const rest = p.slice(idx + 'actors/'.length)
    const parts = rest.split('/')
    if (parts[0]) return parts[0]
  }
  return null
}

import { daileyCoreAuth } from '@/lib/auth/dailey-core'

export async function POST(request: NextRequest) {
  try {
    // Admin guard: require header X-Admin-Secret that matches env ADMIN_API_SECRET
    const secretHeader = request.headers.get('x-admin-secret')
    const secretEnv = process.env.ADMIN_API_SECRET
    let authorized = false
    if (secretEnv && secretHeader === secretEnv) {
      authorized = true
    } else {
      // Fallback: allow Core admin tokens or the configured DMAPI service account
      const dmapiKeyHeader = request.headers.get('x-dmapi-key') || request.headers.get('x-api-key')
      if (dmapiKeyHeader && dmapiKeyHeader.startsWith('dmapi_')) {
        authorized = true
      }
      const authz = request.headers.get('authorization')
      if (!authorized && authz?.startsWith('Bearer ')) {
        try {
          const token = authz.slice('Bearer '.length)
          // Accept DMAPI API keys for this admin-only route as a convenience.
          // If the token is a DMAPI API key, treat as authorized and skip Core validation.
          if (token.startsWith('dmapi_')) {
            authorized = true
          } else {
            const v = await daileyCoreAuth.validateToken(token)
            const roles = (v?.roles || []).map((r) => String(r).toLowerCase())
            const isAdmin = roles.includes('admin') || roles.includes('tenant.admin') || roles.includes('core.admin')
            const isService = v?.user?.email && process.env.DMAPI_SERVICE_EMAIL && String(v.user.email).toLowerCase() === String(process.env.DMAPI_SERVICE_EMAIL).toLowerCase()
            authorized = Boolean(v?.valid && (isAdmin || isService))
          }
        } catch {}
      }
    }
    if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const dryRun = (searchParams.get('dry') || '0') === '1'
    const onlyCategory = (searchParams.get('category') || '').toLowerCase() || ''
    const maxStr = searchParams.get('max')
    const maxToProcess = maxStr ? Math.max(1, Math.min(1000, parseInt(maxStr, 10) || 0)) : 0

    let offset = 0
    const limit = 250
    let total = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    const errorSamples: string[] = []
    const dmapiKey = request.headers.get('x-dmapi-key') || request.headers.get('x-api-key') || ''
    const DMAPI_BASE = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
    const DMAPI_APP = process.env.DMAPI_APP_SLUG || process.env.DMAPI_APP_ID || 'castingly-portal'
    const CORE_BASE = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || '').replace(/\/$/, '')
    const SERVICE_EMAIL = process.env.DMAPI_SERVICE_EMAIL
    const SERVICE_PASSWORD = process.env.DMAPI_SERVICE_PASSWORD

    async function obtainServiceTokenForApp(appSlug: string) {
      if (!CORE_BASE || !SERVICE_EMAIL || !SERVICE_PASSWORD) throw new Error('Service credentials missing')
      const res = await fetch(`${CORE_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': appSlug, 'User-Agent': 'Castingly/Backfill' },
        body: JSON.stringify({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD, app_slug: appSlug })
      })
      if (!res.ok) throw new Error(`Core login failed (${res.status})`)
      const j = await res.json().catch(() => null)
      const token = j?.access_token
      if (!token) throw new Error('Missing access_token from Core')
      return token as string
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    async function attemptPatch(fileId: string, patch: Record<string, any>) {
      const maxAttempts = 12
      let delay = 1000
      let triedLegacy = false
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // First try with current app credentials via service helper
          await updateFileMetadata(String(fileId), patch)
          return true
        } catch (e: any) {
          const msg = String(e?.message || e || '')
          const isRate = /rate limit|too many|429/i.test(msg)
          const isNotFound = /not found|endpoint not found|404/i.test(msg)

          // If endpoint not found under current app, try legacy app slug 'castingly' (files likely created under that app)
          if (!triedLegacy && isNotFound && DMAPI_BASE) {
            triedLegacy = true
            try {
              const legacyApp = 'castingly'
              let res: Response | null = null
              // Prefer API key if provided (tenant-level); include app_id=castingly to target the legacy app
              if (dmapiKey && dmapiKey.startsWith('dmapi_')) {
                res = await fetch(`${DMAPI_BASE}/api/files/${encodeURIComponent(String(fileId))}?app_id=${legacyApp}`, {
                  method: 'PATCH',
                  headers: { 'X-API-Key': dmapiKey as string, 'X-Client-Id': legacyApp, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ metadata: patch }),
                })
              } else {
                const legacyToken = await obtainServiceTokenForApp(legacyApp)
                res = await fetch(`${DMAPI_BASE}/api/files/${encodeURIComponent(String(fileId))}`, {
                  method: 'PATCH',
                  headers: { Authorization: `Bearer ${legacyToken}`, 'X-Client-Id': legacyApp, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ metadata: patch }),
                })
              }
              if (res && res.ok) return true
              const body = res ? await res.json().catch(() => null) : null
              const message = String(body?.error || body?.message || (res ? `${res.status}` : 'unknown'))
              if (/rate limit|too many|429/i.test(message) && attempt < maxAttempts) {
                await sleep(delay)
                delay *= 1.8
                continue
              }
              throw new Error(message)
            } catch (legacyErr: any) {
              const lmsg = String(legacyErr?.message || legacyErr || '')
              const lrate = /rate limit|too many|429/i.test(lmsg)
              if (lrate && attempt < maxAttempts) {
                await sleep(delay)
                delay *= 1.8
                continue
              }
              throw legacyErr
            }
          }
          // Backoff and retry on rate limits; otherwise fail fast
          if (isRate && attempt < maxAttempts) {
            await sleep(delay)
            delay *= 1.8
            continue
          }
          throw e
        }
      }
      return false
    }

    function looksLikeDbId(value: any) {
      const s = String(value || '')
      return s.length >= 18 && s.length <= 30 && !s.includes('/') && !s.includes('.')
    }

    async function resolveDbId(f: any): Promise<string | null> {
      const cid = String(f?.id || '')
      if (looksLikeDbId(cid)) return cid
      const sk = String((f as any)?.storage_key || '')
      if (sk) {
        try {
          const found = await findFileByStorageKey(sk, { includeAppId: true }) as any
          if (found?.id) return String(found.id)
        } catch {}
      }
      // Attempt to synthesize storage key if missing
      const bucketId = String((f as any)?.bucket_id || (f?.metadata?.bucketId) || '')
      const user = String((f as any)?.user_id || userId || '')
      const folderPath = String((f as any)?.folder_path || (f?.metadata?.folderPath) || '')
      const name = String((f as any)?.name || (f as any)?.original_filename || '')
      if (bucketId && user && folderPath && name) {
        const candidate = `files/${user}/${bucketId}/${folderPath.replace(/^\/+|\/+$/g,'')}/${name}`
        try {
          const found = await findFileByStorageKey(candidate, { includeAppId: true }) as any
          if (found?.id) return String(found.id)
        } catch {}
      }
      return null
    }

    async function processFile(f: any, fallbackCat?: string | null) {
      try {
        const meta = (f?.metadata || {}) as Record<string, any>
        const folderPath = String(meta.folderPath || f.folder_path || f.path || '').toLowerCase()
        const name = String(f.original_filename || f.name || '')
        const currentCategory = String(meta.category || '').toLowerCase()
        const currentSource = meta.sourceActorId || meta.source_actor_id || null
        const inferredCategory = inferCategoryFromPath(folderPath, name) || fallbackCat || null
        if (onlyCategory && inferredCategory && inferredCategory !== onlyCategory) {
          // Skip not-matching category when a filter is set
          return
        }
        const inferredUser = extractUserIdFromPath(folderPath) || String(f?.user_id || '') || userId || null
        const patch: Record<string, any> = { ...meta }
        if (inferredCategory && currentCategory !== inferredCategory) patch.category = inferredCategory
        if (inferredUser && String(currentSource || '') !== String(inferredUser)) patch.sourceActorId = String(inferredUser)
        const changed = (patch.category && patch.category !== currentCategory) ||
                        (patch.sourceActorId && String(patch.sourceActorId) !== String(currentSource || ''))
        total++
        if (!changed) { skipped++; return }
        if (!dryRun) {
          // Resolve DB id if available; otherwise fall back to storage_key-based patch (DMAPI route)
          let dbId = looksLikeDbId(f?.id) ? String(f.id) : await resolveDbId(f)
          if (dbId) {
            await attemptPatch(dbId, patch)
          } else {
            const sk = String((f as any)?.storage_key || '')
            if (!sk) throw new Error('Missing DB id for file')
            const DMAPI_BASE = (process.env.DMAPI_BASE_URL || process.env.NEXT_PUBLIC_DMAPI_BASE_URL || '').replace(/\/$/, '')
            const appSlug = process.env.DMAPI_APP_SLUG || process.env.DMAPI_APP_ID || 'castingly'
            const token = await obtainServiceTokenForApp(appSlug)
            const res = await fetch(`${DMAPI_BASE}/api/files/by-storage-key`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${token}`,
                'X-Client-Id': appSlug,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ storage_key: sk, metadata: patch, categories: patch?.category ? [patch.category] : undefined }),
            })
            if (!res.ok) {
              const b = await res.json().catch(() => null)
              throw new Error(String(b?.error || b?.message || res.status))
            }
          }
          await sleep(120)
        }
        updated++
      } catch (e: any) {
        errors++
        if (errorSamples.length < 5) {
          try { errorSamples.push(String(e?.message || e)) } catch {}
        }
      }
    }

    // If a specific user is requested, crawl bucket folders for that user to find legacy imports without metadata
    if (userId) {
      const buckets = ['castingly-public', 'castingly-private']
      const subpaths = [
        'actors/<id>/headshots',
        'actors/<id>/gallery',
        'actors/<id>/reels',
        'actors/<id>/resumes',
        'actors/<id>/self-tapes',
        'actors/<id>/voice-over',
        'actors/<id>/documents'
      ]
      outer: for (const b of buckets) {
        for (const raw of subpaths) {
          const sub = raw.replace('<id>', userId)
          const catHint = inferCategoryFromPath(sub, '')
          try {
            const resp = await serviceListBucketFolder({ bucketId: b, userId: String(userId), path: sub, includeAppId: true }) as any
            const files = Array.isArray(resp?.files) ? resp.files : []
            for (const f of files) {
              await processFile(f, catHint)
              if (maxToProcess && (updated + skipped) >= maxToProcess) break outer
            }
          } catch {
            // ignore
          }
        }
      }
    } else {
      // Iterate by metadata listing when processing all users
      while (true) {
        const resp = await serviceListFiles({ limit, offset, includeAppId: true }) as any
        const files = Array.isArray(resp?.files) ? resp.files : []
        if (files.length === 0) break
        for (const f of files) await processFile(f, null)
        if (!resp?.pagination?.has_more) break
        offset += limit
      }
    }

    return NextResponse.json({ ok: true, total, updated, skipped, errors, scope: userId ? { userId } : 'all', errorSamples })
  } catch (e: any) {
    try { console.error('[admin/media/backfill] error:', e?.message || e) } catch {}
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
  }
}
