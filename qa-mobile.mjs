import { chromium } from "playwright";
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:5173";
const pages = [
  ["home", ".home-view"], ["catalog", ".catalog-main"], ["track", ".detail-page"],
  ["artist", ".artist-page"], ["legacy", ".legacy-page"], ["licensing", ".form-page"],
  ["buyer", ".dashboard-page"], ["project", ".project-page"], ["admin", ".admin-page"],
  ["content", ".content-page"], ["system", ".system-page"],
];
const labels = { catalog:"Explore Music", track:"Track Detail", artist:"Artist Profile", legacy:"Gary Burke Legacy", licensing:"Licensing / Access", buyer:"Buyer Dashboard", project:"Project Detail", admin:"Admin", content:"Editorial Hub", system:"Design System" };
const out = [];
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport:{width:390,height:844} })).newPage();
await page.goto(BASE);
for (const [id,sel] of pages) {
  if (id === "home") {
    await page.goto(BASE);
  } else {
    if (!(await page.locator(".sidebar.is-open").isVisible().catch(() => false))) {
      if (!(await page.locator(".sidebar nav").isVisible().catch(() => false))) {
        await page.locator('.hero button:has-text("Explore Curated Music")').first().click();
      }
      await page.locator(".mobile-menu").click();
      await page.waitForSelector(".sidebar.is-open");
    }
    await page.locator(".sidebar nav button", { hasText: labels[id] }).click();
  }
  await page.waitForSelector(sel, { timeout: 8000 });
  const ox = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
  if (ox > 4) out.push({ page: id, overflow: ox });
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
