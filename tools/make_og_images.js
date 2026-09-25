// Renders one 1200x630 Open Graph card per page into assets/og/, from the
// headlines in tools/og-pages.json. Same look as tools/og-card.html: cream
// page, Baloo 2 headline, Penny on the right.
//   NODE_PATH=$(npm root -g) node tools/make_og_images.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/og');
// Pass slugs as arguments to render only those cards.
const only = process.argv.slice(2);
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'og-pages.json'), 'utf8'))
  .filter(p => !only.length || only.includes(p.slug));
const penny = fs.readFileSync(path.join(ROOT, 'assets/penny.svg'), 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const card = p => `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1200px; height: 630px; }
  body { background: #fdf9f3; color: #1b1f3b; font: 24px/1.45 -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
         display: flex; align-items: center; overflow: hidden; position: relative; }
  body::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 14px; background: #8b5cf6; }
  .card { display: flex; align-items: center; gap: 40px; padding: 0 72px; width: 100%; }
  .left { flex: 1 1 auto; }
  .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-family: "Baloo 2", sans-serif; font-weight: 800; font-size: 30px; }
  .brand svg { width: 52px; height: 52px; }
  h1 { font-family: "Baloo 2", sans-serif; font-weight: 800; font-size: 66px; line-height: 1.06; letter-spacing: -0.01em; margin-bottom: 20px; }
  p { color: #6b7280; max-width: 600px; margin-bottom: 26px; }
  .pill { display: inline-block; background: #8b5cf6; color: #fff; font-family: "Baloo 2", sans-serif; font-weight: 700; font-size: 22px; padding: 12px 28px; border-radius: 999px; }
  .right { flex: 0 0 330px; height: 330px; border-radius: 50%; background: #ffe3e0; display: grid; place-items: center; }
  .right svg { width: 250px; height: 250px; }
</style></head><body><div class="card">
  <div class="left">
    <div class="brand">${penny}<span>Pocket Piggy</span></div>
    <h1>${esc(p.head)}</h1>
    ${p.sub ? `<p>${esc(p.sub)}</p>` : ''}
    <span class="pill">iPhone · iPad · Apple TV</span>
  </div>
  <div class="right">${penny}</div>
</div></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new' });
  for (const p of pages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(card(p), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, `${p.slug}.png`), type: 'png' });
    await page.close();
    console.log('wrote', p.slug);
  }
  await browser.close();
})();
