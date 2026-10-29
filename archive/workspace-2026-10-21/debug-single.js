const { chromium } = require('playwright-core');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const messages = [];
  page.on('pageerror', e => messages.push('PAGEERROR: ' + e.message));
  page.on('console', m => messages.push(m.type() + ': ' + m.text()));
  const fileUrl = pathToFileURL(path.join(__dirname, 'code-time-machine.html')).href;
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({
    hasCTM: !!window.CTM,
    eras: window.CTM ? window.CTM.eras.length : null,
    boot: document.querySelector('#boot-log')?.textContent,
    active: document.querySelector('.screen.is-active')?.id,
    href: location.href,
    storageOk: (() => { try { localStorage.setItem('t','1'); return true; } catch(e) { return String(e); } })(),
  }));
  console.log('before:', JSON.stringify(before, null, 2));
  await page.fill('#traveler', '离线测试');
  await page.click('#start-btn');
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({
    hasCTM: !!window.CTM,
    state: window.CTM ? { started: window.CTM.state.started, era: window.CTM.state.eraIndex } : null,
    active: document.querySelector('.screen.is-active')?.id,
    href: location.href,
    tunnelHidden: document.querySelector('#tunnel')?.hidden,
    eraHTML: document.querySelector('#era-root')?.innerHTML.slice(0, 120),
    toast: document.querySelector('#toast')?.textContent,
  }));
  console.log('after:', JSON.stringify(after, null, 2));
  console.log('messages:', messages);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
