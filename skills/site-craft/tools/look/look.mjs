// look - the quick look after every section (site-craft SKILL.md, Moment 1). Arthur 2026-10-14: the agent should see what
// it builds, so obvious mistakes don't slip by. The ledger (site-craft known-mistakes.md) showed the misses were never
// "could not see" but "looked at the wrong state": dark theme, desktop, a later form step, hover, after a reload. So this
// renders the states where those bugs lived, flags the obvious ones automatically and writes one contact sheet to look at.
//
// usage: node .claude/skills/site-craft/tools/look/look.mjs <base> [routes=/] [options]          (Git Bash: MSYS_NO_PATHCONV=1 for "/" routes)
//   routes        comma-separated paths, e.g. /,/contact/
//   --el <css>    section mode: shoot only this element and scope the checks to it (the normal per-section call)
//   --hover <css> also shoot the first match of each selector hovered (desktop), e.g. ".card,.btn--primary"
//   --states <f>  module exporting `states`: [{ name, run: async (page, view) => {} }] for site states (form steps...)
//   --wide        add 360, 414 (WebKit) and 768 (Chromium) to the default 390 WebKit + 1534x692 Chromium
//   --schemes     light,dark (default) or one of them
//   --out <dir>   output folder (default: %TEMP%/look/<timestamp>)
// Output: FAIL/warn lines per view, sheet.png (all shots side by side) + each shot. Exit 1 if anything FAILs.
//
// Automatic checks per view: horizontal page overflow (+ the elements causing it), page/console errors and 4xx/5xx,
// broken images, overlapping text, text cut by its box, text contrast (4.5:1, 3:1 large; text over photos skipped),
// fully visible duplicated text blocks (warn), touch targets under 24px on phones (warn), heading boxes that change
// after scroll + reload in WebKit (the iPhone font-fallback bug).
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
const require = createRequire(path.join('C:/dev/web-toolbox', 'package.json'));
const { chromium, webkit } = require('playwright');

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && argv[i - 1] !== '--wide'));
const [base, routesArg = '/'] = pos;
if (!base) { console.error('usage: node .claude/skills/site-craft/tools/look/look.mjs <base> [routes] [--el css] [--hover css] [--states file] [--wide] [--out dir]'); process.exit(2); }
const EL = opt('--el'), HOVER = opt('--hover'), SCHEMES = opt('--schemes', 'light,dark').split(',');
const OUT = path.resolve(opt('--out', path.join(os.tmpdir(), 'look', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19))));
const STATES = opt('--states') ? (await import(pathToFileURL(path.resolve(opt('--states'))).href)).states : [];
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: '390', engine: 'webkit', w: 390, h: 844, dsf: 2, mobile: true },
  { name: '1534', engine: 'chromium', w: 1534, h: 692, dsf: 1.25, mobile: false },
];
if (argv.includes('--wide')) VIEWS.splice(0, 0,
  { name: '360', engine: 'webkit', w: 360, h: 780, dsf: 2, mobile: true },
  { name: '414', engine: 'webkit', w: 414, h: 896, dsf: 2, mobile: true },
  { name: '768', engine: 'chromium', w: 768, h: 1024, dsf: 2, mobile: true });

