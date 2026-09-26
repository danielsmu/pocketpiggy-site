// Generates the printable weekly chore charts in assets/printables/:
// for every age in chores.json, a chart pre-filled with that age's top
// chores and a blank one, each in US Letter and A4, portrait.
//
//   cd tools/printables && npm install && npx playwright install chromium
//   npm run build
//
// Every chart must fit on exactly one page; the script stops with an error
// if anything overflows.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'printables');
const { ages } = JSON.parse(fs.readFileSync(path.join(__dirname, 'chores.json'), 'utf8'));
const penny = fs.readFileSync(path.join(ROOT, 'assets', 'penny.svg'), 'utf8');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PAPERS = {
  letter: { format: 'Letter', w: '8.5in', h: '11in' },
  a4: { format: 'A4', w: '210mm', h: '297mm' },
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function chart(age, kind, paper) {
  const p = PAPERS[paper];
  const chores = kind === 'filled' ? age.top : [];
  const rows = Array.from({ length: age.rows }, (_, i) => chores[i] || '');
  // Fewer rows means bigger boxes: little ones get room to make a big mark.
  const box = age.rows <= 6 ? 34 : age.rows <= 8 ? 28 : age.rows <= 10 ? 24 : 21;
  const body = rows.map(c => `<tr><th scope="row">${c ? esc(c) : '<span class="write"></span>'}</th>${DAYS.map(() => '<td><span class="box"></span></td>').join('')}</tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: ${p.w} ${p.h}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${p.w}; height: ${p.h}; }
  body { font: 11pt/1.3 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #1b1f3b; background: #fff; }
  .sheet { width: ${p.w}; height: ${p.h}; padding: 0.5in 0.5in 0.4in; display: flex; flex-direction: column; overflow: hidden; }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  h1 { font-family: "Baloo 2", sans-serif; font-weight: 800; font-size: 34pt; line-height: 1; letter-spacing: -0.01em; }
  .age { display: inline-block; margin-top: 6px; font-family: "Baloo 2", sans-serif; font-weight: 700; font-size: 12pt; color: #7c3aed; background: #f4f0fe; border-radius: 999px; padding: 2px 12px; }
  .penny { width: 0.95in; height: 0.95in; flex: 0 0 auto; }
  .penny svg { width: 100%; height: 100%; }
  .fields { display: flex; gap: 28px; margin: 18px 0 16px; font-family: "Baloo 2", sans-serif; font-weight: 700; font-size: 13pt; }
  .fields div { flex: 1; display: flex; align-items: flex-end; gap: 8px; }
  .fields .line { flex: 1; border-bottom: 1.5px solid #1b1f3b; height: 1.1em; }
  .fields .name { flex: 1.6; }
  table { width: 100%; flex: 1; border-collapse: separate; border-spacing: 0; table-layout: fixed; border: 1.5px solid #cdbffa; border-radius: 14px; overflow: hidden; }
  col.chore { width: 31%; }
  thead th { background: #f4f0fe; font-family: "Baloo 2", sans-serif; font-weight: 700; font-size: 12.5pt; height: 0.42in; text-align: center; border-bottom: 1.5px solid #cdbffa; }
  thead th:first-child { text-align: left; padding-left: 12px; }
  tbody th { text-align: left; font-weight: 600; font-size: ${age.rows <= 6 ? 14 : 11.5}pt; padding: 4px 10px 4px 12px; border-top: 1px solid #e7e0fb; vertical-align: middle; }
  tbody td { text-align: center; vertical-align: middle; border-top: 1px solid #e7e0fb; border-left: 1px solid #efeafc; }
  tbody tr:first-child th, tbody tr:first-child td { border-top: 0; }
  .box { display: inline-block; width: ${box}px; height: ${box}px; border: 1.8px solid #b9a6f7; border-radius: 7px; }
  .write { display: block; border-bottom: 1px dashed #c9c3d9; height: 1.2em; margin-right: 6px; }
  tfoot th, tfoot td { background: #fdf6e7; border-top: 1.5px solid #cdbffa; height: 0.62in; vertical-align: middle; }
  tfoot th { font-family: "Baloo 2", sans-serif; font-weight: 800; font-size: 15pt; text-align: left; padding-left: 12px; color: #b7791f; }
  tfoot td { font-family: "Baloo 2", sans-serif; font-weight: 700; font-size: 13pt; padding-left: 14px; text-align: left; }
  tfoot .amt { display: inline-block; width: 1.6in; border-bottom: 1.5px solid #1b1f3b; margin-left: 6px; }
  footer { margin-top: 10px; display: flex; justify-content: space-between; font-size: 8.5pt; color: #8a8fa8; }
</style></head><body><div class="sheet">
  <header>
    <div><h1>My Chore Chart</h1><span class="age">${esc(age.label)}</span></div>
    <div class="penny">${penny}</div>
  </header>
  <div class="fields"><div class="name">Name <span class="line"></span></div><div>Week of <span class="line"></span></div></div>
  <table>
    <colgroup><col class="chore">${DAYS.map(() => '<col>').join('')}</colgroup>
    <thead><tr><th scope="col">Chore</th>${DAYS.map(d => `<th scope="col">${d}</th>`).join('')}</tr></thead>
    <tbody>${body}</tbody>
    <tfoot><tr><th scope="row">Pay Day</th><td colspan="7">Earned this week: $<span class="amt"></span></td></tr></tfoot>
  </table>
  <footer><span>Tick a box each time the chore is done.</span><span>pocketpiggy.app</span></footer>
</div></body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const made = [];
  for (const age of ages) for (const kind of ['filled', 'blank']) for (const paper of Object.keys(PAPERS)) {
    await page.setContent(chart(age, kind, paper), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // A chore that wraps to two lines would otherwise make its row taller
    // than the rest; share the table body's height out evenly instead.
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('tbody tr')];
      const total = rows.reduce((h, r) => h + r.getBoundingClientRect().height, 0);
      rows.forEach(r => { r.style.height = (total / rows.length) + 'px'; });
    });
    // Nothing may spill past the page: the sheet is exactly one page tall.
    const fit = await page.evaluate(() => {
      const s = document.querySelector('.sheet');
      return { over: s.scrollHeight - s.clientHeight, doc: document.documentElement.scrollHeight - s.clientHeight };
    });
    if (fit.over > 0 || fit.doc > 1) throw new Error(`${age.slug} ${kind} ${paper} overflows by ${fit.over}px`);
    const name = `chore-chart-${age.slug}${kind === 'blank' ? '-blank' : ''}-${paper}.pdf`;
    const pdf = await page.pdf({ format: PAPERS[paper].format, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    if (pages !== 1) throw new Error(`${name} has ${pages} pages`);
    fs.writeFileSync(path.join(OUT, name), pdf);
    made.push(name);
  }
  await browser.close();
  console.log(`wrote ${made.length} PDFs to assets/printables/`);
})().catch(e => { console.error(e.message); process.exit(1); });
