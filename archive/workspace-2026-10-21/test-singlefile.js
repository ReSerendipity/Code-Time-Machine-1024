const { chromium } = require("playwright-core");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  const fileUrl = pathToFileURL(path.join(__dirname, "code-time-machine.html")).href;
  console.log("file:", fileUrl);
  await page.goto(fileUrl, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  console.log("landing title:", await page.locator(".hero-title").innerText());
  await page.fill("#traveler", "离线测试");
  await page.click("#start-btn");
  await page.waitForSelector("#screen-era.is-active .era-shell", { timeout: 12000 });
  console.log("era:", await page.locator(".era-title").innerText());
  await page.screenshot({ path: "shots/23-singlefile-era1.png", fullPage: true });
  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
