// Walks the intake form to step 2 and step 3 on a page and screenshots the form card each time, light + dark, phone +
// desktop. Also prints each visible button's text/background/border colour, so an invisible button shows up in numbers.
// usage: node tools/form-steps.mjs <base> <route> <outDir>
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(path.join('C:/dev/web-toolbox', 'package.json'));
const { chromium } = require('playwright');
const [base, route, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1534, 692]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.locator('a[href="#case-review"]:visible').first().click();
  await page.waitForSelector('form .form-step[data-step="1"] input', { state: 'attached' });
  const form = page.locator('form').filter({ has: page.locator('.form-step') }).first();
  await form.locator('.form-step[data-step="1"] label').first().click();
  const n1 = form.locator('.form-step[data-step="1"] [data-next]');
  if (await n1.isVisible()) await n1.click();   // a one-tap step advances by itself (forms.md)
  await page.waitForTimeout(450);
  for (const step of [2, 3]) {
    const st = form.locator(`.form-step[data-step="${step}"]`);
    const info = await form.locator('.form-card__head [data-back], .form-step:not([hidden]) .form-card__foot button').evaluateAll(bs => bs.map(b => { const c = getComputedStyle(b); return `${b.textContent.trim()} [fg ${c.color} bg ${c.backgroundColor} border ${c.borderColor} ${c.borderWidth}]`; }));
    console.log(scheme, w, 'step', step, info.join(' | '));
    await form.screenshot({ path: path.join(outDir, `form-${scheme}-${w}-step${step}.png`) });
    if (step === 2) {
      // fill what step 2 requires so Next works: every visible required field gets a plausible value
      for (const el of await st.locator('input:visible, select:visible, textarea:visible').all()) {
        const t = await el.evaluate(e => e.type || e.tagName.toLowerCase());
        if (t === 'radio' || t === 'checkbox') { await el.check({ force: true }).catch(() => {}); }
        else if (t === 'select-one' || t === 'select') { await el.selectOption({ index: 1 }).catch(() => {}); }
        else await el.fill('test').catch(() => {});
      }
      await st.locator('[data-next]').click();
      await page.waitForTimeout(200);
    }
  }
  await page.close();
}
await browser.close();