// ---------------------------------------------------------------- in-page checks (run inside the browser)
function pageChecks({ scope, mobile }) {
  const root = scope ? document.querySelector(scope) : document.body;
  if (!root) return { fail: [`--el ${scope} not found`], warn: [] };
  const fail = [], warn = [], vw = document.documentElement.clientWidth;
  const label = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ([...el.classList].slice(0, 2).map(c => '.' + c).join(''));
  const hiddenByAria = el => el.closest('[aria-hidden="true"], [inert], template, noscript, .visually-hidden, .sr-only, .skip-link');
  const visible = el => el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true;
  const scrolls = s => /(auto|scroll)/.test(s.overflowX);
  // the visible part of a rect after every clipping ancestor (null = fully clipped)
  const clipRect = (el, r) => {
    let { left, top, right, bottom } = r;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX === 'visible' && s.overflowY === 'visible' && s.clipPath === 'none' && s.contain.indexOf('paint') < 0) continue;
      const c = a.getBoundingClientRect();
      if (s.overflowX !== 'visible') { left = Math.max(left, c.left); right = Math.min(right, c.right); }
      if (s.overflowY !== 'visible') { top = Math.max(top, c.top); bottom = Math.min(bottom, c.bottom); }
      if (right - left < 1 || bottom - top < 1) return null;
    }
    return { left, top, right, bottom };
  };

  // 1. horizontal page overflow and its culprits (children of intentional swipe rows skipped)
  if (!scope) {
    const sw = document.documentElement.scrollWidth;
    if (sw > vw + 1) {
      const culprits = [];
      for (const el of document.body.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width && r.right > vw + 1 && !hiddenByAria(el)) {
          let skip = false; for (let a = el.parentElement; a; a = a.parentElement) if (scrolls(getComputedStyle(a))) { skip = true; break; }
          if (!skip) culprits.push(`${label(el)} right=${Math.round(r.right)}`);
        }
      }
      fail.push(`page is ${sw}px wide in a ${vw}px viewport: ${culprits.slice(0, 5).join(', ')}`);
    }
  }

  const fixedCache = new Map();
  const fixedAncestor = el => { if (!el || el === document.body) return false; if (fixedCache.has(el)) return fixedCache.get(el);
    const p = getComputedStyle(el).position; const v = p === 'fixed' || p === 'sticky' || fixedAncestor(el.parentElement); fixedCache.set(el, v); return v; };
  // collect visible text line boxes
  const lines = [], owners = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode; const txt = t.textContent.trim(); if (!txt) continue;
    const el = t.parentElement; if (!el || hiddenByAria(el) || !visible(el)) continue;
    if (el.closest('svg, script, style, option, select, textarea, input, details:not([open]) > :not(summary)')) continue;
    const rg = document.createRange(); rg.selectNodeContents(t);
    for (const r of rg.getClientRects()) {
      if (r.width < 2 || r.height < 4) continue;
      const c = clipRect(el, r); if (!c) continue;
      lines.push({ el, txt, r, c, fixed: fixedAncestor(el) });
    }
    owners.set(el, (owners.get(el) || '') + ' ' + txt);
  }

  // 2. overlapping text (two different elements' line boxes painting over each other)
  const byTop = lines.filter(l => (l.c.right - l.c.left) * (l.c.bottom - l.c.top) > 20).sort((a, b) => a.c.top - b.c.top);
  const seenPair = new Set();
  for (let i = 0; i < byTop.length; i++) for (let j = i + 1; j < byTop.length && byTop[j].c.top < byTop[i].c.bottom; j++) {
    const a = byTop[i], b = byTop[j]; if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
    if (a.fixed || b.fixed) continue;   // sticky nav, action bar, review panel: overlap scrolling content by design
    const ix = Math.min(a.c.right, b.c.right) - Math.max(a.c.left, b.c.left), iy = Math.min(a.c.bottom, b.c.bottom) - Math.max(a.c.top, b.c.top);
    if (ix <= 0 || iy <= 0) continue;
    const small = Math.min((a.c.right - a.c.left) * (a.c.bottom - a.c.top), (b.c.right - b.c.left) * (b.c.bottom - b.c.top));
    if (ix * iy < 0.25 * small) continue;
    const k = label(a.el) + '|' + label(b.el); if (seenPair.has(k)) continue; seenPair.add(k);
    fail.push(`text overlaps: ${label(a.el)} "${a.txt.slice(0, 30)}" and ${label(b.el)} "${b.txt.slice(0, 30)}" at y=${Math.round(a.c.top + scrollY)}`);
  }

  // 3. text cut by its own box or cut top/bottom by an ancestor (horizontal cuts are usually swipe rows/marquees: skipped)
  const cut = new Set();
  for (const l of lines) {
    const s = getComputedStyle(l.el);
    const intentional = s.textOverflow === 'ellipsis' || (s.webkitLineClamp && s.webkitLineClamp !== 'none');
    if (!intentional && /(hidden|clip)/.test(s.overflowX + s.overflowY) && (l.el.scrollWidth > l.el.clientWidth + 1 || l.el.scrollHeight > l.el.clientHeight + 2)) cut.add(`${label(l.el)} "${l.txt.slice(0, 40)}" (own box)`);
    else if (!intentional && (l.c.top > l.r.top + 2 || l.c.bottom < l.r.bottom - 2) && l.c.bottom - l.c.top > 2) cut.add(`${label(l.el)} "${l.txt.slice(0, 40)}" (cut top/bottom)`);
  }
  for (const c of [...cut].slice(0, 8)) fail.push('text cut: ' + c);

  // 4. contrast (text over an image/photo is skipped: the hero has its own measured check)
  const parse = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const lowC = [];
  for (const el of owners.keys()) {
    const cs = getComputedStyle(el), fg = parse(cs.color); if (!fg || fg.a < 0.1) continue;
    let bg = null, img = false;
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if ((s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) || a.tagName === 'PICTURE' || a.querySelector?.(':scope > picture, :scope > img, :scope > video')) { img = true; break; }
      const c = parse(s.backgroundColor); if (c && c.a > 0.5) { bg = c; break; }
    }
    if (img) continue; if (!bg) bg = { r: 255, g: 255, b: 255 };
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (large ? 3 : 4.5)) lowC.push(`${ratio.toFixed(2)}:1 ${label(el)} "${owners.get(el).trim().slice(0, 30)}"`);
  }
  for (const c of lowC.slice(0, 8)) fail.push('low contrast: ' + c);
  if (lowC.length > 8) fail.push(`low contrast: +${lowC.length - 8} more`);

  // 5. broken images
  for (const im of root.querySelectorAll('img')) if (visible(im) && im.complete && im.naturalWidth === 0 && im.getBoundingClientRect().width) fail.push(`broken image: ${im.currentSrc || im.src}`);

  // 6. the same text block fully visible twice (the marquee copy shown stacked) - warn, some repeats are on purpose
  // (aria-hidden copies count here: the ledger bug was exactly an aria-hidden marquee copy displayed stacked)
  const all = new Map(), w2 = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (w2.nextNode()) { const t = w2.currentNode, el = t.parentElement; if (!t.textContent.trim() || !el || !visible(el)) continue;
    if (el.closest('template, noscript, .visually-hidden, .sr-only, .skip-link, svg, script, style')) continue;
    all.set(el, (all.get(el) || '') + ' ' + t.textContent); }
  const blocks = new Map();
  for (const [el, t] of all) {
    const txt = t.replace(/\s+/g, ' ').trim(); if (txt.length < 30) continue;
    const r = el.getBoundingClientRect(), c = clipRect(el, r);
    if (!c || c.left > r.left + 1 || c.right < r.right - 1 || c.top > r.top + 1 || c.bottom < r.bottom - 1) continue;
    if (!blocks.has(txt)) blocks.set(txt, []); blocks.get(txt).push({ y: Math.round(r.top + scrollY), hid: !!el.closest('[aria-hidden="true"]') });
  }
  for (const [t, cs] of blocks) if (cs.length > 1) {
    const msg = `text shown ${cs.length}x (y=${cs.map(c => c.y).join(', ')}): "${t.slice(0, 50)}"`;
    if (cs.some(c => c.hid)) fail.push(msg + ' - a copy marked aria-hidden is fully on screen (a marquee duplicate shown?)'); else warn.push(msg);
  }

  // 7. touch targets on phones (WCAG 2.5.8: 24px; inline links inside sentences are exempt)
  if (mobile) {
    const small = [];
    for (const el of root.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary')) {
      if (!visible(el) || hiddenByAria(el)) continue;
      const s = getComputedStyle(el); if (s.display === 'inline' && el.closest('p, li > p, dd')) continue;
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      if (r.width < 24 || r.height < 24) small.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    if (small.length) warn.push(`touch targets < 24px: ${small.slice(0, 6).join(', ')}${small.length > 6 ? ` +${small.length - 6}` : ''}`);
  }
  return { fail, warn };
}

