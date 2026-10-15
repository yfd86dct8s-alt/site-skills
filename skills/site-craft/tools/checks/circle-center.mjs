// Is the number centred in its circle? (Arthur 2026-10-12, iPhone: "os números no círculo estão descentralizados" -
// Newsreader's figures sit ~0.1em high in a 1em line box.) Shoots each numbered disc at 3x in WebKit and Chromium and
// measures the digit's ink box against the disc's own centre (tools/circle_center.py). Fails above 1.25 CSS px.
// usage: node tools/circle-center.mjs <base> [route=selector=size ...]  (defaults: home steps, DBPR timeline, contact steps)
import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(path.join('C:/dev/web-toolbox', 'package.json'));
const { webkit, chromium } = require('playwright');
const [base, ...specs] = process.argv.slice(2);
const targets = (specs.length ? specs : ['/=#how .how__steps li=40', '/license-defense/dbpr/=.process-band .timeline li=34', '/contact/=.how__steps--compact li=34']).map(s => s.split('='));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'circles-'));
const py = path.join(path.dirname(fileURLToPath(import.meta.url)), 'circle_center.py');
let bad = 0;
for (const [n, e] of [['webkit', webkit], ['chromium', chromium]]) {
  const b = await e.launch(); const p = await b.newPage({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  for (const [route, sel, sz] of targets) {
    await p.goto(base + route, { waitUntil: 'networkidle' });
    const lis = p.locator(sel); const count = Math.min(await lis.count(), 6);
    for (let i = 0; i < count; i++) {
      const li = lis.nth(i); await li.scrollIntoViewIfNeeded();
      const bb = await li.boundingBox();
      const top = await li.evaluate(el => parseFloat(getComputedStyle(el, '::before').top) || 0);
      const f = path.join(dir, `${n}-${i}.png`);
      await p.screenshot({ path: f, clip: { x: bb.x - 2, y: bb.y + top - 2, width: +sz + 4, height: +sz + 4 } });
      const [dy, dx] = execFileSync('python', ['-I', py, f]).toString().trim().split(' ').map(Number);
      const off = Math.max(Math.abs(dy), Math.abs(dx));
      if (off > 1.25) { bad++; console.log(`${n} ${route} ${sel} #${i + 1}: digit off centre by dy ${dy} dx ${dx} px`); }
    }
  }
  await b.close();
}
console.log(bad ? `${bad} digit(s) off centre` : 'every digit centred in its circle (<= 1.25px)');
process.exit(bad ? 1 : 0);
