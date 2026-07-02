import { chromium } from "playwright";
const BASE = "http://127.0.0.1:5175";
const pages = [
  ["home", ".home-view"], ["catalog", ".catalog-main"], ["track", ".detail-page"],
  ["artist", ".artist-page"], ["legacy", ".legacy-page"], ["licensing", ".form-page"],
  ["buyer", ".dashboard-page"], ["project", ".project-page"], ["admin", ".admin-page"],
  ["content", ".content-page"], ["system", ".system-page"],
];
const labels = { catalog:"Catalog", track:"Track Detail", artist:"Artist Profile", legacy:"Gary Burke Legacy", licensing:"Licensing / Access", buyer:"Buyer Dashboard", project:"Project Detail", admin:"Admin", content:"Blog / Podcast", system:"Design System" };
const out = [];
const browser = await chromium.launch({ headless: true });
for (const [w,h,name] of [[1440,900,"1440"],[1280,720,"1280"]]) {
  const page = await (await browser.newContext({ viewport:{width:w,height:h} })).newPage();
  await page.goto(BASE);
  for (const [id,sel] of pages) {
    if (id === "home") {
      await page.goto(BASE);
    } else {
      const onShell = await page.locator(".sidebar nav").isVisible().catch(() => false);
      if (!onShell) {
        await page.locator('.hero .gold-button:has-text("Explore Music"), .public-header button:has-text("Explore Music")').first().click();
        await page.waitForSelector(".sidebar nav", { timeout: 8000 });
      }
      await page.locator(".sidebar nav button", { hasText: labels[id] }).click();
    }
    await page.waitForSelector(sel, { timeout: 8000 });
    const ox = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    if (ox > 4) out.push({ viewport: name, page: id, overflow: ox });
  }
  await page.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));