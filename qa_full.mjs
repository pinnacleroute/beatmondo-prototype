import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:5174";

// All critical hash-based views to test
const adminViews = [
  "admin",
  "admin-verifications",
  "admin-rights",
  "admin-ingestion",
  "admin-storage",
  "admin-previews",
  "admin-quotes",
  "admin-contracts",
  "admin-payments",
  "admin-licences",
  "admin-deliveries",
  "admin-expiring-access",
  "admin-audit",
  "admin/email",
  "admin/access",
  "admin/analytics",
  "admin/privacy"
];

const buyerViews = [
  "buyer",
  "project",
  "buyer-quotes",
  "buyer-contracts",
  "buyer-payments",
  "buyer-licences",
  "buyer-deliveries"
];

const publicViews = [
  "home",
  "catalog",
  "track",
  "artist",
  "legacy",
  "licensing",
  "usecases",
  "content",
  "stories",
  "media",
  "contact",
  "system"
];

const allViews = [...publicViews, ...buyerViews, ...adminViews];

const results = [];
const consoleErrors = [];

async function runQA() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Listen for console errors
  page.on("pageerror", (err) => {
    consoleErrors.push({ url: page.url(), error: err.stack || err.message });
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ url: page.url(), error: msg.text() });
    }
  });

  console.log(`Navigating to ${BASE}...`);
  await page.goto(BASE);

  // Bypass Password Gate
  console.log("Bypassing site password gate...");
  await page.fill("#site-password", "surfaceboy");
  await page.click('button[type="submit"]');
  await page.waitForSelector(".home-view", { timeout: 5000 });

  // Log in as Super Admin Preston Repenning to unlock all operations & buyer screens
  console.log("Logging in as Super Administrator Preston Repenning...");
  await page.goto(`${BASE}/#login`);
  await page.waitForSelector(".auth-card, .login-form, input[type='email']", { timeout: 10000 });
  
  await page.fill('input[type="email"]', "admin@beatmondo.com");
  await page.fill('input[type="password"]', "Admin@123");
  await page.click('button[type="submit"]');
  
  // Wait for MFA
  await page.waitForSelector('input.mfa-code');
  await page.fill('input.mfa-code', "246810");
  await page.click('button.auth-primary');

  // Wait for dashboard or main app
  await page.waitForSelector(".sidebar nav", { timeout: 10000 });
  console.log("Logged in successfully!");

  // Loop through all views
  for (const view of allViews) {
    const url = `${BASE}/#${view}`;
    console.log(`Testing view: ${view} (${url})`);
    
    await page.goto(url);
    // Wait for view loading
    await page.waitForTimeout(1000); 

    // Check if the page is rendering something besides access-denied or blank space
    const isAccessDenied = await page.locator("text=access-denied, text=Access Denied, text=not authorized").isVisible().catch(() => false);
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    const isBlank = bodyText.length === 0;

    // Check for overflow
    const overflow = await page.evaluate(() => {
      return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    });

    results.push({
      view,
      isBlank,
      isAccessDenied,
      overflow,
      url: page.url()
    });
  }

  await browser.close();

  console.log("\n--- VIEW AUDIT RESULTS ---");
  console.log(JSON.stringify(results, null, 2));

  console.log("\n--- CONSOLE ERRORS ENCOUNTERED ---");
  console.log(JSON.stringify(consoleErrors, null, 2));
}

runQA().catch(console.error);
