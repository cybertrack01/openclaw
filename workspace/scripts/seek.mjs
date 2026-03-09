#!/usr/bin/env node
/**
 * Seek Employer Portal CLI — Playwright-based headless browser
 *
 * Uses playwright-core bundled with OpenClaw. Requires Chromium installed
 * via OPENCLAW_INSTALL_BROWSER=1 Docker build arg.
 *
 * Usage:
 *   seek.mjs check                        List new/unread applications across all active jobs
 *   seek.mjs applicant <url>              Get full details for one application URL
 *   seek.mjs download-cv <url> <outPath>  Download CV to outPath
 *
 * Env: SEEK_EMAIL, SEEK_PASSWORD, PLAYWRIGHT_BROWSERS_PATH
 */

process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH
  || '/home/node/.cache/ms-playwright';

const { chromium } = await import('/app/node_modules/playwright-core/index.js');

const SEEK_EMAIL = process.env.SEEK_EMAIL;
const SEEK_PASSWORD = process.env.SEEK_PASSWORD;
const [,, cmd, ...args] = process.argv;

if (!SEEK_EMAIL || !SEEK_PASSWORD) {
  console.error(JSON.stringify({ error: 'SEEK_EMAIL and SEEK_PASSWORD env vars must be set' }));
  process.exit(1);
}

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--window-size=1280,900',
];

async function withBrowser(fn) {
  const browser = await chromium.launch({ headless: true, args: BROWSER_ARGS });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  try {
    return await fn(page, context);
  } finally {
    await browser.close();
  }
}

