// Extract a single Gift Card row with client email, phone and purchase date/time.
// Safe mode: does NOT click Resend or any outreach actions.
// Usage:
//   BLVD_EMAIL=... BLVD_PASSWORD=... node tools/boulevard-giftcard-one.mjs
// Optional filters:
//   BLVD_TARGET_NAME="Keven Slyne"   (match Purchasing Client; else picks first row)
//   BASE_URL (default https://dashboard.boulevard.io)
//   LOGIN_PATH (default /login-v2/)
// Outputs:
//   artifacts/boulevard/one_gift_card.csv
//   artifacts/boulevard/one_screenshot.png
//   artifacts/boulevard/one.har

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
const TARGET_NAME = process.env.BLVD_TARGET_NAME || '';

const OUT_DIR = path.resolve(process.cwd(), 'artifacts', 'boulevard');
const CSV_PATH = path.join(OUT_DIR, 'one_gift_card.csv');
const SCREENSHOT_PATH = path.join(OUT_DIR, 'one_screenshot.png');
const HAR_PATH = path.join(OUT_DIR, 'one.har');

if (!EMAIL || !PASSWORD) {
  console.error('Missing BLVD_EMAIL or BLVD_PASSWORD env variables');
  process.exit(1);
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

function csvRow(arr) {
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/\r?\n|\r/g, ' ').trim();
    if (s.includes(',') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  return arr.map(esc).join(',');
}

async function textSafe(locator) {
  try { return (await locator.textContent())?.trim() || ''; } catch { return ''; }
}

async function inputValueSafe(locator) {
  try { return await locator.inputValue(); } catch { return ''; }
}

async function main() {
  await ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ recordHar: { path: HAR_PATH }, ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Login
  const loginUrl = BASE_URL.replace(/\/$/, '') + LOGIN_PATH;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  await emailField.waitFor({ state: 'visible', timeout: 30000 });
  await emailField.fill(EMAIL);
  const pwField = page.locator('input[type="password"], input[name="password"]').first();
  await pwField.fill(PASSWORD);
  const submit = page.getByRole('button', { name: /sign in|log in|continue|submit/i }).first();
  if (await submit.isVisible().catch(() => false)) await submit.click(); else await page.keyboard.press('Enter');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Navigate to Sales → Gift cards
  const salesLink = page.getByRole('link', { name: /^sales$/i }).first();
  if (await salesLink.isVisible().catch(() => false)) {
    await salesLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  // Click the Gift cards tab explicitly (top subnav)
  const giftTab = page.getByRole('link', { name: /^gift cards$/i }).first();
  if (await giftTab.isVisible().catch(() => false)) {
    await giftTab.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  } else {
    // Fallback: any element labeled Gift cards in the tab row
    const anyGiftTab = page.locator('a:has-text("Gift cards"), button:has-text("Gift cards")').first();
    if (await anyGiftTab.isVisible().catch(() => false)) {
      await anyGiftTab.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  // Find target row in table
  // Ensure we're on Gift cards by checking for a header cell
  const table = page.locator('table:has(thead):has(tbody)');
  await table.waitFor({ state: 'visible', timeout: 30000 });
  const hasGiftHeader = await table.locator('thead').filter({ hasText: /gift card code|recipient/i }).count();
  if (!hasGiftHeader) {
    // If not on the right tab yet, try clicking the Gift cards tab again
    const giftTab2 = page.getByRole('link', { name: /^gift cards$/i }).first();
    if (await giftTab2.isVisible().catch(() => false)) {
      await giftTab2.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }
    await table.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  }
  let rows = table.locator('tbody tr');
  let row = rows.first();
  if (TARGET_NAME) {
    const match = rows.filter({ hasText: TARGET_NAME });
    if (await match.count()) row = match.first();
  }

  // Read base fields directly from the row
  const cells = row.locator('td');
  // Try to map columns by header text to be robust to ordering differences
  const headerTexts = (await table.locator('thead th').allInnerTexts()).map((t) => t.trim().toLowerCase());
  const idx = (label) => headerTexts.findIndex((h) => h.includes(label));
  const idxClient = idx('purchasing');
  const idxCode = idx('gift card code');
  const idxBalance = idx('current balance');
  const idxRecipient = idx('recipient');
  const idxRecipientEmail = idx("recipient's email");
  const idxSource = idx('source');
  const idxStatus = idx('status');

  const purchasingClient = await textSafe(cells.nth(idxClient > -1 ? idxClient : 0));
  const giftCardCode = await textSafe(cells.nth(idxCode > -1 ? idxCode : 1));
  const currentBalance = await textSafe(cells.nth(idxBalance > -1 ? idxBalance : 2));
  const recipient = await textSafe(cells.nth(idxRecipient > -1 ? idxRecipient : 3));
  const recipientEmail = await textSafe(cells.nth(idxRecipientEmail > -1 ? idxRecipientEmail : 4));
  const source = await textSafe(cells.nth(idxSource > -1 ? idxSource : 5));
  const status = await textSafe(cells.nth(idxStatus > -1 ? idxStatus : 6));

  // Open client drawer by clicking the purchasing client's name (safe, read-only)
  const nameClickTarget = cells.nth(0).locator('a, button, [role="link"], span, div');
  if (await nameClickTarget.first().isVisible().catch(() => false)) {
    await nameClickTarget.first().click({ timeout: 5000 }).catch(() => {});
    // Wait for drawer/dialog to appear
    await page.waitForTimeout(800);
  }

  // Attempt to read primary email and phone number from the profile drawer/dialog
  let clientEmail = '';
  let clientPhone = '';
  const emailLink = page.locator('aside a[href^="mailto:"], [role="dialog"] a[href^="mailto:"], a[href^="mailto:"]');
  if (await emailLink.count()) {
    const href = await emailLink.first().getAttribute('href');
    if (href) clientEmail = href.replace(/^mailto:/i, '');
  }
  const phoneInput = page.locator('[data-testid="client-profile-phone-number-input"], input[name="phone.mobile"], input[type="tel"]');
  if (await phoneInput.count()) clientPhone = await inputValueSafe(phoneInput.first());

  // Close drawer if a close button is present (avoid actions like Resend)
  const closeBtn = page.getByRole('button', { name: /close|dismiss/i }).first();
  if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click().catch(() => {});

  // Open row menu (three dots) and choose View history (read-only)
  const menuBtn = row.locator('button[aria-label*="more" i], button[aria-haspopup], button:has-text("more_vert"), button md-icon:has-text("more_vert")').first();
  await row.scrollIntoViewIfNeeded().catch(() => {});
  await menuBtn.click({ timeout: 8000 }).catch(() => {});
  const viewHistory = page.getByRole('menuitem', { name: /^\s*view history\s*$/i }).first();
  await viewHistory.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  if (await viewHistory.isVisible().catch(() => false)) await viewHistory.click({ timeout: 8000 }).catch(() => {});
  // Wait for modal and extract columns from history table
  await page.waitForTimeout(500);
  const dialog = page.locator('[role="dialog"], .md-dialog-container, .mat-dialog-container').first();
  let purchaseDate = '';
  let purchaseTime = '';
  let purchaseOrder = '';
  let purchaseWhere = '';
  let purchaseBalance = '';
  if (await dialog.isVisible().catch(() => false)) {
    let cells = [];
    const histTable = dialog.locator('table:has(thead):has(tbody)');
    if (await histTable.count()) {
      const firstRow = histTable.locator('tbody tr').first();
      cells = await firstRow.locator('td').allInnerTexts().catch(() => []);
    } else {
      // Fallback for AngularJS md-table without <table>
      const thead = dialog.locator('thead.md-head');
      const tbodyRow = dialog.locator('tbody.md-body tr.md-row').first();
      if (await tbodyRow.count()) {
        cells = await tbodyRow.locator('td.md-cell').allInnerTexts().catch(() => []);
      }
    }
    if (cells && cells.length) {
      purchaseDate = (cells[0] || '').trim();
      purchaseTime = (cells[1] || '').trim();
      purchaseWhere = (cells[4] || '').trim();
      purchaseOrder = (cells[5] || '').trim();
      purchaseBalance = (cells[6] || '').trim();
    }
    const closeDialog = dialog.getByRole('button', { name: /close|done|ok|dismiss|cancel/i }).first();
    if (await closeDialog.isVisible().catch(() => false)) await closeDialog.click().catch(() => {});
    else await page.keyboard.press('Escape').catch(() => {});
  }

  // Persist a screenshot and CSV
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true }).catch(() => {});

  const headers = [
    'Purchasing Client','Client Email','Client Phone','Gift Card Code','Current Balance','Recipient','Recipient Email','Source','Status','Purchase Date','Purchase Time','Order Number','Where','History Balance'
  ];
  const line = [
    purchasingClient, clientEmail, clientPhone, giftCardCode, currentBalance, recipient, recipientEmail, source, status, purchaseDate, purchaseTime, purchaseOrder, purchaseWhere, purchaseBalance
  ];
  await fs.promises.writeFile(CSV_PATH, [csvRow(headers), csvRow(line)].join('\n'), 'utf8');

  await context.close();
  await browser.close();

  console.log(`Saved: ${CSV_PATH}`);
}

main().catch((err) => {
  console.error('Gift card single extraction failed:', err?.message || err);
  process.exit(1);
});