const headingBoxes = scope => [...(scope ? document.querySelector(scope) || document : document).querySelectorAll('h1, h2')]
  .map(h => Math.round(h.getBoundingClientRect().height));

// ---------------------------------------------------------------- driver
const shots = [];
let fails = 0;
const browsers = {};
for (const v of VIEWS) browsers[v.engine] ||= await (v.engine === 'webkit' ? webkit : chromium).launch();

async function settle(page, view) {
  await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; }));
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += view.h * 0.7) { await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(50); }
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 3000); }))));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(250);
}
async function applyScheme(page, scheme) {
  // sites with a theme toggle keep the choice in data-theme: follow the emulated scheme
  await page.evaluate(s => { const h = document.documentElement; if (h.dataset.theme && h.dataset.theme !== s) h.dataset.theme = s; }, scheme);
}
// element shots: fixed/sticky chrome (nav, action bar, review panel) would paint over the section, so hide it meanwhile
const chrome = (page, hide) => page.evaluate(h => {
  if (!h) { document.querySelectorAll('[data-look-hidden]').forEach(e => { e.style.visibility = e.dataset.lookHidden; delete e.dataset.lookHidden; }); return; }
  for (const e of document.body.querySelectorAll('*')) { const p = getComputedStyle(e).position;
    if ((p === 'fixed' || p === 'sticky') && !e.closest('[data-look-hidden]')) { e.dataset.lookHidden = e.style.visibility; e.style.visibility = 'hidden'; } }
}, hide);
async function elShot(page, sel, file) { await chrome(page, true); await page.locator(sel).filter({ visible: true }).first().screenshot({ path: file, scale: 'css' }); await chrome(page, false); }
async function shoot(page, name) {
  const file = path.join(OUT, name + '.png');
  if (EL) await elShot(page, EL, file);
  else await page.screenshot({ path: file, scale: 'css' });   // the first screen: what the visitor sees before scrolling
  shots.push({ name, file });
  if (!EL) { const full = path.join(OUT, name + '-full.png'); await page.screenshot({ path: full, fullPage: true, scale: 'css' }); }
}
function report(tag, res, errs) {
  const f = [...res.fail, ...errs.map(e => 'error: ' + e)];
  fails += f.length;
  console.log(`\n== ${tag}: ${f.length ? f.length + ' FAIL' : 'ok'}${res.warn.length ? `, ${res.warn.length} warn` : ''}`);
  for (const x of f) console.log('  FAIL', x);
  for (const x of res.warn) console.log('  warn', x);
}

