#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function summarizeConsole(file) {
  const data = readJson(file)
  const logs = Array.isArray(data.console) ? data.console : []
  const total = logs.length
  const byType = {}
  const byStage = {}
  for (const m of logs) {
    byType[m.type] = (byType[m.type] || 0) + 1
    const st = m.stage || 'unknown'
    byStage[st] = (byStage[st] || 0) + 1
  }
  const grp = (types) => {
    const map = new Map()
    for (const m of logs) {
      if (!types.includes(m.type)) continue
      const key = (m.text || '').trim()
      const v = map.get(key) || { count: 0, stages: new Set(), samples: [] }
      v.count++
      if (m.stage) v.stages.add(m.stage)
      if (v.samples.length < 2) v.samples.push({ ts: m.ts, stage: m.stage, loc: m.location?.url || null })
      map.set(key, v)
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count)
  }
  return { total, byType, byStage, errors: grp(['error','pageerror','assert']), warnings: grp(['warning']) }
}

function summarizeNetwork(file) {
  const data = readJson(file)
  const events = Array.isArray(data.events) ? data.events : []
  const reqs = events.filter(e => e.phase === 'request')
  const resps = events.filter(e => e.phase === 'response')
  const count = { total: events.length, requests: reqs.length, responses: resps.length }
  const matches = (substr) => resps.filter(r => (r.url||'').includes(substr))
  const avatarSafe = matches('/api/media/avatar/safe/')
  const serveSmall = matches('/api/serve/files/')
  const s3 = matches('s3.us-east-va.io.cloud.ovh.us')
  const err = resps.filter(r => r.status >= 400)
  return { count, avatarSafe: avatarSafe.length, serveSmall: serveSmall.length, s3: s3.length, errors: err.slice(0,30) }
}

function main() {
  const cPath = path.resolve('artifacts/console.json')
  const nPath = path.resolve('artifacts/network.json')
  if (!fs.existsSync(cPath) || !fs.existsSync(nPath)) {
    console.error('Missing artifacts. Run the capture script first.')
    process.exit(2)
  }
  const c = summarizeConsole(cPath)
  const n = summarizeNetwork(nPath)
  const outC = path.resolve('artifacts/console-summary.txt')
  const outN = path.resolve('artifacts/network-summary.txt')
  let textC = ''
  textC += `Total console: ${c.total}\n`
  textC += `By type: ${JSON.stringify(c.byType)}\n`
  textC += `By stage: ${JSON.stringify(c.byStage)}\n\n`
  textC += `Top errors (up to 20):\n`
  for (const [t, meta] of c.errors.slice(0,20)) {
    textC += `- x${meta.count} [stages=${[...meta.stages].join(',')||'-'}] ${t}\n`
  }
  textC += `\nTop warnings (up to 20):\n`
  for (const [t, meta] of c.warnings.slice(0,20)) {
    textC += `- x${meta.count} [stages=${[...meta.stages].join(',')||'-'}] ${t}\n`
  }
  fs.writeFileSync(outC, textC, 'utf8')

  let textN = ''
  textN += `Counts: ${JSON.stringify(n.count)}\n`
  textN += `Responses with avatar/safe: ${n.avatarSafe}\n`
  textN += `Responses with api/serve: ${n.serveSmall}\n`
  textN += `Responses to S3 host: ${n.s3}\n`
  textN += `\nFirst 10 error responses:\n`
  for (const r of n.errors.slice(0,10)) {
    textN += `- ${r.status} ${r.url} [stage=${r.stage||'-'}]\n`
  }
  fs.writeFileSync(outN, textN, 'utf8')

  console.log('Wrote summaries:')
  console.log(' ', path.relative(process.cwd(), outC))
  console.log(' ', path.relative(process.cwd(), outN))
}

main()

