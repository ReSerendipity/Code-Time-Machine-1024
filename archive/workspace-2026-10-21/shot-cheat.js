const { chromium } = require("playwright-core");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const BASE = pathToFileURL(path.join(__dirname, "index.html")).href;
const OUT = path.join(__dirname, "shots-cheat");
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

  const shot = (name) => page.screenshot({ path: path.join(OUT, name), fullPage: false });
  const nextEra = async () => {
    const archive = page.locator("[data-archive-accept]");
    if (await archive.isVisible().catch(() => false)) await archive.click();
    else await page.click("#era-continue .ec-btn");
  };

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(2600);
  await page.click("#restart-btn").catch(() => {});
  await page.waitForTimeout(400);
  await page.click("#start-btn");
  await page.waitForSelector(".room-punch", { timeout: 20000 });
  await page.waitForTimeout(600);

  // station 1: punch a wrong pattern (T = 10100, we punch 10110)
  const target = (await page.locator("[data-target-code]").innerText()).trim();
  const wrong = target.split("").map((bit, index) => (index === 3 ? String(1 - Number(bit)) : bit)).join("");
  for (let column = 0; column < 5; column += 1) {
    await page.click(`.hole[data-col="${column}"][data-bit="${wrong[column]}"]`);
  }
  await page.click("[data-read]");
  await page.waitForTimeout(700);
  console.log("cheat card after 1st miss:", await page.locator("#cheat-card").innerText());
  await shot("01-cheat-offered.png");

  await page.click("[data-cheat-no]");
  await page.waitForTimeout(300);
  console.log("card dismissed:", await page.locator("#cheat-card").count());
  // miss again: the card must not come back for this station
  await page.click("[data-read]");
  await page.waitForTimeout(600);
  console.log("still no nag:", await page.locator("#cheat-card").count());

  for (let column = 0; column < 5; column += 1) {
    await page.click(`.hole[data-col="${column}"][data-bit="${target[column]}"]`);
  }
  await page.click("[data-read]");
  await page.waitForSelector("#era-continue", { timeout: 15000 });
  await nextEra();

  // station 2: fail once, then take the cheat
  await page.waitForSelector(".room-register", { timeout: 20000 });
  await page.waitForTimeout(500);
  for (const id of ["loadA", "add", "loadB", "out"]) {
    await page.click(`[data-instr="${id}"]`);
  }
  await page.click("[data-run]");
  await page.waitForTimeout(2600);
  await shot("02-1945-hint-and-cheat.png");
  console.log("1945 cheat:", await page.locator("#cheat-card").innerText());
  await page.click("[data-cheat-go]");
  await page.waitForTimeout(1200);
  await shot("03-agent-wiring-1945.png");
  await page.waitForSelector("#era-continue", { timeout: 20000 });
  console.log("takeover after cheat:", await page.evaluate(() => window.CTM.state.takeover.slice()));
  await nextEra();

  // stations 3-5 by hand
  await page.waitForSelector(".room-unix", { timeout: 20000 });
  await page.waitForTimeout(400);
  for (const cmd of ["grep ERROR", "grep 500", "wc -l"]) await page.click(`[data-cmd="${cmd}"]`);
  await page.click("[data-run]");
  await page.waitForSelector("#era-continue", { timeout: 20000 });
  await nextEra();

  await page.waitForSelector(".room-web", { timeout: 20000 });
  await page.waitForTimeout(400);
  for (const block of ["title", "bio", "link", "counter", "guestbook"]) await page.click(`[data-block="${block}"]`);
  await page.click("[data-publish]");
  await page.waitForSelector("#era-continue", { timeout: 20000 });
  await nextEra();

  await page.waitForSelector(".room-cloud", { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.locator("[data-servers]").focus();
  await page.keyboard.press("ArrowRight");
  await page.click(".switch-row");
  await page.click("[data-cloud-run]");
  await page.waitForSelector("#era-continue", { timeout: 30000 });
  await nextEra();

  // station 6: the prompt is the player's own
  await page.waitForSelector(".room-ai", { timeout: 20000 });
  await page.waitForTimeout(600);
  await shot("04-2026-asks-for-your-prompt.png");
  console.log("generate disabled while empty:", await page.locator("[data-generate]").isDisabled());
  await page.fill("[data-prompt]", "做一个每天提醒我妈量血压的小工具");
  await page.click("[data-generate]");
  await page.waitForTimeout(700);
  await page.click("[data-adopt]");
  await page.waitForSelector("#era-continue", { timeout: 20000 });
  await nextEra();

  // finale
  await page.waitForSelector("#screen-finale.is-active", { timeout: 20000 });
  for (const [index, mark] of [2600, 4200, 4000, 4000, 4000, 4000, 4000].entries()) {
    await page.waitForTimeout(mark);
    await shot(`05-finale-${index}.png`);
  }
  await page.waitForSelector("#screen-result.is-active", { timeout: 20000 });
  await page.waitForTimeout(1400);
  await shot("06-archive-honest.png");
  console.log("archive:", await page.locator(".takeover-note").innerText());
  console.log("type:", await page.locator(".type-name").innerText());
  console.log("errors:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
