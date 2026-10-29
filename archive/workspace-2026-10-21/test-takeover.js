const { chromium } = require("playwright-core");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const BASE = pathToFileURL(path.join(__dirname, "index.html")).href;
const OUT = path.join(__dirname, "shots-agent");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  await page.fill("#traveler", "超时的人");
  await page.click("#start-btn");
  await page.waitForSelector(".room-punch", { timeout: 20000 });
  await page.waitForTimeout(600);

  // the clock runs out while the player is still on station 1
  await page.evaluate(() => {
    window.CTM.state.deadlineAt = Date.now() + 1200;
    window.CTM.storage.save();
  });

  await page.waitForSelector("#agent-banner:not([hidden])", { timeout: 15000 });
  console.log("banner:", await page.locator("#agent-banner").innerText());
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, "01-agent-in-1945.png") });

  await page.waitForSelector("#screen-result.is-active", { timeout: 90000 });
  await page.waitForTimeout(1500);
  const result = await page.evaluate(() => ({
    stamps: window.CTM.state.stamps.length,
    takeover: window.CTM.state.takeover,
    completed: window.CTM.state.completed,
    banner: document.querySelector(".takeover-note") ? document.querySelector(".takeover-note").innerText.replace(/\n+/g, " · ") : null,
    agentStamps: document.querySelectorAll("#passport-track .p-stamp.is-agent").length,
    type: document.querySelector(".type-name").innerText,
    direction: document.querySelector(".bar-row") ? true : false,
  }));
  console.log("result:", JSON.stringify(result, null, 2));
  await page.screenshot({ path: path.join(OUT, "02-archive-after-takeover.png"), fullPage: true });

  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length || !result.banner || result.stamps !== 6) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
