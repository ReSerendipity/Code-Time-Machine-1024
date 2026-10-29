const { chromium } = require("playwright-core");

const BASE = "http://localhost:8080/";

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.log("pageerror:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.log("console:", message.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  const now = Date.now();
  await page.evaluate(({ now }) => {
    const eraScores = [
      { manual: 20, systems: 5, expression: 0, direction: 0 },
      { manual: 5, systems: 20, expression: 0, direction: 0 },
      { manual: 0, systems: 20, expression: 5, direction: 0 },
      { manual: 5, systems: 0, expression: 20, direction: 0 },
      { manual: 0, systems: 15, expression: 0, direction: 10 },
      { manual: 0, systems: 0, expression: 7, direction: 17 },
    ];
    localStorage.setItem(
      "ctm-1024-v1",
      JSON.stringify({
        traveler: "夜航",
        eraIndex: 6,
        stamps: [0, 1, 2, 3, 4, 5],
        scores: { manual: 30, systems: 60, expression: 32, direction: 27 },
        eraScores,
        choices: {},
        ai: { goal: "tool", style: "cyber", prompt: "做一个帮室友记外卖钱的小工具", seed: 12345, plan: [] },
        sound: false,
        started: true,
        completed: true,
        startedAt: now - 34000,
        finishedAt: now,
      })
    );
  }, { now });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  console.log("continue visible:", await page.locator("#continue-wrap").isVisible());
  await page.click("#continue-btn");
  await page.waitForSelector("#screen-result.is-active", { timeout: 10000 });
  await page.waitForTimeout(400);
  const sharedUrl = await page.locator("[data-share-url]").inputValue();
  console.log("share URL length:", sharedUrl.length);
  console.log("share URL head:", sharedUrl.slice(0, 120));
  const decodedHere = await page.evaluate((url) => {
    const hash = new URL(url).hash;
    const raw = hash.slice(3);
    let error = null;
    let payload = null;
    let data = null;
    try {
      payload = JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((raw.length + 3) % 4)))));
    } catch (e) {
      error = String(e);
    }
    try {
      data = CTM.result.decode(raw);
    } catch (e) {
      error = (error || "") + " decode:" + String(e);
    }
    return { hashLength: hash.length, error, payloadVersion: payload && payload.v, dataShared: data && data.shared, dataName: data && data.traveler };
  }, sharedUrl);
  console.log("decoded on result page:", decodedHere);

  const sharedPage = await context.newPage();
  sharedPage.on("pageerror", (error) => console.log("shared pageerror:", error.message));
  sharedPage.on("console", (message) => {
    if (message.type() === "error") console.log("shared console:", message.text());
  });
  await sharedPage.goto(sharedUrl, { waitUntil: "networkidle" });
  await sharedPage.waitForTimeout(1500);
  const sharedInfo = await sharedPage.evaluate(() => ({
    href: location.href.slice(0, 100),
    hashLength: location.hash.length,
    hashHead: location.hash.slice(0, 60),
    active: document.querySelector(".screen.is-active")?.id,
    toast: document.querySelector("#toast")?.textContent,
    resultText: document.querySelector("#result-root")?.innerText.slice(0, 160),
    hasBanner: !!document.querySelector(".shared-banner"),
    decode: (() => {
      try {
        const data = CTM.result.decode(location.hash.slice(3));
        return data ? { shared: data.shared, name: data.traveler, type: data.type.name } : null;
      } catch (e) {
        return "ERR:" + e.message;
      }
    })(),
  }));
  console.log("shared page info:", JSON.stringify(sharedInfo, null, 2));
  await sharedPage.screenshot({ path: "shots/debug-shared.png", fullPage: true });
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
