// Measure, don't squint. Reports each screenshot image's box against its
// container's content box, so "misaligned" becomes a number.
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/danielmilner/Coding Projects/pocketpiggy-site';
const TYPES = { '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml',
                '.jpg':'image/jpeg', '.png':'image/png' };

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

  for (const w of [1440, 1200, 1024, 900, 768, 640, 500, 390]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await page.goto('http://localhost:8099/index.html', { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
    await new Promise(r => setTimeout(r, 500));

    const rows = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('#screens .shot-row').forEach((row, ri) => {
        const rb = row.getBoundingClientRect();
        const figs = [...row.querySelectorAll('figure')].map(f => {
          const img = f.querySelector('img').getBoundingClientRect();
          const cap = f.querySelector('figcaption').getBoundingClientRect();
          return {
            src: f.querySelector('img').getAttribute('src').replace('assets/', ''),
            imgL: Math.round(img.left), imgR: Math.round(img.right),
            imgBottom: Math.round(img.bottom), imgH: Math.round(img.height),
            capLines: Math.round(cap.height / 22)
          };
        });
        out.push({ row: ri, rowL: Math.round(rb.left), rowR: Math.round(rb.right), figs });
      });
      return out;
    });

    console.log(`\n--- viewport ${w} ---`);
    for (const r of rows) {
      const centre = (r.rowL + r.rowR) / 2;
      for (const f of r.figs) {
        const figCentre = (f.imgL + f.imgR) / 2;
        console.log(`  row${r.row} ${f.src.padEnd(16)} L=${String(f.imgL).padStart(4)} R=${String(f.imgR).padStart(4)} h=${f.imgH} bottom=${f.imgBottom} capLines=${f.capLines} offCentre=${Math.round(figCentre - centre)}`);
      }
      if (r.figs.length > 1) {
        const bottoms = [...new Set(r.figs.map(f => f.imgBottom))];
        if (bottoms.length > 1) console.log(`  row${r.row} >>> IMAGE BOTTOMS DISAGREE: ${bottoms.join(' vs ')}`);
      }
    }
    await page.close();
  }
  await browser.close();
  server.close();
})();
