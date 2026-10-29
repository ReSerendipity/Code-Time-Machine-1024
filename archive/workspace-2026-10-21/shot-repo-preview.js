const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8080/github-repo/docs/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  console.log('title:', await page.title());
  console.log('hero:', await page.locator('.hero-title').innerText());
  await page.screenshot({ path: 'shots/24-github-pages-preview.png', fullPage: true });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
