// Quick clicks on the theme button (Arthur 2026-10-13, GEMCAP: "cliquei algumas vezes pra trocar o modo... o único jeito de
// voltar ao normal é recarregando"). While the View Transition crossfade runs, Chrome sends every click to <html>: repeat
// clicks were lost and a double click selected whatever sat under the pointer (the hero photo, painted in the selection
// colour). Clicks and double clicks at gaps from 0 to 400 ms, in Chrome and Edge: every click must flip the theme and
// nothing may end up selected.
// usage: node tools/theme-clicks.mjs <base>
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(path.join('C:/dev/web-toolbox', 'package.json'));
const { chromium } = require('playwright');
const [base] = process.argv.slice(2);
const PATTERNS = [[0], [30, 30], [60, 60, 60], [150, 30, 150], [220, 220], [300, 300, 300], [10, 10, 10, 10, 10, 10, 10], [5, 250, 5, 250, 5]];
let bad = 0;
for (const channel of ['chrome', 'msedge']) {
  const b = await chromium.launch({ channel, headless: false });   // headed: the crossfade timing is the real one
  for (const gaps of PATTERNS) for (const dbl of [false, true]) {
    const c = await b.newContext({ viewport: { width: 1534, height: 692 }, deviceScaleFactor: 1.25, colorScheme: 'light' });
    const p = await c.newPage();
    await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
    const bb = await p.locator('[data-theme-toggle]').first().boundingBox();
    const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2;
    let n = 0;
    for (const g of gaps) {
      if (dbl) { await p.mouse.dblclick(x, y); n += 2; } else { await p.mouse.click(x, y); n += 1; }
      await p.waitForTimeout(g);
    }
    await p.mouse.move(5, 300); await p.waitForTimeout(1200);
    const s = await p.evaluate(() => ({ theme: document.documentElement.dataset.theme, sel: getSelection().type }));
    const want = n % 2 ? 'dark' : 'light';
    const ok = s.theme === want && s.sel !== 'Range';
    if (!ok) bad++;
    console.log(ok ? 'ok  ' : 'FAIL', channel, dbl ? 'dbl  ' : 'click', JSON.stringify(gaps), `${n} clicks -> ${s.theme} (want ${want}), selection ${s.sel}`);
    await c.close();
  }
  await b.close();
}
console.log(bad ? `${bad} FAIL` : 'all ok');
process.exit(bad ? 1 : 0);
