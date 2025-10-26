#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

const envPath = process.env.MIGRATION_ENV || (fs.existsSync('.env.local') ? '.env.local' : (fs.existsSync('.env') ? '.env' : null))
if (envPath) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

function log(msg) { process.stdout.write(msg + '\n') }

async function file(sqlPath) {
  const p = path.resolve(sqlPath)
  return fs.readFileSync(p, 'utf8')
}

async function ensureConnectedDatabase() {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  }
  for (const k of ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME']) {
    if (!process.env[k]) throw new Error(`Missing ${k} in environment (${envPath || 'process env'})`)
  }
  const conn = await mysql.createConnection(config)
  return conn
}

async function tableExists(conn, table) {
  const [rows] = await conn.execute('SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = ? AND table_name = ?', [process.env.DB_NAME, table])
  return rows[0]?.c > 0
}

async function run() {
  log(`Using env: ${envPath || 'process'} (DB_HOST=${process.env.DB_HOST}:${process.env.DB_PORT}, DB_NAME=${process.env.DB_NAME})`)
  const conn = await ensureConnectedDatabase()
  try {
    const hasAgencies = await tableExists(conn, 'agencies')
    if (!hasAgencies) {
      log('Applying schema: 20251026_inside_connect.sql')
      const sql = await file('database/migrations/20251026_inside_connect.sql')
      await conn.query(sql)
    } else {
      log('Schema already present (agencies exists); skipping base migration')
    }

    // Apply index fixes idempotently
    log('Ensuring indexes present')
    await conn.query('ALTER TABLE agencies ADD INDEX idx_agencies_accepting (accepting_new_talent)')
      .catch(() => {})
    await conn.query('ALTER TABLE connect_submissions ADD INDEX idx_submissions_actor_status (actor_id, status)')
      .catch(() => {})

    log('Inside Connect migration complete')
  } finally {
    await conn.end()
  }
}

run().catch((e) => { console.error('Migration failed:', e?.message || e); process.exit(1) })

