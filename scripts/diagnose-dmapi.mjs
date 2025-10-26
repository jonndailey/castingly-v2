#!/usr/bin/env node
import 'dotenv/config'

const args = process.argv.slice(2)
const idIdx = args.indexOf('--id')
const actorId = idIdx >= 0 ? String(args[idIdx + 1] || '') : ''
if (!actorId) {
  console.error('Usage: node scripts/diagnose-dmapi.mjs --id <actorId>')
  process.exit(1)
}

if (process.env.MIGRATION_ENV) {
  const { config } = await import('dotenv')
  config({ path: process.env.MIGRATION_ENV })
}

const { listBucketFolder } = await import('../lib/server/dmapi-service.ts')

async function run() {
  const folder = await listBucketFolder({
    bucketId: 'castingly-public',
    userId: actorId,
    path: `actors/${actorId}/headshots`,
  })
  console.log(JSON.stringify({ count: folder?.files?.length || 0, files: (folder?.files || []).map(f => ({ name: f.name, url: f.public_url || f.url || null })) }, null, 2))
}

run().catch((e) => { console.error('diagnose failed:', e); process.exit(1) })

