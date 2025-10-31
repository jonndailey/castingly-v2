#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import mysql from 'mysql2/promise'

function loadEnvFile(file) {
  try {
    if (!file || !fs.existsSync(file)) return
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/)
      if (m) {
        const key = m[1]
        let val = m[2]
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (process.env[key] === undefined) process.env[key] = val
      }
    }
  } catch {}
}

const MIGRATION_ENV = process.env.MIGRATION_ENV
if (MIGRATION_ENV) loadEnvFile(MIGRATION_ENV)

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT || 3306)
const DB_NAME = process.env.DB_NAME || 'casting_portal'
const DB_USER = process.env.DB_USER || 'nikon'
const DB_PASSWORD = process.env.DB_PASSWORD || ''

async function ensureActor(conn, { id, email, name }) {
  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME AS name FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME='users'`,
    [DB_NAME]
  )
  const names = new Set((cols||[]).map(r=>r.name))
  const now = new Date()
  const [exists] = await conn.execute('SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1',[id,email])
  if(Array.isArray(exists) && exists.length>0) return
  if (names.has('name')){
    await conn.execute(
      `INSERT INTO users (id,email,password_hash,name,role,is_active,email_verified,created_at,updated_at)
       VALUES (?,?,?,?, 'actor',1,1,?,?)`,
      [id,email,'core-linked',name || email.split('@')[0],now,now]
    )
  } else {
    const [first,...rest] = String(name||'').trim().split(/\s+/)
    const last = rest.join(' ')
    await conn.execute(
      `INSERT INTO users (email,password_hash,first_name,last_name,role,status,email_verified,created_at,updated_at)
       VALUES (?,?,?,?,'actor','active',1,?,?)`,
      [email,'core-linked',first,last,now,now]
    )
  }
  try { await conn.execute(`INSERT INTO profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id`, [id]) } catch {}
}

async function main(){
  const mapPath = path.join(process.cwd(),'artifacts','provision','beta-actors-core.json')
  const data = JSON.parse(fs.readFileSync(mapPath,'utf8'))
  const conn = await mysql.createConnection({ host:DB_HOST, port:DB_PORT, user:DB_USER, password:DB_PASSWORD, database:DB_NAME, charset:'utf8mb4' })
  try{
    for(const rec of data){
      await ensureActor(conn, rec)
    }
    console.log('Ensured', data.length, 'actor rows')
  } finally { try{ await conn.end() } catch{} }
}

main().catch(e=>{ console.error('error:', e?.message||e); process.exit(1) })

