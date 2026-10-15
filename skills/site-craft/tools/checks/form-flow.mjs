// Behaviour check of the multi-step intake form (site-craft/reference/forms.md). Chromium + WebKit, phone 390 + desktop
// 1534, light + dark. Fails (exit 1) on any broken rule:
//  1 a one-tap step ([data-auto]) shows no Next until answered; a tap advances by itself; the step label updates
//  2 Back is visible from step 2 and readable on the card (text contrast >= 4.5:1 against the card)
//  3 Back keeps the answer, shows Next, and a tap on the kept answer advances again
//  4 arrow keys only move the choice (no jump); Enter then advances
//  5 after a step change, focus is on the step's question (legend/label), not an input; the card top is not under the nav
//  6 a page with a preset (practice pages) shows Next on step 1
// usage: node tools/form-flow.mjs <base> [route=/] [presetRoute=/license-defense/] [outDir]
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(path.join('C:/dev/web-toolbox', 'package.json'));
const pw = require('playwright');
const [base, route = '/', presetRoute = '/license-defense/', outDir = ''] = process.argv.slice(2);
if (outDir) fs.mkdirSync(outDir, { recursive: true });
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

async function openForm(page, r) {
  await page.goto(base + r, { waitUntil: 'networkidle' });
  const cta = page.locator('a[href="#case-review"]:visible');
  if (await cta.count()) await cta.first().click();   // the contact page has the form in place, no CTA to it
  await page.waitForSelector('form[data-form] .form-step[data-step="1"] input', { state: 'attached' });
  await page.locator('form[data-form]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);   // the CTA's own scroll
  return page.locator('form[data-form]').first();
}
const visibleStep = form => form.locator('.form-step:not([hidden])').getAttribute('data-step');

for (const [engine, bt] of [['chromium', pw.chromium], ['webkit', pw.webkit]]) {
  const browser = await bt.launch();
  for (const scheme of ['light', 'dark']) for (const [w, h] of [[390, 844], [1534, 692]]) {
    const tag = `${engine} ${scheme} ${w}`;
    const page = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, hasTouch: w < 1024, isMobile: engine === 'chromium' && w < 1024 });
    const form = await openForm(page, route);
    const s1 = form.locator('.form-step[data-step="1"]');
    ok(await s1.locator('[data-auto-next]').isHidden(), `${tag}: step 1 shows Next before any answer`);
    ok(await form.locator('[data-back]').isHidden(), `${tag}: Back visible on step 1`);
    // 1 tap advances
    await s1.locator('label.chip').nth(1).click();
    await page.waitForTimeout(450);
    ok(await visibleStep(form) === '2', `${tag}: a tap on step 1 did not advance (step ${await visibleStep(form)})`);
    ok(/Step 2 of 3/.test(await form.locator('[data-step-label]').innerText()), `${tag}: step label not updated`);
    // 5 focus + card top
    const foc = await page.evaluate(() => { const a = document.activeElement; return a ? a.tagName + '.' + a.className : ''; });
    ok(/^(LEGEND|LABEL)/.test(foc), `${tag}: focus after the step change is on ${foc}`);
    await page.waitForTimeout(500);   // a smooth re-aim may still be running
    const top = await form.evaluate(f => { const nav = document.querySelector('.site-nav .nav') || document.querySelector('.site-nav'); return [f.querySelector('.form-card__head').getBoundingClientRect().top, nav ? nav.getBoundingClientRect().bottom : 0]; });
    ok(top[0] >= top[1], `${tag}: card head under the nav after the step change (head ${top[0].toFixed(0)} < nav bottom ${top[1].toFixed(0)})`);
    // 2 Back readable
    const back = form.locator('[data-back]');
    ok(await back.isVisible(), `${tag}: Back not visible on step 2`);
    const [fg, bg] = await back.evaluate(b => { const card = b.closest('.form-card'); return [getComputedStyle(b).color, getComputedStyle(card).backgroundColor]; });
    ok(ratio(fg, bg) >= 4.5, `${tag}: Back contrast ${ratio(fg, bg).toFixed(2)}:1 (${fg} on ${bg})`);
    if (outDir) await form.screenshot({ path: path.join(outDir, `${engine}-${scheme}-${w}-step2.png`) });
    // 3 Back keeps the answer; a tap on it advances
    await back.click(); await page.waitForTimeout(300);
    ok(await visibleStep(form) === '1', `${tag}: Back did not return to step 1`);
    ok(await s1.locator('input:checked').count() === 1, `${tag}: Back lost the answer`);
    ok(await s1.locator('[data-auto-next]').isVisible(), `${tag}: Next not shown after Back on a one-tap step`);
    await s1.locator('label.chip').nth(1).click();
    await page.waitForTimeout(450);
    ok(await visibleStep(form) === '2', `${tag}: a tap on the kept answer did not advance`);
    // 4 keys (desktop only: phones have no arrow keys)
    if (w >= 1024) {
      await back.click(); await page.waitForTimeout(300);
      await s1.locator('input:checked').focus();
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400);
      ok(await visibleStep(form) === '1', `${tag}: an arrow key advanced the step`);
      await page.keyboard.press('Enter'); await page.waitForTimeout(400);
      ok(await visibleStep(form) === '2', `${tag}: Enter after an arrow key did not advance`);
    }
    await page.close();
    // 6 preset
    const p2 = await browser.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    const f2 = await openForm(p2, presetRoute);
    ok(await f2.locator('.form-step[data-step="1"] [data-auto-next]').isVisible(), `${tag}: preset page hides Next on step 1`);
    await p2.close();
  }
  await browser.close();
}
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'form flow: all checks pass');
process.exit(fails.length ? 1 : 0);
