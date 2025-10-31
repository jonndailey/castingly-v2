#!/usr/bin/env node
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const CORE_BASE = (process.env.DAILEY_CORE_AUTH_URL || process.env.NEXT_PUBLIC_DAILEY_CORE_AUTH_URL || 'https://core.dailey.cloud').replace(/\/$/, '')
const APP_SLUG = process.env.DAILEY_CORE_APP_SLUG || 'castingly-portal'
const TENANT_SLUG = process.env.DAILEY_CORE_TENANT_SLUG || 'castingly'
const ADMIN_EMAIL = process.env.DAILEY_CORE_ADMIN_EMAIL || 'dmapi-service@castingly.com'
const ADMIN_PASSWORD = process.env.DAILEY_CORE_ADMIN_PASSWORD || 'castingly_dmapi_service_2025'

const ACTORS = [
  { name: 'Amber Luallen', email: 'amberluallen89@gmail.com' },
  { name: 'Matt Sweeney', email: 'driscollsweeney@gmail.com' },
  { name: 'Ryan Coil', email: 'ryankcoil@gmail.com' },
  { name: 'Jared Nigro', email: 'nigro.jared@gmail.com' },
  { name: 'Joel Anderson', email: 'joelpa@gmail.com' },
  { name: 'Daniel Cohen', email: 'danielmkcohen@gmail.com' },
  { name: 'Jonny Dailey', email: 'jonndailey@gmail.com' },
]

function genPassword(){
  return (crypto.randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g,'') + crypto.randomBytes(2).toString('hex')).slice(0,16)
}

async function login(){
  const r = await fetch(`${CORE_BASE}/auth/login`,{
    method:'POST',headers:{'Content-Type':'application/json','X-Client-Id':APP_SLUG,'X-Tenant-Slug':TENANT_SLUG},
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, app_slug: APP_SLUG, tenant_slug: TENANT_SLUG })
  })
  const j = await r.json()
  if(!r.ok) throw new Error(j?.error || `login ${r.status}`)
  return j.access_token
}

async function getTenantId(token){
  const res = await fetch(`${CORE_BASE}/api/auth-tenants?limit=200&search=${encodeURIComponent(TENANT_SLUG)}`,{ headers:{ Authorization:`Bearer ${token}` } })
  const j = await res.json()
  if(!res.ok) throw new Error(j?.error || `tenants ${res.status}`)
  const t = (Array.isArray(j.tenants)?j.tenants:[]).find(x=>String(x.slug).toLowerCase()===TENANT_SLUG)
  if(!t) throw new Error('tenant_not_found')
  return t.id
}

async function findUser(token,email){
  const res = await fetch(`${CORE_BASE}/api/auth-users?limit=1&search=${encodeURIComponent(email)}`,{ headers:{ Authorization:`Bearer ${token}` } })
  if(!res.ok) return null
  const j = await res.json()
  const u = (Array.isArray(j.users)?j.users:[]).find(x=>String(x.email).toLowerCase()===String(email).toLowerCase())
  return u||null
}

async function createUser(token, tenantId, { email, password, name }){
  const res = await fetch(`${CORE_BASE}/api/auth-users`,{
    method:'POST', headers:{ Authorization:`Bearer ${token}`,'Content-Type':'application/json' },
    body: JSON.stringify({ email, password, tenant_id: tenantId, roles:['user'], name })
  })
  const j = await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(j?.error || `create ${res.status}`)
  return j.id || j.user?.id
}

async function updatePassword(token, userId, newPassword){
  const res = await fetch(`${CORE_BASE}/api/auth-users/${encodeURIComponent(userId)}`,{
    method:'PUT', headers:{ Authorization:`Bearer ${token}`,'Content-Type':'application/json' },
    body: JSON.stringify({ password: newPassword })
  })
  if(!res.ok){ const j=await res.json().catch(()=>({})); throw new Error(j?.error || `update ${res.status}`) }
}

async function main(){
  const token = await login()
  const tenantId = await getTenantId(token)
  const outDir = path.join(process.cwd(),'artifacts','provision')
  fs.mkdirSync(outDir,{recursive:true})
  const csvPath = path.join(outDir,'beta-actors-passwords.csv')
  const mapPath = path.join(outDir,'beta-actors-core.json')
  const lines = ['name,email,password']
  const records = []
  for(const a of ACTORS){
    let user = await findUser(token, a.email)
    const pw = genPassword()
    if(user){
      await updatePassword(token, user.id, pw)
    } else {
      const id = await createUser(token, tenantId, { email:a.email, password:pw, name:a.name })
      user = { id, email:a.email, name:a.name }
    }
    lines.push(`${JSON.stringify(a.name)},${a.email},${pw}`)
    records.push({ id:user.id, email:a.email, name:a.name })
  }
  fs.writeFileSync(csvPath, lines.join('\n'),'utf8')
  fs.writeFileSync(mapPath, JSON.stringify(records,null,2),'utf8')
  console.log('Wrote', csvPath)
  console.log('Wrote', mapPath)
}

main().catch(e=>{ console.error('error:', e?.message||e); process.exit(1) })

