// Boulevard dashboard → Sales → Gift Cards extractor
// Usage:
//   BLVD_EMAIL=... BLVD_PASSWORD=... node tools/boulevard-giftcards.mjs
// Options:
//   BASE_URL (default https://dashboard.boulevard.io)
//   LOGIN_PATH (default /login-v2/)
// Artifacts:
//   artifacts/boulevard/gift_cards.csv
//   artifacts/boulevard/console.json
//   artifacts/boulevard/trace.har
//   artifacts/boulevard/screenshot.png

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL = process.env.BLVD_EMAIL || process.env.EMAIL;
const PASSWORD = process.env.BLVD_PASSWORD || process.env.PASSWORD;
const BASE_URL = process.env.BASE_URL || 'https://dashboard.boulevard.io';
const LOGIN_PATH = process.env.LOGIN_PATH || '/login-v2/';
const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'boulevard');

if (!EMAIL || !PASSWORD) {
  console.error('Missing BLVD_EMAIL or BLVD_PASSWORD env variables');
  process.exit(1);
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value).replace(/\r?\n|\r/g, ' ').trim();
  if (s.includes(',') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function extractBasicTable(page) {
  // Try <table> with thead/tbody
  const table = page.locator('table:has(thead):has(tbody)');
  const count = await table.count();
  if (count) {
    const headers = await table.locator('thead th').allTextContents();
    const rows = [];
    const trs = table.locator('tbody tr');
    const trCount = await trs.count();
    for (let i = 0; i < trCount; i++) {
      const tds = await trs.nth(i).locator('td').allInnerTexts();
      rows.push(tds.map((t) => t.trim()));
    }
    return { headers, rows };
  }
  return null;
}

async function extractAriaGrid(page) {
  // Fallback for data grids using role="grid"
  const grid = page.locator('[role="grid"]');
  if (await grid.count()) {
    const headerCells = grid.locator('[role="rowgroup"] [role="columnheader"], [role="row"] [role="columnheader"]');
    const headers = (await headerCells.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const rows = [];
    const dataRows = grid.locator('[role="rowgroup"] [role="row"]');
    const rCount = await dataRows.count();
    for (let i = 0; i < rCount; i++) {
      const cells = await dataRows.nth(i).locator('[role="gridcell"], [role="cell"]').allInnerTexts();
      if (cells.length) rows.push(cells.map((t) => t.trim()));
    }
    if (headers.length || rows.length) return { headers, rows };
  }
  return null;
}

async function paginateAndCollect(page, collector, options = {}) {
  const { nextSelectors = [
    'button[aria-label*="Next" i]:not([disabled])',
    'button:has-text("Next")',
    'a:has-text("Next")',
  ], maxPages = 50 } = options;

  const allRows = [];
  let headers = [];
  for (let p = 0; p < maxPages; p++) {
    const chunk = await collector();
    if (chunk && chunk.rows?.length) {
      if (!headers.length && chunk.headers?.length) headers = chunk.headers;
      allRows.push(...chunk.rows);
    }

    // Try move to next page if possible; stop if no next button
    let advanced = false;
    for (const sel of nextSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 5000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => page.waitForTimeout(800));
        advanced = true;
        break;
      }
    }
    if (!advanced) break;
  }
  return { headers, rows: allRows };
}

