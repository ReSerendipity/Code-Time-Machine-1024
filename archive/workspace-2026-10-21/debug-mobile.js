const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.fill('#traveler', '手机测试');
  await page.click('#start-btn');
  await page.waitForSelector('#screen-era.is-active .era-shell', { timeout: 12000 });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const rect = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), display: getComputedStyle(el).display, position: getComputedStyle(el).position }; };
    return {
      docScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      mainScrollHeight: document.querySelector('#main').scrollHeight,
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      eraShell: rect('.era-shell'),
      scene: rect('.scene'),
      task: rect('.task-card'),
      panel: rect('.panel'),
      controls: rect('.panel-controls'),
      btnRow: rect('.panel-controls .btn-row'),
      readBtn: rect('[data-read]'),
      details: rect('.codebook'),
      passport: rect('#passport'),
      mainPaddingBottom: getComputedStyle(document.querySelector('#main')).paddingBottom,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  console.log('after scroll:', await page.evaluate(() => ({ scrollY: window.scrollY, max: document.documentElement.scrollHeight - innerHeight })));
  const readBox = await page.locator('[data-read]').boundingBox();
  console.log('read box after scroll:', readBox);
  await page.screenshot({ path: 'shots/19-mobile-era1-scrolled.png', fullPage: true });
  await page.click('[data-read]');
  await page.waitForTimeout(500);
  console.log('feedback:', await page.locator('[data-feedback]').innerText());
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
