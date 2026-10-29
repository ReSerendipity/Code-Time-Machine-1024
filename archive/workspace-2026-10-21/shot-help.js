const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.click('#help-open');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/21-help.png' });
  console.log('help text:', (await page.locator('.modal-card').innerText()).slice(0, 200));
  await page.click('.modal-close');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
