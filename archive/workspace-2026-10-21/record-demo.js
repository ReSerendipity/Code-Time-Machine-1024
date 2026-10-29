const { chromium } = require("playwright-core");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const BASE = pathToFileURL(path.join(__dirname, "index.html")).href;
const VIDEO_DIR = path.join(__dirname, "video");
fs.mkdirSync(VIDEO_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.log("pageerror:", error.message));

  const waitRoom = async (room) => {
    await page.waitForSelector(`#screen-era.is-active .room.${room}`, { timeout: 20000 });
    await page.waitForTimeout(1100);
  };

  const nextStation = async () => {
    await page.waitForSelector("#era-continue .ec-btn", { timeout: 20000 });
    await page.waitForTimeout(1300);
    const archive = page.locator("[data-archive-accept]");
    if (await archive.isVisible().catch(() => false)) await archive.click();
    else await page.click("#era-continue .ec-btn");
  };

  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await page.fill("#traveler", "夜航");
  await page.waitForTimeout(500);
  await page.click("#start-btn");

  await waitRoom("room-punch");
  const target = await page.locator("[data-target-code]").innerText();
  for (let i = 0; i < 5; i += 1) {
    await page.click(`.hole[data-col="${i}"][data-bit="${target[i]}"]`);
    await page.waitForTimeout(260);
  }
  await page.waitForTimeout(600);
  await page.click("[data-read]");
  await nextStation();

  await waitRoom("room-register");
  for (const id of ["loadA", "loadB", "add", "out"]) {
    await page.click(`[data-instr="${id}"]`);
    await page.waitForTimeout(320);
  }
  await page.waitForTimeout(400);
  await page.click("[data-run]");
  await nextStation();

  await waitRoom("room-unix");
  for (const cmd of ["grep ERROR", "grep 500", "wc -l"]) {
    await page.click(`[data-cmd="${cmd}"]`);
    await page.waitForTimeout(360);
  }
  await page.waitForTimeout(500);
  await page.click("[data-run]");
  await nextStation();

  await waitRoom("room-web");
  for (const block of ["title", "bio", "link", "counter", "guestbook", "marquee"]) {
    await page.click(`[data-block="${block}"]`);
    await page.waitForTimeout(280);
  }
  await page.waitForTimeout(600);
  await page.click("[data-publish]");
  await page.waitForTimeout(1600);
  await nextStation();

  await waitRoom("room-cloud");
  await page.locator("[data-servers]").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  await page.click(".switch-row");
  await page.waitForTimeout(600);
  await page.click("[data-cloud-run]");
  await page.waitForTimeout(5200);
  await nextStation();

  await waitRoom("room-ai");
  await page.fill("[data-prompt]", "做一个帮室友记外卖钱的小工具");
  await page.waitForTimeout(600);
  await page.click("[data-generate]");
  await page.waitForTimeout(1800);
  await page.locator("[data-adopt]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.click("[data-adopt]");
  await page.waitForTimeout(1400);

  await page.waitForSelector("#era-continue .ec-btn", { timeout: 20000 });
  await page.waitForTimeout(1200);
  const finalArchive = page.locator("[data-archive-accept]");
  if (await finalArchive.isVisible().catch(() => false)) await finalArchive.click();
  else await page.click("#era-continue .ec-btn");

  // 结尾动画完整播完（约 26.5 秒）
  await page.waitForSelector("#screen-finale.is-active", { timeout: 20000 });
  await page.waitForTimeout(27000);

  await page.waitForSelector("#screen-result.is-active", { timeout: 20000 });
  await page.waitForTimeout(2600);
  await page.locator(".result-quote").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.locator(".type-card").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);

  await context.close();
  await browser.close();

  const videos = fs
    .readdirSync(VIDEO_DIR)
    .filter((file) => file.endsWith(".webm"))
    .map((file) => ({ file, time: fs.statSync(path.join(VIDEO_DIR, file)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  if (!videos.length) throw new Error("No video recorded");
  const source = path.join(VIDEO_DIR, videos[0].file);
  const target2 = path.join(VIDEO_DIR, "demo-代码时间机器.webm");
  if (source !== target2) fs.renameSync(source, target2);
  console.log(`video: ${target2} (${(fs.statSync(target2).size / 1024 / 1024).toFixed(1)} MB)`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
