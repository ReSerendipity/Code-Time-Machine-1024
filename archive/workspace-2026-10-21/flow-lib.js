const fs = require("fs");
const path = require("path");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createFlow({ base, shotsDir, label, page, context, errors }) {
  fs.mkdirSync(shotsDir, { recursive: true });

  const shot = async (name, fullPage = true) => {
    await page.screenshot({ path: path.join(shotsDir, name), fullPage });
  };

  const room = async (eraClass) => {
    await page.waitForSelector(`#screen-era.is-active .room.${eraClass}`, { timeout: 20000 });
    await page.waitForTimeout(450);
  };

  const stampOf = async (index) => {
    const card = page.locator("#era-continue");
    await card.waitFor({ state: "visible", timeout: 20000 });
    await sleep(500);
    const label = await card.locator(".ec-btn").innerText();
    const done = await page.evaluate(
      (i) => document.querySelectorAll("#passport-track .p-stamp.is-done").length,
      index
    );
    return { label, stamps: done };
  };

  const advance = async () => {
    const archive = page.locator("[data-archive-accept]");
    if (await archive.isVisible().catch(() => false)) {
      await archive.click();
    } else {
      await page.click("#era-continue .ec-btn");
    }
    await page.waitForSelector("#era-continue", { state: "detached", timeout: 20000 });
  };

  const overflow = () =>
    page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));

  return { shot, room, stampOf, advance, overflow, label };
}

