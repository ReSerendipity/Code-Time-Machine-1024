const { chromium } = require("playwright-core");
const { pathToFileURL } = require("url");
const path = require("path");

const BASE = pathToFileURL(path.join(__dirname, "index.html")).href;

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(1400);
  await page.fill("#traveler", "回头客");
  await page.click("#start-btn");
  await page.waitForSelector("#screen-era.is-active .room-punch", { timeout: 15000 });
  const target = await page.locator("[data-target-code]").innerText();
  for (let i = 0; i < 5; i += 1) await page.click(`.hole[data-col="${i}"][data-bit="${target[i]}"]`);
  await page.click("[data-read]");
  await page.waitForSelector("#era-continue .ec-btn", { timeout: 10000 });
  const archive = page.locator("[data-archive-accept]");
  if (await archive.isVisible().catch(() => false)) await archive.click();
  else await page.click("#era-continue .ec-btn");
  await page.waitForSelector(".room-register", { timeout: 15000 });
  console.log("era2 plate:", await page.locator(".machine-plate").innerText());

  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1400);
  console.log("sound kept after reload:", await page.evaluate(() => window.CTM.state.sound));
  console.log("continue:", await page.locator("#continue-btn").innerText());
  await page.click("#continue-btn");
  await page.waitForSelector(".room-register", { timeout: 15000 });
  console.log("era2 after continue:", await page.locator(".machine-plate").innerText());
  console.log(
    "stamps:",
    await page.evaluate(() => document.querySelectorAll("#passport-track .p-stamp.is-done").length)
  );

  await page.click("#brand");
  await page.waitForTimeout(400);
  await page.fill("#traveler", "新名字");
  await page.click("#start-btn");
  await page.waitForSelector("#modal-root:not([hidden]) .modal-card", { timeout: 5000 });
  console.log("confirm title:", await page.locator(".modal-title").innerText());
  await page.click(".modal-close");
  await page.waitForTimeout(300);
  console.log("modal closed:", await page.locator("#modal-root").isHidden());

  await page.click("#sound-toggle");
  await page.waitForTimeout(200);
  console.log(
    "sound toggled:",
    await page.evaluate(() => ({ enabled: window.CTM.audio.enabled, state: window.CTM.state.sound }))
  );
  await page.click("#sound-toggle");
  await page.waitForTimeout(200);
  console.log(
    "sound back on:",
    await page.evaluate(() => ({ enabled: window.CTM.audio.enabled, ctx: window.CTM.audio.ctxState }))
  );

  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