for (const route of routesArg.split(',')) {
  const slug = (route.replace(/^\/|\/$/g, '').replace(/[^\w.-]+/g, '_') || 'home') + (EL ? '-' + EL.replace(/[^\w-]+/g, '') : '');   // [^\w.-]: a query (?look=x) is not a Windows file name
  for (const v of VIEWS) for (const scheme of SCHEMES) {
    const ctx = await browsers[v.engine].newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf,
      isMobile: v.mobile && v.engine !== 'firefox', hasTouch: v.mobile, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });
    page.on('response', r => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await applyScheme(page, scheme); await settle(page, v);
    const tag = `${slug} ${v.name} ${v.engine} ${scheme}`;
    if (EL) await page.locator(EL).filter({ visible: true }).first().scrollIntoViewIfNeeded().catch(() => {});
    report(tag, await page.evaluate(pageChecks, { scope: EL || null, mobile: v.mobile }), errs.splice(0));
    await shoot(page, `${slug}-${v.name}-${scheme}`);

    // WebKit: heading boxes must not change after a scroll and a reload (iPhone font fallback, ledger #1)
    if (v.engine === 'webkit' && scheme === SCHEMES[0]) {
      const a = await page.evaluate(headingBoxes, EL || null);
      await page.reload({ waitUntil: 'networkidle' }); await applyScheme(page, scheme); await settle(page, v);
      const b = await page.evaluate(headingBoxes, EL || null);
      const diff = a.map((x, i) => [x, b[i]]).filter(([x, y]) => y !== undefined && Math.abs(x - y) > 2);
      if (diff.length || a.length !== b.length) { fails++; console.log(`  FAIL headings change size after reload: ${diff.map(([x, y]) => x + '->' + y + 'px').join(', ') || a.length + ' vs ' + b.length + ' headings'}`); }
    }

    // hover shots (desktop only)
    if (HOVER && !v.mobile) for (const sel of HOVER.split(',')) {
      const loc = page.locator(sel).filter({ visible: true }).first(); if (!(await loc.count())) { console.log(`  warn --hover ${sel}: no visible match`); continue; }
      const n = `${slug}-${v.name}-${scheme}-hover${sel.replace(/[^\w-]+/g, '')}`;
      await chrome(page, true); await loc.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await page.waitForTimeout(150);
      await loc.screenshot({ path: path.join(OUT, n + '-rest.png'), scale: 'css' }); shots.push({ name: n + ' rest', file: path.join(OUT, n + '-rest.png') });
      await loc.hover(); await page.waitForTimeout(700);
      await loc.screenshot({ path: path.join(OUT, n + '.png'), scale: 'css' }); shots.push({ name: n, file: path.join(OUT, n + '.png') });
      await page.mouse.move(0, 0); await chrome(page, false);
    }

    // site states (form steps, open menu...) from --states
    for (const st of STATES) {
      if (st.views && !st.views.includes(v.name)) continue;
      await page.goto(base + route, { waitUntil: 'networkidle' }); await applyScheme(page, scheme); await settle(page, v);
      await st.run(page, v); await page.waitForTimeout(400);
      report(`${tag} [${st.name}]`, await page.evaluate(pageChecks, { scope: st.scope || EL || null, mobile: v.mobile }), errs.splice(0));
      const n = `${slug}-${v.name}-${scheme}-${st.name.replace(/[^\w-]+/g, '')}`;
      const file = path.join(OUT, n + '.png');
      if (st.scope || EL) await elShot(page, st.scope || EL, file); else await page.screenshot({ path: file, scale: 'css' });
      shots.push({ name: n, file });
    }
    await ctx.close();
  }
}

// ---------------------------------------------------------------- contact sheet: every shot side by side, one image
const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#777;font:13px system-ui;display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
figure{margin:0;background:#fff;padding:6px}figure img{display:block;max-width:${EL ? 760 : 520}px;max-height:${EL ? 1400 : 700}px;width:auto;height:auto}figcaption{padding:4px 0 0;color:#222}</style>
${shots.map(s => `<figure><img src="${pathToFileURL(s.file).href}"><figcaption>${s.name}</figcaption></figure>`).join('')}`;
fs.writeFileSync(path.join(OUT, 'sheet.html'), html);
const sp = await (await browsers.chromium?.newContext({ viewport: { width: 2200, height: 800 } }) ?? (await chromium.launch()).newContext({ viewport: { width: 2200, height: 800 } })).newPage();
await sp.goto(pathToFileURL(path.join(OUT, 'sheet.html')).href, { waitUntil: 'load' });
await sp.screenshot({ path: path.join(OUT, 'sheet.png'), fullPage: true });
for (const b of Object.values(browsers)) await b.close();
console.log(`\n${fails ? fails + ' FAIL' : 'all ok'} - sheet: ${path.join(OUT, 'sheet.png')}`);
process.exit(fails ? 1 : 0);
