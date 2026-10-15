// Do headlines keep their line breaks while the web fonts are still on the way? (Arthur 2026-10-12: the home H1 broke in
// 4 lines on the iPhone after a reload and in 3 after a scroll.) WebKit - Safari and every iPhone browser - matches
// local() by FAMILY name, so a fallback face listing only full names ('Georgia Italic') fails there and the text falls to
// the raw system font, wider than the metric-matched one; iOS then kept the stale layout until a scroll.
// usage: node tools/font-fallback.mjs [url=http://localhost:8741/] [route...]
// 1 · every "* Fallback" @font-face must load in WebKit and in Chromium;
// 2 · at 360/390/414 in WebKit, with every .woff2 held back 3 s, each h1/h2/.lead keeps the same line count once the
//     fonts land. One line per problem; exit 1 when any.
import { createRequire } from 'module';
const require = createRequire('C:/dev/web-toolbox/');
const { webkit, chromium } = require('playwright');

const base = (process.argv[2] || 'http://localhost:8741').replace(/\/$/, '');
const routes = process.argv.slice(3).length ? process.argv.slice(3) : ['/'];
let problems = 0;
const say = m => { problems++; console.log(m); };

for (const [name, eng] of [['webkit', webkit], ['chromium', chromium]]) {
  const b = await eng.launch(); const p = await (await b.newContext()).newPage();
  await p.goto(base + routes[0], { waitUntil: 'load' });
  const faces = await p.evaluate(async () => {
    const fb = [...document.fonts].filter(f => /fallback/i.test(f.family));
    await Promise.allSettled(fb.map(f => f.load()));
    return fb.map(f => ({ face: `${f.family} ${f.weight} ${f.style}`, status: f.status }));
  });
  for (const f of faces) if (f.status !== 'loaded') say(`${name}: fallback face "${f.face}" did not load (${f.status}): end its src with local('<family>')`);
  await b.close();
}

const lines = () => [...document.querySelectorAll('h1, h2, .lead')].filter(e => e.getClientRects().length).map(e => {
  const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2;
  return { key: (e.id || e.tagName) + ': ' + e.textContent.trim().slice(0, 40), n: Math.round(e.getBoundingClientRect().height / lh) };
});
const b = await webkit.launch();
for (const route of routes) for (const w of [360, 390, 414]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true })).newPage();
  await p.route(/\.woff2(\?|$)/, async r => { await new Promise(s => setTimeout(s, 3000)); await r.continue(); });
  await p.goto(base + route, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500);
  const early = await p.evaluate(lines);
  await p.waitForTimeout(3500); await p.evaluate(() => document.fonts.ready);
  const late = await p.evaluate(lines);
  early.forEach((e, i) => { const l = late[i]; if (l && l.key === e.key && l.n !== e.n) say(`webkit ${w} ${route} "${e.key}": ${e.n} lines on the fallback, ${l.n} with the web font`); });
  await p.context().close();
}
await b.close();
console.log(problems ? `${problems} font fallback problem(s)` : 'font fallbacks OK');
process.exit(problems ? 1 : 0);
