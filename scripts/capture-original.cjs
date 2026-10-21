const { chromium } = require(process.env.TERMFX_PLAYWRIGHT || 'playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.TERMFX_CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    window.termAPI = { loadSettings: async () => ({provider:'offline',typingSound:false}), loadLibrary: async () => [] };
  });
  await page.goto('file:///C:/Users/ty0x7/.gemini/antigravity/scratch/termfx/src/index.html');
  await page.waitForTimeout(1600);
  fs.mkdirSync(path.join(__dirname, '../artifacts'), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, '../artifacts/original.png') });
  await browser.close();
})();
