#!/usr/bin/env node
// The card a link to the site unfolds into (X, Slack, iMessage...): the home page itself, the
// cassette and its pencil on the desk among the filings, with the deck and the shelf taken away
// and the name written beside it in ballpoint. Shot from the static export, so build first:
//
//   pnpm build && pnpm og
//
// It writes public/og/marv1nnnnn.jpg (1200×630 at twice the pixels). Set
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to use a Chromium of your own.
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public', 'og', 'marv1nnnnn.jpg');
const port = Number(process.env.OG_PORT ?? 3917);

async function main() {
  if (!fs.existsSync(path.join(root, 'out', 'index.html'))) throw new Error('no static export: run pnpm build first');
  const server = spawn(process.execPath, [path.join(__dirname, 'serve-out.js')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  try {
    await new Promise((r) => setTimeout(r, 600));
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    const browser = await chromium.launch(executablePath ? { executablePath } : {});
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
    await page.addInitScript(() => {
      localStorage.setItem('tape-sound', 'off');
      // The desk is brightest at 3am by the visitor's clock: shoot it at two.
      Date.prototype.getHours = () => 2;
      Date.prototype.getMinutes = () => 0;
      // A headless browser draws WebGL in software, where the cassette draws small and without
      // shadows; say there is a GPU so it is drawn as a visitor sees it.
      for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) {
        const get = C.prototype.getParameter;
        C.prototype.getParameter = function (p) {
          return p === 0x9246 ? 'ANGLE (GPU)' : get.call(this, p);
        };
      }
    });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    await page.locator('.cassette-canvas.is-ready').waitFor({ timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: `
        .top, .cassette-hint, .home-bottom { display: none !important; }
        /* the cassette moves over to the right, a little smaller, to make room for the name */
        .cassette-canvas { transform: translateX(150px) scale(0.9); transform-origin: 600px 315px; }
        /* a little shade on the mat under the words, so the filings do not run through them */
        .og::before { content: ''; position: absolute; left: -120px; right: -60px; top: 22%; bottom: 22%; z-index: -1; background: radial-gradient(closest-side, rgba(var(--bg-rgb), 0.72), rgba(var(--bg-rgb), 0)); }
        .og { position: fixed; left: 64px; top: 0; bottom: 0; width: 470px; z-index: 50; display: flex; flex-direction: column; justify-content: center; color: var(--ink); }
        .og-kicker { font: 13px/1 'Courier Prime', monospace; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.55; margin: 0 0 18px; }
        .og-name { font: 122px/0.8 'Reenie Beanie', cursive; margin: 0 0 26px -6px; transform: rotate(-3deg); transform-origin: left; }
        .og-line { font: 19px/1.6 'Courier Prime', monospace; margin: 0; opacity: 0.92; }
        .og-tracks { font: 25px/1.2 'Reenie Beanie', cursive; margin: 26px 0 0; opacity: 0.7; word-spacing: 0.1em; }
        .og-tracks b { font-weight: 400; color: var(--accent); }
        .og-url { position: fixed; left: 64px; bottom: 40px; z-index: 50; font: 14px/1 'Courier Prime', monospace; letter-spacing: 0.12em; opacity: 0.5; color: var(--ink); }
      `,
    });
    await page.evaluate(() => {
      const card = document.createElement('div');
      card.className = 'og';
      card.innerHTML = `
        <p class="og-kicker">side A · C-60</p>
        <p class="og-name">marv1nnnnn</p>
        <p class="og-line">Marvin Ma. Product manager at YouWare.</p>
        <p class="og-line">Used to make noise in Beijing.</p>
        <p class="og-line">Building agents, mostly for myself.</p>
        <p class="og-tracks"><b>01</b> intro &nbsp;<b>02</b> make &nbsp;<b>03</b> input &nbsp;<b>04</b> log &nbsp;<b>05</b> about</p>`;
      const url = document.createElement('p');
      url.className = 'og-url';
      url.textContent = 'marv1nnnnn.com';
      document.body.append(card, url);
    });
    // let the filings settle and the cassette draw once more at its new size
    await page.waitForTimeout(5000);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, type: 'jpeg', quality: 90 });
    await browser.close();
    console.log(`wrote ${path.relative(root, out)}`);
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
