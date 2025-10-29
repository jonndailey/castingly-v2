#!/usr/bin/env node
// Minimal MCP server exposing Playwright browser actions over stdio.
// Tools exposed:
// - launch: create a Chromium browser/context (headless by default)
// - goto: navigate to a URL
// - fill: type into an input by selector
// - click: click a selector
// - wait_for_selector: wait for selector state
// - wait_for_url: wait for the page URL to match pattern
// - screenshot: write PNG to artifacts dir and return file path
// - get_console: return and clear collected console messages
// - get_network: return and clear collected network events
// - close: close context/browser
//
// Usage (stdio):
//   npm run mcp:browser
// Configure your MCP-enabled client to start this command as a stdio server.

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/transport/stdio.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUT_DIR = process.env.MCP_BROWSER_OUT_DIR
  ? path.resolve(process.cwd(), process.env.MCP_BROWSER_OUT_DIR)
  : path.resolve(process.cwd(), 'artifacts', 'mcp-browser')

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {})
}

const state = {
  browser: null,
  context: null,
  page: null,
  baseUrl: '',
  harPath: '',
  consoleEvents: [],
  networkEvents: [],
}

function ok(data = {}) {
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, ...data }) }] }
}

function err(message, data = {}) {
  return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message, ...data }) }] }
}

function requirePage() {
  if (!state.page) throw new Error('no_page')
  return state.page
}

async function attachPageListeners(page) {
  page.on('console', (msg) => {
    try {
      state.consoleEvents.push({
        ts: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location?.() || undefined,
      })
    } catch {}
  })
  page.on('request', (req) => {
    try {
      state.networkEvents.push({
        ts: new Date().toISOString(),
        phase: 'request',
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        headers: req.headers(),
      })
    } catch {}
  })
  page.on('response', async (res) => {
    try {
      state.networkEvents.push({
        ts: new Date().toISOString(),
        phase: 'response',
        url: res.url(),
        status: res.status(),
        ok: res.ok(),
        request: { method: res.request().method() },
        headers: await res.allHeaders().catch(() => ({})),
      })
    } catch {}
  })
}

async function launchImpl(args = {}) {
  await ensureDir(OUT_DIR)
  const headless = typeof args.headless === 'boolean' ? args.headless : true
  const width = Number(args.width || 1280)
  const height = Number(args.height || 800)
  state.baseUrl = (args.baseUrl || '').toString()
  const harName = (args.harName || 'session.har').toString()
  state.harPath = path.join(OUT_DIR, harName)

  if (state.browser) await closeImpl()

  state.browser = await chromium.launch({ headless })
  state.context = await state.browser.newContext({
    recordHar: { path: state.harPath },
    viewport: { width, height },
    ignoreHTTPSErrors: true,
  })
  state.page = await state.context.newPage()
  await attachPageListeners(state.page)
  return { headless, width, height, baseUrl: state.baseUrl, harPath: state.harPath }
}

async function closeImpl() {
  try { if (state.context) await state.context.close() } catch {}
  try { if (state.browser) await state.browser.close() } catch {}
  state.browser = null
  state.context = null
  state.page = null
  state.baseUrl = ''
  state.harPath = ''
}