async function login(page) {
  await page.goto('https://talent.seek.com.au/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Already logged in?
  if (!page.url().includes('id.seek.com.au') && !page.url().includes('login')) return;

  // Email step
  const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill(SEEK_EMAIL);

  // Some portals have a separate "Continue" button before password
  const continueBtn = page.locator('button[type="submit"]').first();
  await continueBtn.click();
  await page.waitForTimeout(1500);

  // Password step
  const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passwordInput.fill(SEEK_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
  }

  await page.waitForURL(/talent\.seek\.com\.au/, { timeout: 20000 });
}

async function $text(el, selector, fallback = null) {
  try { return (await el.$eval(selector, e => e.textContent?.trim())) || fallback; }
  catch { return fallback; }
}

// ── check: list new applications ─────────────────────────────
async function checkApplications(page) {
  await login(page);

  await page.goto('https://talent.seek.com.au/applications?status=new', {
    waitUntil: 'networkidle', timeout: 30000,
  });
  await page.waitForTimeout(2000);

  const applications = [];

  const cardSelectors = [
    '[data-testid="application-card"]',
    '[data-automation="application-card"]',
    '.application-card',
    'article[data-id]',
    '[class*="ApplicationCard"]',
  ];

  let cards = [];
  for (const sel of cardSelectors) {
    cards = await page.$$(sel);
    if (cards.length > 0) break;
  }

  for (const card of cards) {
    const linkEl = await card.$('a[href*="application"], a[href*="candidate"]');
    const url = linkEl ? await linkEl.getAttribute('href') : null;
    const fullUrl = url ? (url.startsWith('http') ? url : `https://talent.seek.com.au${url}`) : null;
    const name = await $text(card, '[data-testid="candidate-name"], [data-automation="candidate-name"], [class*="CandidateName"], h3, h2');
    const jobTitle = await $text(card, '[data-testid="job-title"], [data-automation="job-title"], [class*="JobTitle"]');
    const appliedAt = await $text(card, 'time, [data-testid="applied-date"], [class*="AppliedDate"]');
    if (name || fullUrl) applications.push({ name, jobTitle, appliedAt, url: fullUrl });
  }

  if (applications.length === 0) {
    return {
      applications: [],
      debug: {
        note: 'No application cards found — selectors may need updating',
        pageTitle: await page.title(),
        pageUrl: page.url(),
      },
    };
  }

  return { applications, count: applications.length };
}

// ── applicant: full details ───────────────────────────────────
async function getApplicant(page, url) {
  await login(page);

  const fullUrl = url.startsWith('http') ? url : `https://talent.seek.com.au${url}`;
  await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Reveal hidden contact details
  for (const sel of ['[data-testid="reveal-contact"]', 'button:has-text("View contact")', 'button:has-text("Show contact")', '[data-automation="reveal-contact"]']) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
      break;
    }
  }

  const details = { url: fullUrl };

  details.name = await $text(page, 'h1, [data-testid="candidate-name"], [data-automation="candidate-name"], [class*="CandidateName"]');

  const emailEl = await page.$('a[href^="mailto:"]');
  details.email = emailEl
    ? (await emailEl.getAttribute('href'))?.replace('mailto:', '').trim()
    : await $text(page, '[data-testid="email"], [data-automation="email"]');

  const phoneEl = await page.$('a[href^="tel:"]');
  details.phone = phoneEl
    ? (await phoneEl.getAttribute('href'))?.replace('tel:', '').replace(/\s/g, '')
    : await $text(page, '[data-testid="phone"], [data-automation="phone"]');

  details.location = await $text(page, '[data-testid="location"], [data-automation="location"], [class*="Location"]');
  details.workRights = await $text(page, '[data-testid="work-rights"], [data-automation="work-rights"], [class*="WorkRights"]');

  const cvEl = await page.$('a[href*=".pdf"], a[data-testid*="cv"], a[data-automation*="cv"], a:has-text("Download CV"), a:has-text("Resume")');
  details.cvUrl = cvEl ? await cvEl.getAttribute('href') : null;

  details.coverLetter = await $text(page, '[data-testid="cover-letter"], [data-automation="cover-letter"], [class*="CoverLetter"]');

  details.screeningAnswers = [];
  for (const qa of await page.$$('[data-testid="screening-answer"], [class*="ScreeningAnswer"]')) {
    const q = await $text(qa, 'strong, [class*="Question"], dt');
    const a = await $text(qa, 'span, p, [class*="Answer"], dd');
    if (q) details.screeningAnswers.push({ question: q, answer: a });
  }

  details.experience = [];
  for (const item of await page.$$('[data-testid="experience-item"], [class*="ExperienceItem"]')) {
    const title = await $text(item, '[class*="Title"], strong, h3, h4');
    const org = await $text(item, '[class*="Company"], [class*="Organisation"]');
    const duration = await $text(item, '[class*="Duration"], time');
    if (title) details.experience.push({ title, org, duration });
  }

  if (!details.name && !details.email) {
    details.debug = {
      note: 'Limited data extracted — selectors may need updating for this Seek portal version',
      pageTitle: await page.title(),
      pageUrl: page.url(),
    };
  }

  return details;
}

// ── download-cv ───────────────────────────────────────────────
async function downloadCv(page, context, cvUrl, outPath) {
  await login(page);
  const [download] = await Promise.all([
    context.waitForEvent('download'),
    page.goto(cvUrl, { waitUntil: 'domcontentloaded' }),
  ]);
  await download.saveAs(outPath);
  return { saved: outPath, suggestedFilename: download.suggestedFilename() };
}

// ── Main ──────────────────────────────────────────────────────
try {
  if (cmd === 'check') {
    console.log(JSON.stringify(await withBrowser(checkApplications), null, 2));
  } else if (cmd === 'applicant' && args[0]) {
    console.log(JSON.stringify(await withBrowser(p => getApplicant(p, args[0])), null, 2));
  } else if (cmd === 'download-cv' && args[0] && args[1]) {
    console.log(JSON.stringify(await withBrowser((p, c) => downloadCv(p, c, args[0], args[1])), null, 2));
  } else {
    console.log(JSON.stringify({ usage: ['seek.mjs check', 'seek.mjs applicant <url>', 'seek.mjs download-cv <url> <outPath>'] }));
    process.exit(1);
  }
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
