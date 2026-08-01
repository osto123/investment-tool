// Drives the investment-tool Next.js app with a headless Playwright
// browser: logs in, walks dashboard → an apartment's detail/reports
// pages, and screenshots each step. See ../SKILL.md for prerequisites.
import "dotenv/config";
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.SEED_ADMIN_EMAIL;
const PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const outDir = process.argv[2] || "./screenshots";
const extraRoute = process.argv[3]; // optional: also screenshot this path after login

if (!EMAIL || !PASSWORD) {
  console.error(
    "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set. They come from .env " +
      "(loaded automatically) — run `npm run db:seed` first if you haven't."
  );
  process.exit(1);
}

try {
  const res = await fetch(`${BASE_URL}/login`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (err) {
  console.error(
    `Could not reach ${BASE_URL}/login (${err.message}).\n` +
      "Start the app first: docker compose up -d && npm run dev"
  );
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(outDir, "login.png") });

await page.fill("#email", EMAIL);
await page.fill("#password", PASSWORD);
await Promise.all([
  page.waitForURL(/dashboard/, { timeout: 10000 }),
  page.click('button[type="submit"]'),
]);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: path.join(outDir, "dashboard.png"), fullPage: true });

// Open the first real apartment card (skip "+ Add apartment", which also
// matches the /apartments/ href prefix).
const aptHref = await page
  .locator('a[href^="/apartments/"]:not([href="/apartments/new"])')
  .first()
  .getAttribute("href")
  .catch(() => null);

if (aptHref) {
  await page.goto(`${BASE_URL}${aptHref}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "apartment-detail.png"), fullPage: true });

  await page.goto(`${BASE_URL}${aptHref}/reports`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, "reports.png"), fullPage: true });
} else {
  console.log("No apartments in the DB yet — only login/dashboard captured.");
}

if (extraRoute) {
  await page.goto(`${BASE_URL}${extraRoute}`, { waitUntil: "networkidle" });
  const fileName = extraRoute.replace(/^\/|\/$/g, "").replace(/[\/[\]]/g, "-") || "custom";
  await page.screenshot({ path: path.join(outDir, `${fileName}.png`), fullPage: true });
}

await browser.close();
console.log(`Screenshots written to ${path.resolve(outDir)}`);