async function runFlow(options) {
  const { base, shotsDir, label, page, context, errors } = options;
  const flow = createFlow({ base, shotsDir, label, page, context, errors });
  const report = { label: label || "flow", steps: [] };
  const step = (name, value) => {
    report.steps.push({ name, value });
    console.log(`[${report.label}] ${name}:`, JSON.stringify(value));
  };

  await page.goto(base, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    window.__sfx = [];
    const names = [
      "punch",
      "loom",
      "relay",
      "teletype",
      "modem",
      "fan",
      "scaleUp",
      "generate",
      "stamp",
      "warp",
      "chime",
      "success",
      "error",
    ];
    names.forEach((key) => {
      const original = window.CTM.audio[key];
      if (typeof original !== "function") return;
      window.CTM.audio[key] = function play() {
        window.__sfx.push(key);
        return original.apply(this, arguments);
      };
    });
  });
  const takeSfx = () =>
    page.evaluate(() => {
      const seen = window.__sfx.slice();
      window.__sfx = [];
      return seen;
    });
  await flow.shot("01-landing.png");
  step("landing", await flow.overflow());

  // audio must be on by default
  step("audio-default", await page.evaluate(() => ({
    state: window.CTM.state.sound,
    enabled: window.CTM.audio.enabled,
    ctx: window.CTM.audio.ctxState,
  })));

  // history sources are reachable from inside the room
  await page.fill("#traveler", "夜航");
  await page.click("#start-btn");
  await flow.room("room-punch");
  step("countdown", await page.evaluate(() => {
    const box = document.querySelector("#countdown");
    return {
      visible: !box.hidden,
      value: document.querySelector("#countdown-value").textContent,
      deadlineIn: Math.round((window.CTM.state.deadlineAt - Date.now()) / 1000),
    };
  }));
  step("era1-room", await page.evaluate(() => ({
    sign: document.querySelector(".room-sign").innerText.replace(/\n/g, " · "),
    holes: document.querySelectorAll(".hole").length,
    target: document.querySelector("[data-target-code]").innerText,
    noShell: !document.querySelector(".era-shell") && !document.querySelector(".task-card"),
  })));
  await flow.shot("02-era1-punch.png");
  await page.click("[data-sources]");
  await page.waitForSelector("#modal-root:not([hidden]) .modal-card", { timeout: 8000 });
  await flow.shot("02b-era1-sources.png", false);
  await page.click(".modal-close");
  await page.waitForTimeout(250);

  const era1Target = await page.locator("[data-target-code]").innerText();
  for (let i = 0; i < 5; i += 1) {
    await page.click(`.hole[data-col="${i}"][data-bit="${era1Target[i]}"]`);
  }
  await page.click("[data-read]");
  step("era1-stamp", await flow.stampOf(1));
  step("sfx-era1", await takeSfx());
  await flow.shot("03-era1-woven.png", false);
  await flow.advance();

  await flow.room("room-register");
  await flow.shot("04-era2-register.png");
  // wire it in the wrong order on purpose: the room has to explain the failure
  for (const id of ["loadA", "add", "loadB", "out"]) {
    await page.click(`[data-instr="${id}"]`);
  }
  await page.click("[data-run]");
  await page.waitForTimeout(2600);
  step("era2-hint", await page.evaluate(() => {
    const hint = document.querySelector("[data-hint]");
    const cheat = document.querySelector("#cheat-card");
    return {
      hintVisible: !hint.hidden,
      hint: hint.innerText.replace(/\n+/g, " · ").slice(0, 60),
      cheatOffered: Boolean(cheat),
      cheatText: cheat ? cheat.innerText.replace(/\n+/g, " · ") : null,
    };
  }));
  await flow.shot("05-era2-hint.png", false);
  // take the cheat: the archive has to admit it
  await page.click("[data-cheat-go]");
  step("era2-stamp", await flow.stampOf(2));
  step("era2-cheat-recorded", await page.evaluate(() => window.CTM.state.takeover.slice()));
  step("sfx-era2", await takeSfx());
  await flow.shot("05b-era2-passed.png", false);
  await flow.advance();

  await flow.room("room-unix");
  await flow.shot("06-era3-unix.png");
  for (const cmd of ["grep 500", "wc -l"]) {
    await page.click(`[data-cmd="${cmd}"]`);
  }
  await page.click("[data-run]");
  await page.waitForTimeout(500);
  step("era3-hint", await page.evaluate(() => {
    const hint = document.querySelector("[data-hint]");
    return { visible: !hint.hidden, text: hint.innerText.replace(/\n+/g, " · ").slice(0, 140) };
  }));
  await flow.shot("06b-era3-hint.png", false);
  await page.click("[data-undo]");
  for (const cmd of ["grep ERROR", "wc -l"]) {
    await page.click(`[data-cmd="${cmd}"]`);
  }
  await page.click("[data-run]");
  step("era3-output", await page.locator("[data-output]").innerText());
  step("era3-stamp", await flow.stampOf(3));
  step("sfx-era3", await takeSfx());
  await flow.shot("07-era3-printed.png", false);
  await flow.advance();

  await flow.room("room-web");
  await flow.shot("08-era4-web.png");
  for (const block of ["title", "bio", "link", "counter", "guestbook", "marquee"]) {
    await page.click(`[data-block="${block}"]`);
  }
  await page.click("[data-publish]");
  await page.waitForTimeout(900);
  await flow.shot("09-era4-published.png");
  step("era4-stamp", await flow.stampOf(4));
  step("sfx-era4", await takeSfx());
  await flow.advance();

  await flow.room("room-cloud");
  await flow.shot("10-era5-cloud.png");
  await page.locator("[data-servers]").focus();
  await page.keyboard.press("ArrowRight");
  await page.click(".switch-row");
  await page.waitForTimeout(250);
  step("cloud-config", {
    cost: await page.locator("[data-cost]").innerText(),
    errors: await page.locator("[data-err]").innerText(),
    cap: await page.locator("[data-cap]").innerText(),
  });
  await page.click("[data-cloud-run]");
  step("era5-stamp", await flow.stampOf(5));
  step("sfx-era5", await takeSfx());
  await flow.shot("11-era5-live.png", false);
  await flow.advance();

  await flow.room("room-ai");
  await flow.shot("12-era6-ai.png");
  step("era6-needs-own-prompt", {
    generateDisabledBefore: await page.locator("[data-generate]").isDisabled(),
    promptEmpty: (await page.locator("[data-prompt]").inputValue()) === "",
  });
  await page.fill("[data-prompt]", "做一个帮室友记外卖钱的小工具");
  step("era6-after-typing", await page.locator("[data-generate]").isDisabled());
  await page.click("[data-generate]");
  await page.waitForTimeout(600);
  step("ai-plan-steps", await page.locator(".msg.is-plan .plan-step").count());
  const firstPlan = await page.locator(".msg.is-plan .plan-step").first().innerText();
  await page.click("[data-regen]");
  await page.waitForTimeout(600);
  step("ai-regen-changes-plan", {
    before: firstPlan.slice(0, 24),
    after: (await page.locator(".msg.is-plan").last().locator(".plan-step").first().innerText()).slice(0, 24),
    changed: firstPlan !== (await page.locator(".msg.is-plan").last().locator(".plan-step").first().innerText()),
  });
  await flow.shot("13-era6-generated.png");
  await page.click("[data-adopt]");
  step("era6-stamp", await flow.stampOf(6));
  step("sfx-era6", await takeSfx());
  await flow.shot("14-era6-adopted.png", false);

  await flow.advance();
  await page.waitForSelector("#screen-finale.is-active", { timeout: 20000 });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: path.join(shotsDir, "24-finale-a.png") });
  await page.waitForTimeout(6200);
  await page.screenshot({ path: path.join(shotsDir, "25-finale-b.png") });
  step("finale-caption", await page.locator("#finale-caption").innerText());
  await page.click("#finale-skip");
  await page.waitForSelector("#screen-result.is-active", { timeout: 20000 });
  await page.waitForTimeout(1200);
  step("result-type", await page.locator(".type-name").innerText());
  step("cheat-honesty", await page.evaluate(() => ({
    takeover: window.CTM.state.takeover,
    banner: document.querySelector(".takeover-note") ? document.querySelector(".takeover-note").innerText.replace(/\n+/g, " · ") : null,
    agentStamps: document.querySelectorAll("#passport-track .p-stamp.is-agent").length,
  })));
  step("result", await flow.overflow());
  await flow.shot("15-result.png");

  const sharedUrl = await page.locator("[data-share-url]").inputValue();
  step("share-length", sharedUrl.length);

  const audioState = await page.evaluate(() => ({
    enabled: window.CTM.audio.enabled,
    ctx: window.CTM.audio.ctxState,
  }));
  step("audio-after-play", audioState);

  const sharedPage = await context.newPage();
  sharedPage.on("pageerror", (error) => errors.push(`shared pageerror: ${error.message}`));
  await sharedPage.goto(sharedUrl, { waitUntil: "load" });
  await sharedPage.waitForTimeout(1400);
  const sharedInfo = await sharedPage.evaluate(() => ({
    banner: document.querySelector(".shared-banner") ? document.querySelector(".shared-banner").innerText.replace(/\n/g, " · ") : null,
    type: document.querySelector(".type-name") ? document.querySelector(".type-name").innerText : null,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  step("shared-page", sharedInfo);
  await sharedPage.screenshot({ path: path.join(shotsDir, "16-shared-result.png"), fullPage: true });
  await sharedPage.close();

  const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
  await page.click("[data-download]");
  const download = await downloadPromise;
  const posterPath = path.join(shotsDir, "poster.png");
  await download.saveAs(posterPath);
  step("poster-bytes", fs.statSync(posterPath).size);

  await page.click(".result-quote");
  await page.keyboard.type("1024");
  await page.waitForSelector("#screen-future.is-active", { timeout: 8000 });
  await page.waitForTimeout(2700);
  await page.screenshot({ path: path.join(shotsDir, "20-future.png") });
  step("future", await page.locator("#future-title").innerText());
  await page.click("#future-back");
  await page.waitForSelector("#screen-result.is-active", { timeout: 8000 });

  await page.click("#help-open");
  await page.waitForSelector("#modal-root:not([hidden]) .modal-card", { timeout: 8000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(shotsDir, "21-help.png") });
  await page.click(".modal-close");
  await page.waitForTimeout(300);

  // reload keeps progress
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1200);
  step("after-reload", await page.evaluate(() => ({
    completed: window.CTM.state.completed,
    stamps: window.CTM.state.stamps.length,
    continueVisible: !document.querySelector("#continue-wrap").hidden,
  })));

  return report;
}

async function runMobileFlow(options) {
  const { base, shotsDir, label, page, errors } = options;
  const flow = createFlow({ base, shotsDir, label, page, errors });
  const report = { label: label || "mobile", steps: [] };
  const step = (name, value) => {
    report.steps.push({ name, value });
    console.log(`[${report.label}] ${name}:`, JSON.stringify(value));
  };

  await page.goto(base, { waitUntil: "load" });
  await page.waitForTimeout(2400);
  step("landing", await flow.overflow());
  await flow.shot("17-mobile-landing.png");

  await page.fill("#traveler", "手机测试");
  await page.click("#start-btn");
  await flow.room("room-punch");
  step("era1", await flow.overflow());
  await flow.shot("18-mobile-era1.png");

  const target = await page.locator("[data-target-code]").innerText();
  for (let i = 0; i < 5; i += 1) {
    await page.click(`.hole[data-col="${i}"][data-bit="${target[i]}"]`);
  }
  await page.click("[data-read]");
  await page.waitForSelector("#era-continue", { timeout: 20000 });
  await page.waitForTimeout(600);
  step("continue-box", await page.evaluate(() => {
    const el = document.querySelector("#era-continue");
    const r = el.getBoundingClientRect();
    return {
      inViewport: r.top >= 0 && r.bottom <= window.innerHeight,
      width: Math.round(r.width),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      passportPosition: getComputedStyle(document.querySelector("#passport")).position,
    };
  }));
  await page.screenshot({ path: path.join(shotsDir, "19-mobile-stamp.png") });
  const mobileArchive = page.locator("[data-archive-accept]");
  if (await mobileArchive.isVisible().catch(() => false)) {
    await mobileArchive.click();
  } else {
    await page.click("#era-continue .ec-btn");
  }
  await flow.room("room-register");
  step("era2", await page.evaluate(() => {
    const plate = document.querySelector(".machine-plate");
    const desk = document.querySelector(".console-desk");
    return {
      plateTop: Math.round(plate.getBoundingClientRect().top),
      deskBelow: desk.getBoundingClientRect().top > plate.getBoundingClientRect().bottom,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  }));
  await flow.shot("23-mobile-era2.png");

  for (const width of [390, 360, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(300);
    const info = await flow.overflow();
    step(`width-${width}`, info);
  }

  return report;
}

module.exports = { runFlow, runMobileFlow, sleep };
