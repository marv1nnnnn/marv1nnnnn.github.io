#!/usr/bin/env node
// The card a link to /woji/ unfolds into: the department's name on the left and one of its price
// tags on the right, with the buttons and the shelf history taken away. The page is one file, so
// it is shot straight from public/, no build needed:
//
//   node scripts/woji-og.js
//
// It writes public/woji/og.jpg (1200×630 at twice the pixels). Set
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to use a Chromium of your own.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('@playwright/test');

const page_ = path.resolve(__dirname, '..', 'public', 'woji', 'index.html');
const out = path.resolve(__dirname, '..', 'public', 'woji', 'og.jpg');

async function main() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  const url = pathToFileURL(page_).href;
  await page.goto(`${url}#a`);
  // a product that reads at a glance: herbs stewed into something sweet (not the real one)
  const seed = await page.evaluate(() => {
    for (let i = 0; i < 5000; i++) {
      const s = `og${i.toString(36)}`, p = draw(s);
      if (/^天麻炖鸽子/.test(p.name)) continue;
      if (/炖.+味(雪糕|冰淇淋|软糖|薯片)$/.test(p.name) && p.name.length <= 9 && p.badge === '新品') return s;
    }
    return 'k3x9q2';
  });
  await page.goto(`${url}#${seed}`);
  await page.addStyleTag({
    content: `
      body { flex-direction: row; align-items: center; justify-content: center; gap: 48px; height: 630px; min-height: 0; padding: 0 56px; overflow: hidden; }
      .top, .actions, .hint, .history, footer, .toast { display: none !important; }
      header { width: 360px; margin: 0; }
      h1 { font-size: 46px; }
      h1 small { margin: 10px 0 0; }
      header p { font-size: 19px; }
      .shelf { width: 640px; }
      .tag.swing { animation: none; }
    `,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
  console.log(`${path.relative(process.cwd(), out)}: ${await page.textContent('#name')} (#${seed})`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