const server = new Server(
  { name: 'castingly-mcp-browser', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

server.addTool(
  {
    name: 'launch',
    description: 'Launch Chromium and create a new context/page',
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean' },
        width: { type: 'number' },
        height: { type: 'number' },
        baseUrl: { type: 'string' },
        harName: { type: 'string' },
      },
    },
  },
  async ({ args }) => {
    try {
      const info = await launchImpl(args || {})
      return ok(info)
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'goto',
    description: 'Navigate to a URL (relative to baseUrl if provided)',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: { url: { type: 'string' }, waitUntil: { type: 'string' }, timeout: { type: 'number' } },
    },
  },
  async ({ args }) => {
    try {
      const page = requirePage()
      const raw = (args?.url || '').toString()
      const url = /^https?:\/\//i.test(raw) ? raw : ((state.baseUrl || '').replace(/\/$/, '') + '/' + raw.replace(/^\//, ''))
      const waitUntil = (args?.waitUntil || 'domcontentloaded')
      const timeout = Number(args?.timeout || 30000)
      await page.goto(url, { waitUntil, timeout })
      return ok({ url: page.url() })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'fill',
    description: 'Fill an input by CSS selector',
    inputSchema: {
      type: 'object',
      required: ['selector', 'value'],
      properties: { selector: { type: 'string' }, value: { type: 'string' }, timeout: { type: 'number' } },
    },
  },
  async ({ args }) => {
    try {
      const page = requirePage()
      const { selector, value } = args
      const timeout = Number(args?.timeout || 15000)
      await page.locator(selector).first().waitFor({ state: 'visible', timeout })
      await page.locator(selector).first().fill(String(value), { timeout })
      return ok({ selector })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'click',
    description: 'Click a CSS selector',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: { selector: { type: 'string' }, timeout: { type: 'number' } },
    },
  },
  async ({ args }) => {
    try {
      const page = requirePage()
      const { selector } = args
      const timeout = Number(args?.timeout || 15000)
      await page.locator(selector).first().click({ timeout })
      return ok({ selector })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'wait_for_selector',
    description: 'Wait for selector state',
    inputSchema: {
      type: 'object',
      required: ['selector'],
      properties: {
        selector: { type: 'string' },
        state: { type: 'string', enum: ['visible', 'hidden', 'attached', 'detached'] },
        timeout: { type: 'number' },
      },
    },
  },
  async ({ args }) => {
    try {
      const page = requirePage()
      const selector = String(args?.selector || '')
      const stateStr = String(args?.state || 'visible')
      const timeout = Number(args?.timeout || 15000)
      await page.locator(selector).first().waitFor({ state: stateStr, timeout })
      return ok({ selector, state: stateStr })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'wait_for_url',
    description: 'Wait for the page URL to equal or match a pattern',
    inputSchema: {
      type: 'object',
      properties: { equals: { type: 'string' }, pattern: { type: 'string' }, timeout: { type: 'number' } },
    },
  },
  async ({ args }) => {
    try {
      const page = requirePage()
      const equals = args?.equals ? String(args.equals) : ''
      const pattern = args?.pattern ? String(args.pattern) : ''
      const timeout = Number(args?.timeout || 15000)
      const deadline = Date.now() + timeout
      while (Date.now() < deadline) {
        const u = page.url()
        if ((equals && u === equals) || (pattern && new RegExp(pattern).test(u)) || (!equals && !pattern)) {
          return ok({ url: u })
        }
        await page.waitForTimeout(200)
      }
      return err('timeout', { url: page.url() })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'screenshot',
    description: 'Capture a PNG screenshot and return the file path',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' }, fullPage: { type: 'boolean' } },
    },
  },
  async ({ args }) => {
    try {
      const page = requirePage()
      await ensureDir(OUT_DIR)
      const fileName = (args?.path && String(args.path)) || `shot-${Date.now()}.png`
      const outPath = path.isAbsolute(fileName) ? fileName : path.join(OUT_DIR, fileName)
      const fullPage = args?.fullPage === true
      await page.screenshot({ path: outPath, fullPage }).catch(() => {})
      return ok({ path: outPath })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'get_console',
    description: 'Return and clear collected console messages',
    inputSchema: { type: 'object' },
  },
  async () => {
    try {
      const events = state.consoleEvents.slice()
      state.consoleEvents = []
      return ok({ events })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  {
    name: 'get_network',
    description: 'Return and clear collected network events',
    inputSchema: { type: 'object' },
  },
  async () => {
    try {
      const events = state.networkEvents.slice()
      state.networkEvents = []
      return ok({ events })
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

server.addTool(
  { name: 'close', description: 'Close browser/context/page', inputSchema: { type: 'object' } },
  async () => {
    try {
      await closeImpl()
      return ok()
    } catch (e) {
      return err(e?.message || String(e))
    }
  }
)

// Start server over stdio
await ensureDir(OUT_DIR)
await server.connect(new StdioServerTransport())
// Keep process alive; the transport manages lifecycle.

