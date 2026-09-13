// Renders the local site at desktop and mobile widths so layout problems
// can be seen rather than guessed at. Serves from disk on a local port so
// relative asset paths resolve exactly as they do on GitHub Pages.
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
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(8099, r));
  const browser = await puppeteer.launch({ headless: 'new' });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900, dsf: 2 },
    { name: 'laptop-1024',  width: 1024, height: 768, dsf: 2 },
    { name: 'tablet-768',   width: 768,  height: 1024, dsf: 2 },
    { name: 'mobile-390',   width: 390,  height: 844, dsf: 3 },
    { name: 'mobile-320',   width: 320,  height: 568, dsf: 3 }
  ];

  for (const page_name of ['index', 'privacy']) {
    for (const v of viewports) {
      const page = await browser.newPage();
      await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: v.dsf });
      await page.goto(`http://localhost:8099/${page_name}.html`, { waitUntil: 'networkidle0' });
      // Force lazy images to load so the screenshot shows the real page.
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 600));
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 400));

      // Horizontal overflow is the classic mobile break: report any element
      // wider than the viewport rather than relying on spotting it by eye.
      const diag = await page.evaluate((vw) => {
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
            bad.push(`${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ').join('.') : ''} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
          }
        });
        return { scrollW: document.documentElement.scrollWidth, overflow: [...new Set(bad)].slice(0, 8) };
      }, v.width);

      console.log(`${page_name} ${v.name}: scrollWidth=${diag.scrollW} (viewport ${v.width})`);
      diag.overflow.forEach(o => console.log(`    OVERFLOW ${o}`));

      await page.screenshot({ path: `${OUT}/${page_name}-${v.name}.png`, fullPage: true });
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log('done ->', OUT);
})();