async function main() {
  await ensureDir(OUT_DIR);
  const CONSOLE_PATH = path.join(OUT_DIR, 'console.json');
  const HAR_PATH = path.join(OUT_DIR, 'trace.har');
  const CSV_PATH = path.join(OUT_DIR, 'gift_cards.csv');
  const SCREENSHOT_PATH = path.join(OUT_DIR, 'screenshot.png');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordHar: { path: HAR_PATH },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const consoleEvents = [];
  page.on('console', (msg) => {
    consoleEvents.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    consoleEvents.push({ type: 'pageerror', text: String(err?.message || err) });
  });

  // Login
  const loginUrl = BASE_URL.replace(/\/$/, '') + LOGIN_PATH;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  await emailField.waitFor({ state: 'visible', timeout: 30000 });
  await emailField.fill(EMAIL);

  const pwField = page.locator('input[type="password"], input[name="password"]').first();
  await pwField.waitFor({ state: 'visible', timeout: 30000 });
  await pwField.fill(PASSWORD);

  // Submit
  const submit = page.getByRole('button', { name: /sign in|log in|continue|submit/i }).first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // Wait until navigation shows app shell (side nav)
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Navigate to Sales
  const gotoSales = async () => {
    const salesLink = page.getByRole('link', { name: /sales/i }).first();
    if (await salesLink.isVisible().catch(() => false)) {
      await salesLink.click();
      return true;
    }
    const salesBtn = page.getByRole('button', { name: /sales/i }).first();
    if (await salesBtn.isVisible().catch(() => false)) {
      await salesBtn.click();
      return true;
    }
    // Try opening menu
    await page.keyboard.press('g').catch(() => {});
    return false;
  };
  await gotoSales().catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  // Navigate to Gift Cards
  const giftLink = page.getByRole('link', { name: /gift cards?/i }).first();
  if (await giftLink.isVisible().catch(() => false)) {
    await giftLink.click();
  } else {
    const giftBtn = page.getByRole('button', { name: /gift cards?/i }).first();
    if (await giftBtn.isVisible().catch(() => false)) {
      await giftBtn.click();
    } else {
      // As a fallback, click any element containing the text
      const anyGift = page.locator(':text("Gift Card"), :text("Gift Cards")').first();
      if (await anyGift.isVisible().catch(() => false)) await anyGift.click();
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Collector function for one page
  const collectOnce = async () => {
    let chunk = await extractBasicTable(page);
    if (!chunk || (!chunk.headers?.length && !chunk.rows?.length)) {
      chunk = await extractAriaGrid(page);
    }
    if (chunk && chunk.headers?.length && (!chunk.headers[chunk.headers.length - 1] || !chunk.headers[chunk.headers.length - 1].trim())) {
      // Drop empty action column
      chunk.headers.pop();
      chunk.rows = chunk.rows.map((r) => r.slice(0, chunk.headers.length));
    }
    // Also drop common action cell tokens
    if (chunk && chunk.rows?.length) {
      chunk.rows = chunk.rows.map((r) => r.map((c) => c.replace(/^more_vert$/i, '').trim()));
    }
    return chunk;
  };

  // Try to paginate up to BLVD_MAX_PAGES or default 10
  const maxPages = Number(process.env.BLVD_MAX_PAGES || 10);
  const data = await paginateAndCollect(page, collectOnce, {
    nextSelectors: [
      'button[aria-label*="Next page" i]:not([disabled])',
      'button[title*="Next page" i]:not([disabled])',
      'button[aria-label*="Next" i]:not([disabled])',
      'button:has-text("Next")',
      'a:has-text("Next")'
    ],
    maxPages,
  });

  // If still no data, try to find an Export CSV control
  if ((!data || !data.rows.length) && (await page.getByRole('button', { name: /export|download csv/i }).first().isVisible().catch(() => false))) {
    // Click export and intercept download via network; fallback to screenshot
    // Some apps trigger direct CSV download; Playwright download handling requires context
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      page.getByRole('button', { name: /export|download csv/i }).first().click().catch(() => {}),
    ]);
    if (download) {
      const pathTmp = path.join(OUT_DIR, 'gift_cards_raw.csv');
      await download.saveAs(pathTmp);
      // Also set data to empty; user can use raw file
      data = data || { headers: [], rows: [] };
    }
  }

  // Save screenshot for context
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true }).catch(() => {});

  // Persist console
  await fs.promises.writeFile(CONSOLE_PATH, JSON.stringify({ when: new Date().toISOString(), console: consoleEvents }, null, 2));

  // Write CSV
  if (data && (data.headers.length || data.rows.length)) {
    const headers = data.headers.length ? data.headers : undefined;
    const lines = [];
    if (headers) lines.push(headers.map(csvEscape).join(','));
    for (const row of data.rows) lines.push(row.map(csvEscape).join(','));
    await fs.promises.writeFile(CSV_PATH, lines.join('\n'), 'utf8');
    console.log(`CSV written: ${CSV_PATH} (${data.rows.length} rows)`);
  } else {
    console.log('Could not detect table to extract. HAR and screenshot saved.');
  }

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error('Boulevard extraction failed:', err?.message || err);
  process.exit(1);
});
