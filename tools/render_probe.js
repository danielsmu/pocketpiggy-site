// Second pass: rule out fullPage screenshot artifacts by reporting the real
// document height and stitching nothing -- capture at dsf 1, no scrolling.
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/danielmilner/Coding Projects/pocketpiggy-site';
const OUT = '/Users/danielmilner/Desktop/site-render';
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
                '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(8099, r));
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle0' });

  const info = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    heroCount: document.querySelectorAll('.hero').length,
    sectionCount: document.querySelectorAll('section').length,
    h1s: [...document.querySelectorAll('h1')].map(h => h.textContent.trim())
  }));
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: `${OUT}/probe-mobile-390.png`, fullPage: true });

  // Also capture just the screenshots section, which is the part most likely
  // to be the actual complaint.
  const el = await page.$('#screens');
  await el.screenshot({ path: `${OUT}/probe-mobile-screens.png` });

  await browser.close();
  server.close();
  console.log('ok');
})();
