// Headless login + capture console and network (HAR)
// Usage:
//   BASE_URL=https://castingly.dailey.dev \
//   USERNAME=actor.demo \
//   PASSWORD='your_password' \
//   node tools/login-capture.mjs
// Outputs to ./artifacts: console.json, login.har, screenshot.png

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'https://castingly.dailey.dev';
const LOGIN_URL = process.env.LOGIN_URL || process.env.TARGET_URL || '';
const POST_LOGIN_PATH = process.env.POST_LOGIN_PATH || '/actor/profile';
const USERNAME = process.env.USERNAME || 'actor.demo';
const PASSWORD = process.env.PASSWORD || '';
const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true }).catch(() => {});
}

function nowIso() {
  return new Date().toISOString();
}

async function writeJson(filePath, data) {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  if (!PASSWORD) {
    console.error('Missing PASSWORD env variable');
    process.exit(1);
  }

  await ensureDir(ARTIFACTS_DIR);

  const consoleLogPath = path.join(ARTIFACTS_DIR, 'console.json');
  const harPath = path.join(ARTIFACTS_DIR, 'login.har');
  const screenshotPath = path.join(ARTIFACTS_DIR, 'screenshot.png');
  const netSummaryPath = path.join(ARTIFACTS_DIR, 'network.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordHar: { path: harPath },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  let currentStage = 'init';
  const consoleEvents = [];
  const networkEvents = [];

  function attachPageListeners(p) {
    p.on('console', (msg) => {
      try {
        consoleEvents.push({
          ts: nowIso(),
          stage: currentStage,
          type: msg.type(),
          text: msg.text(),
          args: msg.args()?.length || 0,
          location: msg.location?.() || undefined,
        });
      } catch {}
    });
    p.on('pageerror', (err) => {
      consoleEvents.push({ ts: nowIso(), stage: currentStage, type: 'pageerror', text: String(err?.message || err) });
    });
    p.on('request', (req) => {
      networkEvents.push({
        ts: nowIso(),
        stage: currentStage,
        phase: 'request',
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        headers: req.headers(),
      });
    });
    p.on('response', async (res) => {
      try {
        networkEvents.push({
          ts: nowIso(),
          stage: currentStage,
          phase: 'response',
          url: res.url(),
          status: res.status(),
          ok: res.ok(),
          request: { method: res.request().method() },
          headers: await res.allHeaders().catch(() => ({})),
        });
      } catch {}
    });
  }

  attachPageListeners(page)
  context.on('page', (p) => { try { attachPageListeners(p) } catch {} })

  page.on('console', (msg) => {
    try {
      consoleEvents.push({
        ts: nowIso(),
        stage: currentStage,
        type: msg.type(),
        text: msg.text(),
        args: msg.args()?.length || 0,
        location: msg.location?.() || undefined,
      });
    } catch {}
  });

  page.on('pageerror', (err) => {
    consoleEvents.push({ ts: nowIso(), stage: currentStage, type: 'pageerror', text: String(err?.message || err) });
  });

  page.on('request', (req) => {
    networkEvents.push({
      ts: nowIso(),
      stage: currentStage,
      phase: 'request',
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      headers: req.headers(),
    });
  });

  page.on('response', async (res) => {
    try {
      networkEvents.push({
        ts: nowIso(),
        stage: currentStage,
        phase: 'response',
        url: res.url(),
        status: res.status(),
        ok: res.ok(),
        request: { method: res.request().method() },
        headers: await res.allHeaders().catch(() => ({})),
      });
    } catch {}
  });

  const tryPaths = async () => {
    if (LOGIN_URL) {
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    }
    const candidates = [
      BASE_URL,
      `${BASE_URL}/login`,
      `${BASE_URL}/signin`,
      `${BASE_URL}/auth/login`,
      `${BASE_URL}/auth/signin`,
    ];
    for (const url of candidates) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // If we find a password field, assume this is a login page
        const hasPw = await page.locator('input[type="password"]').first().isVisible({ timeout: 1000 }).catch(() => false);
        if (hasPw) return;
      } catch {}
    }
  };

  const signInViaClick = async () => {
    // Common entry point: a "Log In" or "Sign In" button/link on home
    const signInBtn = page.getByRole('link', { name: /sign in|log in/i }).first();
    if (await signInBtn.isVisible().catch(() => false)) {
      await signInBtn.click();
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
    }
  };

  const fillLoginForm = async () => {
    // Find username/email field heuristically
    const userField = page.locator([
      'input[name="username"]',
      'input[name="email"]',
      'input[autocomplete="username"]',
      'input[placeholder*="username" i]',
      'input[placeholder*="email" i]',
      'input[type="text"]',
    ].join(', ')).first();

    const pwField = page.locator('input[type="password"]').first();

    // Wait for password field as a strong login indicator
    await pwField.waitFor({ state: 'visible', timeout: 15000 });

    // Some pages autofocus the first field; ensure we target the best candidate
    if (await userField.isVisible().catch(() => false)) {
      await userField.fill(USERNAME, { timeout: 10000 }).catch(() => {});
    }
    await pwField.fill(PASSWORD, { timeout: 10000 });

    // Try to submit via explicit buttons or form submit
    const submit = page.getByRole('button', { name: /sign in|log in|submit/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click({ timeout: 10000 }).catch(() => {});
    } else {
      await page.keyboard.press('Enter').catch(() => {});
    }
  };

  const awaitPostLogin = async () => {
    // Wait for navigation away from common login paths
    const startUrl = page.url();
    const loginPatterns = [/login/i, /signin/i, /auth\//i];
    const isLoginUrl = (u) => loginPatterns.some((re) => re.test(u));

    // Give some time for redirects/content load
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const url = page.url();
      if (!isLoginUrl(url) && url !== startUrl) break;
      await page.waitForTimeout(500);
    }
  };

  // Navigate and attempt login
  currentStage = 'login';
  await tryPaths();
  await signInViaClick().catch(() => {});
  await fillLoginForm();
  currentStage = 'post-login';
  await awaitPostLogin();

  // Allow some extra time to capture post-login network/console
  await page.waitForTimeout(5000);

  // Navigate to profile page (or provided post-login path) and capture logs
  if (POST_LOGIN_PATH) {
    currentStage = 'profile-nav';
    const target = POST_LOGIN_PATH.startsWith('http')
      ? POST_LOGIN_PATH
      : `${BASE_URL.replace(/\/$/, '')}${POST_LOGIN_PATH.startsWith('/') ? '' : '/'}${POST_LOGIN_PATH}`;
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    currentStage = 'profile';
    await page.waitForTimeout(5000);

    // Try to click the first "View" button in the Demo Reels section, if present
    try {
      const viewBtn = page.getByRole('button', { name: /view/i }).first();
      if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        currentStage = 'reel-open';
        await viewBtn.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(4000);
      }
    } catch {}
  }

  // Save a confirmation screenshot
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

  // Persist logs
  await writeJson(consoleLogPath, { when: nowIso(), baseUrl: BASE_URL, console: consoleEvents });
  await writeJson(netSummaryPath, { when: nowIso(), baseUrl: BASE_URL, events: networkEvents });

  await context.close(); // finalizes HAR
  await browser.close();

  console.log('Artifacts written to:', ARTIFACTS_DIR);
  console.log(' -', path.relative(process.cwd(), consoleLogPath));
  console.log(' -', path.relative(process.cwd(), netSummaryPath));
  console.log(' -', path.relative(process.cwd(), harPath));
  console.log(' -', path.relative(process.cwd(), screenshotPath));
}

main().catch(async (err) => {
  console.error('Login capture failed:', err?.message || err);
  process.exit(1);
});
