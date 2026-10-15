// Where does every "#" link land? Clicks each in-page / cross-page anchor link the way a visitor does and flags bad
// landings (Arthur 2026-10-12: the hero "Get a free case review" landed on the band's intro with a strip of the previous
// band above it and the form's first question below the fold).
// usage: node tools/anchor-landing.mjs [base=http://localhost:8741] [route...]   (no routes = every built page except
// blog posts, plus two posts) -> one line per problem; exit 1 when any.
// Rules per landing, at 414 (WebKit, phone) and 1534x692 (Chromium, Arthur's desktop):
//   - the target exists and its first content is not under the floating nav;
//   - a form lands centred in the free screen under the nav (just under it when taller);
//   - anything else: no strip of ANOTHER band shows between the viewport top and the target's band;
//   - the address keeps no "#..." after the jump (a reload must not snap back to the target).
import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire('C:/dev/web-toolbox/');
const { webkit, chromium } = require('playwright');

const base = (process.argv[2] || 'http://localhost:8741').replace(/\/$/, '');
let routes = process.argv.slice(3);
if (!routes.length) {
  const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site', 'dist');
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'index.html' ? [path.join(d, e.name)] : []);
  const all = walk(dist).map(f => '/' + path.relative(dist, path.dirname(f)).split(path.sep).join('/') + '/').map(r => r.replace(/^\/\.?\/$/, '/').replace('//', '/'));
  const posts = all.filter(r => /^\/(blog|uncategorized)\/[^/]+\/$/.test(r) && !/^\/blog\/(category|page)\//.test(r));
  routes = [...all.filter(r => !posts.includes(r)), ...posts.slice(0, 2)];
}

const VIEWS = [
  { name: 'phone', engine: webkit, ctx: { viewport: { width: 414, height: 715 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
  { name: 'desktop', engine: chromium, ctx: { viewport: { width: 1534, height: 692 }, deviceScaleFactor: 1.25 } },
];

// runs in the page after the scroll settled
const measure = hash => {
  const id = decodeURIComponent(hash.slice(1));
  const t = document.getElementById(id);
  if (!t) return { err: `no element with id "${id}"` };
  const out = [];
  const nav = document.querySelector('.site-nav .nav, .site-nav, header');
  const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
  const vh = innerHeight;
  // the first piece of real content inside the target (or the target itself)
  const first = [...t.querySelectorAll('h1,h2,h3,legend,p,label,input,select,textarea,img,li,a,button')].find(e => { const r = e.getBoundingClientRect(); return r.width && r.height; }) || t;
  const ft = first.getBoundingClientRect().top;
  if (ft < navBottom - 1) out.push(`content under the nav (top ${Math.round(ft)} < nav ${Math.round(navBottom)})`);
  if (ft > vh * 0.6) out.push(`target content starts low (${Math.round(ft)} of ${vh})`);
  const form = t.matches('form') ? t : null;   // a section that merely contains a form follows the band rules
  if (form) {
    // a form lands centred in the free screen under the nav (Arthur 2026-10-12), or just under the nav when taller
    const r = form.getBoundingClientRect(), free = vh - navBottom;
    if (r.height <= free) {
      const want = navBottom + (free - r.height) / 2;
      if (Math.abs(r.top - want) > 24) out.push(`form not centred (top ${Math.round(r.top)}, centred = ${Math.round(want)})`);
    } else if (r.top < navBottom - 1 || r.top > navBottom + 40) out.push(`tall form should start just under the nav (top ${Math.round(r.top)})`);
  } else {
    // another band above the target's band
    const band = t.closest('section, footer, .section') || t;
    const bt = band.getBoundingClientRect().top;
    if (bt > 2) {
      const probe = document.elementsFromPoint(Math.min(4, innerWidth - 1), Math.max(0, bt - 2)).find(e => e.closest('section, footer, .section') && !e.closest('.site-nav, header'));
      const other = probe && probe.closest('section, footer, .section');
      if (other && other !== band) out.push(`a ${Math.round(bt)}px strip of the previous band shows above the target`);
    }
  }
  return { out, target: `${t.tagName.toLowerCase()}#${id}` };
};

let problems = 0;
for (const v of VIEWS) {
  const browser = await v.engine.launch();
  const seen = new Set();
  for (const route of routes) {
    const ctx = await browser.newContext(v.ctx);
    const page = await ctx.newPage();
    try { await page.goto(base + route, { waitUntil: 'load' }); } catch { await ctx.close(); continue; }
    await page.evaluate(() => document.fonts.ready);
    // every link with a fragment that points at this page or another page of the site
    const links = await page.evaluate(origin => [...document.querySelectorAll('a[href*="#"]')].filter(a => a.getClientRects().length && getComputedStyle(a).visibility !== 'hidden')   // what a visitor can click
      .map(a => ({ href: a.getAttribute('href'), url: a.href, where: a.dataset.where || a.className.split(' ')[0] || a.textContent.trim().slice(0, 24) }))
      .filter(l => l.url.startsWith(origin) && !/#main$/.test(l.url) && !/#(i-|mono-|deco)/.test(l.href)), base);
    await ctx.close();
    for (const l of links) {
      const u = new URL(l.url); const samePage = u.pathname === route;
      const key = `${samePage ? route : '*'}|${u.pathname}${u.hash}`;   // a cross-page link is checked once per target
      if (seen.has(key) || !u.hash) continue; seen.add(key);
      const c = await browser.newContext(v.ctx); const p = await c.newPage();
      try {
        await p.goto(base + route, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
        await p.evaluate(h => { const a = [...document.querySelectorAll('a[href]')].find(x => x.getAttribute('href') === h); a.scrollIntoView({ block: 'center' }); a.click(); }, l.href);
        if (!samePage) await p.waitForURL(x => x.pathname === u.pathname, { timeout: 15000 }).then(() => p.waitForLoadState('load'));
        // wait until the (smooth) scroll has settled: scrollY unchanged for 400 ms, at most 6 s
        await p.evaluate(() => new Promise(res => { let last = -1, still = 0, n = 0; const t = setInterval(() => { still = scrollY === last ? still + 1 : 0; last = scrollY; if (still >= 4 || ++n > 60) { clearInterval(t); res(); } }, 100); }));
        const m = await p.evaluate(measure, u.hash);
        const msgs = m.err ? [m.err] : m.out;
        const left = await p.evaluate(() => location.hash);
        if (left) msgs.push(`the address keeps "${left}": every reload snaps back to the target`);
        for (const msg of msgs) { problems++; console.log(`${v.name.padEnd(7)} ${route} -> ${u.pathname === route ? '' : u.pathname}${u.hash} [${l.where}]: ${msg}`); }
      } catch (e) { problems++; console.log(`${v.name.padEnd(7)} ${route} -> ${l.href}: check failed (${e.message.split('\n')[0]})`); }
      await c.close();
    }
  }
  await browser.close();
}
console.log(problems ? `${problems} anchor landing problem(s)` : 'anchor landings OK');
process.exit(problems ? 1 : 0);
