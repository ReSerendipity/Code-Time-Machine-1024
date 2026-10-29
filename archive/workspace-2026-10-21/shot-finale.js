const { chromium } = require("playwright-core");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const BASE = pathToFileURL(path.join(__dirname, "index.html")).href;
const OUT = path.join(__dirname, "shots-finale");
fs.mkdirSync(OUT, { recursive: true });

const MARKS = [1600, 3200, 5200, 7200, 9200, 11200, 13200, 15200, 17200, 19200, 21200, 23200];

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.CTM.state.traveler = "TRAE Builder";
    window.CTM.finale.play("做一个每天提醒我妈量血压的小工具");
  });

  const t0 = Date.now();
  for (const mark of MARKS) {
    const wait = mark - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(OUT, `${String(mark).padStart(5, "0")}-ms.png`) });
    const caption = await page.locator("#finale-caption").innerText();
    console.log(`${(mark / 1000).toFixed(1)}s — ${caption}`);
  }

  await page.waitForTimeout(2500);
  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
