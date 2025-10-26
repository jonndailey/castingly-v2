#!/usr/bin/env node
/**
 * Backfill users.avatar_url by calling the app's avatar endpoint.
 * This triggers the server-side fallback that locates a DMAPI headshot
 * and persists a short proxy URL.
 *
 * Usage:
 *   MIGRATION_ENV=.env.production node scripts/backfill-avatars-via-app.mjs [--force] [--id <userId>] [--host http://127.0.0.1:3003]
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const idIdx = args.indexOf('--id')
const ONLY_ID = idIdx >= 0 ? String(args[idIdx + 1] || '') : ''
const hostIdx = args.indexOf('--host')
const HOST = hostIdx >= 0 ? String(args[hostIdx + 1] || '') : (process.env.APP_INTERNAL_URL || 'http://127.0.0.1:3003')

if (process.env.MIGRATION_ENV) {
  const { config } = await import('dotenv')
  config({ path: process.env.MIGRATION_ENV })
}

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'castingly'

async function main() {
  console.log(`Backfilling avatars via app at ${HOST} …`)
  const pool = await mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  })
  const where = ONLY_ID ? 'u.id = ?' : FORCE ? "u.role='actor'" : "u.role='actor' AND (u.avatar_url IS NULL OR u.avatar_url='' OR u.avatar_url LIKE 'https://ui-avatars.com/%' OR u.avatar_url LIKE '/api/media/avatar%')"
  const params = ONLY_ID ? [ONLY_ID] : []
  const [rows] = await pool.execute(
    `SELECT u.id FROM users u WHERE ${where} ORDER BY u.id ASC`,
    params
  )
  const users = rows || []
  console.log(`Hitting avatar route for ${users.length} actor(s)…`)
  let ok = 0
  for (const row of users) {
    const uid = String(row.id)
    try {
      const resp = await fetch(`${HOST}/api/media/avatar/${encodeURIComponent(uid)}`, {
        // We don't need the redirect target; trigger side-effect only
        redirect: 'manual',
      })
      if (resp.status === 302 || resp.status === 200) ok++
      // short delay to avoid bursts
      await new Promise((r) => setTimeout(r, 50))
    } catch (e) {
      console.warn(`Request failed for id=${uid}:`, e?.message || e)
    }
  }
  await pool.end()
  console.log(`Done. Touched ${ok} actor(s).` )
}

main().catch((e) => {
  console.error('Backfill via app failed:', e)
  process.exit(1)
})

