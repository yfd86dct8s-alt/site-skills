// Local tests for public_html/api/lead.php. Needs `php` on PATH and node 20+. No network beyond 127.0.0.1; Resend is a local stub
// (tests/stub-resend.php) and the key is a fake. Also runs the ORIGINAL site/functions/api/lead.js with a mocked fetch and
// compares its Resend payload with the PHP one (parity).   Run:  node tests/test-lead.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const leadJs = resolve(root, '../../site/functions/api/lead.js');
const tmp = mkdtempSync(join(tmpdir(), 'gemcap-lead-'));
const PORT = 8790, STUB = 8791, PORT2 = 8792, PORT3 = 8793, PORT4 = 8794;
const out = join(tmp, 'stub.jsonl'), mode = join(tmp, 'stub-mode');
const cfgDir = join(tmp, 'gemcap-config'), cfgDir2 = join(tmp, 'cfg2'), cfgDir3 = join(tmp, 'cfg3'), cfgDir4 = join(tmp, 'cfg4');
mkdirSync(cfgDir); mkdirSync(cfgDir2); mkdirSync(cfgDir3); mkdirSync(cfgDir4);
const cfgPhp = (key, stub, rate = 1000) => `<?php return array('RESEND_API_KEY'=>'${key}','LEAD_TO'=>'info@gemcaptrucking.com','LEAD_FROM'=>'GEMCAP Website <alerts@marketingcartel.com>','TEST_TOKEN'=>'test-token-local','TEST_TO'=>'qa@example.test','RATE_PER_HOUR'=>${rate},'TRUST_PROXY_HEADERS'=>true,'RESEND_API_URL'=>'http://127.0.0.1:${stub}/emails');`;
writeFileSync(join(cfgDir, 'config.php'), cfgPhp('test-key-local', STUB));
writeFileSync(join(cfgDir2, 'config.php'), cfgPhp('re_CHANGE_ME', STUB));
writeFileSync(join(cfgDir3, 'config.php'), cfgPhp('test-key-local', STUB, 3));
writeFileSync(join(cfgDir4, 'config.php'), cfgPhp('test-key-local', STUB).replace(');', ",'AUTOREPLY_PER_DAY'=>1);"));
writeFileSync(mode, 'ok');

const procs = [];
const php = (args, env) => { const p = spawn('php', args, { env: { ...process.env, ...env }, stdio: 'ignore' }); procs.push(p); return p; };
const ini = ['-d', 'upload_max_filesize=6M', '-d', 'post_max_size=8M'];   // what public_html/api/.user.ini sets
php(['-S', `127.0.0.1:${STUB}`, join(here, 'stub-resend.php')], { STUB_OUT: out, STUB_MODE: mode });
php([...ini, '-S', `127.0.0.1:${PORT}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir, 'config.php') });
php([...ini, '-S', `127.0.0.1:${PORT2}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir2, 'config.php') });
php([...ini, '-S', `127.0.0.1:${PORT3}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir3, 'config.php') });
php([...ini, '-S', `127.0.0.1:${PORT4}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir4, 'config.php') });
// Turnstile: server 5 checks tokens against a local siteverify stub (tests/stub-siteverify.php), server 6 against a port where
// nothing listens (Cloudflare unreachable), server 7 with Cloudflare's always-fail test secret (served by the stub too)
const PORT5 = 8795, PORT6 = 8796, PORT7 = 8797, TS = 8798, DEAD = 8799;
const tsOut = join(tmp, 'ts.jsonl'), cfgDir5 = join(tmp, 'cfg5'), cfgDir6 = join(tmp, 'cfg6'), cfgDir7 = join(tmp, 'cfg7');
const tsCfg = (secret, url) => cfgPhp('test-key-local', STUB).replace(');', `,'TURNSTILE_SECRET'=>'${secret}','TURNSTILE_VERIFY_URL'=>'${url}');`);
for (const [dir, c] of [[cfgDir5, tsCfg('ts-secret-local', `http://127.0.0.1:${TS}/siteverify`)], [cfgDir6, tsCfg('ts-secret-local', `http://127.0.0.1:${DEAD}/siteverify`)],
  [cfgDir7, tsCfg('2x0000000000000000000000000000000AA', `http://127.0.0.1:${TS}/siteverify`)]]) { mkdirSync(dir); writeFileSync(join(dir, 'config.php'), c); }
php(['-S', `127.0.0.1:${TS}`, join(here, 'stub-siteverify.php')], { TS_OUT: tsOut });
php([...ini, '-S', `127.0.0.1:${PORT5}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir5, 'config.php') });
php([...ini, '-S', `127.0.0.1:${PORT6}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir6, 'config.php') });
php([...ini, '-S', `127.0.0.1:${PORT7}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir7, 'config.php') });
// CallTrackingMetrics FormReactor: server 8 relays to a local CTM stub (tests/stub-ctm.php); servers 1-7 have no CTM_* keys.
// Its config is rewritten between checks (lead.php reads it on every request).
const PORT8 = 8800, CTM = 8801;
const ctmOut = join(tmp, 'ctm.jsonl'), ctmMode = join(tmp, 'ctm-mode'), cfgDir8 = join(tmp, 'cfg8');
const CTM_KEYS = { CTM_FORM_ID: 'FRT0123abcdEF', CTM_ACCESS_KEY: 'ctm-access-local', CTM_SECRET_KEY: 'ctm-secret-local', CTM_API_URL: `http://127.0.0.1:${CTM}/api/v1/formreactor/` };
const cfg8 = (over = {}) => writeFileSync(join(cfgDir8, 'config.php'), cfgPhp('test-key-local', STUB).replace(');',
  Object.entries({ ...CTM_KEYS, ...over }).map(([k, v]) => `,'${k}'=>${typeof v === 'boolean' ? v : `'${v}'`}`).join('') + ');'));
mkdirSync(cfgDir8); cfg8(); writeFileSync(ctmMode, 'ok');
php(['-S', `127.0.0.1:${CTM}`, join(here, 'stub-ctm.php')], { CTM_OUT: ctmOut, CTM_MODE: ctmMode });
php([...ini, '-S', `127.0.0.1:${PORT8}`, join(here, 'router.php')], { GEMCAP_CONFIG: join(cfgDir8, 'config.php') });
await new Promise(r => setTimeout(r, 1500));

let pass = 0, fail = 0;
const ok = (c, name, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name}${c ? '' : '  ' + extra}`); };
const URL1 = `http://127.0.0.1:${PORT}/api/lead`;
const H = { Origin: 'https://www.gemcaptrucking.com' };
const allLines = () => existsSync(out) ? readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const stubLines = () => allLines().filter(l => !/^ack-/.test(l.idem || ''));   // the lead emails; the visitor's confirmations are acks()
const acks = () => allLines().filter(l => /^ack-/.test(l.idem || ''));
const post = async (body, headers = {}, url = URL1) => {
  const r = await fetch(url, { method: 'POST', headers: { ...H, ...headers }, body });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j, cc: r.headers.get('cache-control'), r };
};
const json = (o, headers = {}, url) => post(JSON.stringify(o), { 'Content-Type': 'application/json', ...headers }, url);
const run = args => new Promise(res => {
  const p = spawn('php', args, { cwd: root, env: { ...process.env, GEMCAP_CONFIG: join(cfgDir, 'config.php') } });
  let o = ''; p.stdout.on('data', d => o += d); p.stderr.on('data', d => o += d); p.on('close', () => res(o));
});

const quote = { form: 'quote', page: '/quote/', fields: { need: 'full-truckload', pickup: 'Newark, NJ', delivery: 'Atlanta, GA', ready: '2026-11-03', what: 'Pallets <b>of</b> tiles', equipment: 'dry-van', hazmat: 'no', name: 'Jane "JD" Doe', company: "O'Brien & Sons", email: 'jane@example.com', phone: '(555) 010-2030', notes: 'Line 1\nLine 2 & more' },
  attribution: { first: { channel: 'Paid search', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'ftl-nj', gclid: 'abc', landing: '/lp/ftl/', referrer: 'google.com' }, last: { channel: 'Direct', landing: '/' } } };
const contact = { form: 'contact', page: '/contact/', fields: { name: 'Sam', email: 'sam@example.com', topic: 'get-a-quote', message: 'Hello there' }, attribution: {} };
const driverLead = { form: 'driver-prequal', page: '/drive/', fields: { first_name: 'Ann', last_name: 'Lee', email: 'ann@example.com', phone: '5550001111', home_phone: '', drive_as: 'owner-operator', experience: '5 years', twic: 'yes', sms_consent: 'yes', lp: 'cdl-drivers' }, attribution: { last: { channel: 'Organic', utm_source: 'bing', fbclid: 'x' } } };
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n' + 'x'.repeat(3000));
const mp = (lead, name, buf) => { const fd = new FormData(); fd.set('lead', JSON.stringify(lead)); if (buf) fd.set('resume', new Blob([buf], { type: 'application/octet-stream' }), name); return fd; };

// 1. quote JSON
let n0 = stubLines().length;
let r = await json(quote);
ok(r.status === 200 && r.j.ok && /^stub-/.test(r.j.id), 'quote JSON -> 200 ok + Resend id', JSON.stringify(r.j));
ok(r.cc === 'no-store' && r.r.headers.get('x-accel-expires') === '0', 'response is never cached (Cache-Control no-store, X-Accel-Expires 0)');
let l = stubLines(); const q = l[l.length - 1];
ok(l.length === n0 + 1 && q.body.to[0] === 'info@gemcaptrucking.com' && q.body.subject === 'Quote request: Jane "JD" Doe (O\'Brien & Sons)', 'quote subject + recipient', q?.body?.subject);
ok(q.body.reply_to === 'Jane JD Doe <jane@example.com>' && /^lead-/.test(q.idem), 'reply-to = sender, Idempotency-Key set');
ok(q.body.html.includes('Where this lead came from') && q.body.text.includes('First visit: Paid search · source google · medium cpc · campaign ftl-nj · Google Ads click · landed on /lp/ftl/ · from google.com'), 'attribution lines');

// 2. contact JSON
r = await json(contact); l = stubLines();
ok(r.j?.ok && l[l.length - 1].body.subject === 'Website message: Sam · Get a quote', 'contact JSON subject with topic', l[l.length - 1]?.body?.subject);

// 3. driver multipart with PDF
r = await post(mp(driverLead, 'My Resume (final).pdf', pdf)); l = stubLines(); const d = l[l.length - 1];
ok(r.j?.ok && d.body.subject === 'Driver pre-qualification: Ann Lee' && d.body.attachments?.[0]?.filename === 'My Resume _final_.pdf', 'driver multipart: subject + sanitised filename', JSON.stringify(r.j));
ok(d.body.attachments && Buffer.from(d.body.attachments[0].content, 'base64').equals(pdf), 'resume attached byte-for-byte');
ok(d.body.html.includes('Landing page') && d.body.text.includes('Landing page: cdl-drivers') && d.body.text.includes('Resume file: My Resume _final_.pdf (attached)'), 'lp label + resume row');

// 4. partial
n0 = stubLines().length;
r = await json({ form: 'quote', partial: true, fields: { pickup: 'x' } });
ok(r.status === 200 && r.j.partial === true && stubLines().length === n0, 'partial step acknowledged, nothing emailed');

// 5. origin
r = await json(quote, { Origin: 'https://evil.example' });
ok(r.status === 403 && r.j.error === 'origin', 'bad origin -> 403');
r = await json(quote, { Origin: 'https://www.gemcaptrucking.com.evil.example' });
ok(r.status === 403, 'look-alike origin -> 403');
for (const o of ['https://gemcaptrucking.com', 'https://gemcap-preview.pages.dev', 'https://abc123.gemcap-preview.pages.dev']) {
  r = await json({ ...contact, fields: { ...contact.fields, name: 'Origin ' + o } }, { Origin: o }); ok(r.status === 200, 'origin allowed: ' + o, JSON.stringify(r.j));
}
r = await post(JSON.stringify(contact), { 'Content-Type': 'application/json', Origin: '' }); ok(r.status === 200, 'empty Origin header -> allowed (as lead.js)', String(r.status));

// 6. contact missing / invalid
r = await json({ form: 'contact', fields: { name: 'No Contact', email: 'not-an-email' } });
ok(r.status === 400 && r.j.error === 'contact', 'missing contact -> 400 contact');
r = await json({ form: 'contact', fields: { name: 'Phone only', phone: '555' } }); ok(r.status === 200, 'phone only is enough');

// 7. files
r = await post(mp(driverLead, 'big.pdf', Buffer.alloc(5 * 1024 * 1024 + 1, 65)));
ok(r.status === 400 && r.j.error === 'file', 'file just over 5 MB -> 400 file', JSON.stringify(r.j));
r = await post(mp(driverLead, 'huge.pdf', Buffer.alloc(6 * 1024 * 1024, 65)));
ok(r.status === 413, 'body over 5 MB + 200 KB -> 413', String(r.status));
r = await post(mp(driverLead, 'run.exe', pdf));
ok(r.status === 400 && r.j.error === 'file', 'disallowed extension -> 400 file');
r = await post(mp(driverLead, 'ok.png', Buffer.alloc(5 * 1024 * 1024, 66))); ok(r.status === 200, 'file of exactly 5 MB accepted', JSON.stringify(r.j));
r = await post(mp(driverLead)); ok(r.status === 200, 'multipart without a resume is fine', JSON.stringify(r.j));

// 8. test header routing
r = await json(contact, { 'X-Lead-Test': 'test-token-local' }); l = stubLines();
ok(r.j?.ok && l[l.length - 1].body.to[0] === 'qa@example.test' && l[l.length - 1].body.subject.startsWith('[TEST] '), 'X-Lead-Test routes to TEST_TO with [TEST]');
r = await json(contact, { 'X-Lead-Test': 'wrong' }); l = stubLines();
ok(r.j?.ok && l[l.length - 1].body.to[0] === 'info@gemcaptrucking.com' && !l[l.length - 1].body.subject.startsWith('[TEST]'), 'wrong test token -> normal recipient');

// 9. other errors
r = await post('{nope', { 'Content-Type': 'application/json' }); ok(r.status === 400 && r.j.error === 'bad request', 'bad JSON -> 400');
r = await json({ form: 'nope', fields: { email: 'a@b.co' } }); ok(r.status === 400 && r.j.error === 'form', 'unknown form -> 400');
r = await fetch(URL1, { headers: H }); ok(r.status === 405 && r.headers.get('allow') === 'POST', 'GET -> 405');
r = await json(quote, {}, `http://127.0.0.1:${PORT2}/api/lead`); ok(r.status === 503 && r.j.error === 'not configured', 'placeholder key -> 503 not configured', JSON.stringify(r.j));
r = await json({ form: 'quote', partial: true }, {}, `http://127.0.0.1:${PORT2}/api/lead`); ok(r.status === 200, 'partial still acknowledged when not configured');

// 10. Resend down: lead spooled, form still ok; replay sends it once
writeFileSync(mode, 'fail');
r = await post(mp({ ...driverLead, fields: { ...driverLead.fields, first_name: 'Queued' } }, 'q.pdf', pdf));
ok(r.status === 200 && r.j.ok && r.j.queued === true, 'Resend down + spool ok -> ok:true queued', JSON.stringify(r.j));
const spool = join(cfgDir, 'spool'); const leadFile = readdirSync(spool).find(f => f.startsWith('leads-'));
ok(!!leadFile && readFileSync(join(spool, leadFile), 'utf8').includes('Queued'), 'lead is in the spool', readdirSync(spool).join());
const dry = await run(['public_html/api/lead.php', '--replay', '--dry-run']);
// earlier leads were sent and marked in sent.jsonl, so exactly the queued one is pending
ok(/pending 1,/.test(dry), 'replay --dry-run lists 1 pending', dry);
const failed = await run(['public_html/api/lead.php', '--replay']); ok(/failed 1/.test(failed), 'replay while Resend is still down -> stays pending', failed);
writeFileSync(mode, 'ok'); n0 = stubLines().length;
const done = await run(['public_html/api/lead.php', '--replay']); l = stubLines(); const rp = l[l.length - 1];
ok(/sent 1, failed 0/.test(done) && l.length === n0 + 1 && rp.body.subject.includes('Queued') && Buffer.from(rp.body.attachments[0].content, 'base64').equals(pdf) && /^lead-/.test(rp.idem), 'replay sends it with its resume + Idempotency-Key', done);
const again = await run(['public_html/api/lead.php', '--replay']); ok(/pending 0/.test(again), 'replay is idempotent (nothing pending afterwards)', again);

// 10b. per-IP rate limit (server 3: 3 leads per hour per IP)
const U3 = `http://127.0.0.1:${PORT3}/api/lead`;
const ip = x => ({ 'X-Forwarded-For': x });
n0 = stubLines().length;
for (let i = 1; i <= 3; i++) { r = await json(contact, ip('203.0.113.7'), U3); ok(r.status === 200, `rate: lead ${i}/3 from one IP accepted`, String(r.status)); }
for (let i = 0; i < 5; i++) await json({ form: 'quote', partial: true, fields: { pickup: 'x' } }, ip('203.0.113.7'), U3);
r = await json(contact, ip('203.0.113.7'), U3);
ok(r.status === 429 && r.j.error === 'rate' && Number(r.r.headers.get('retry-after')) > 0, 'rate: 4th lead from the same IP -> 429 {error:rate} + Retry-After (partials not counted)', JSON.stringify(r.j) + r.status);
ok(stubLines().length === n0 + 3, 'rate: the refused lead was not emailed');
ok(/rate limited/.test(readFileSync(join(cfgDir3, 'spool', 'relay.log'), 'utf8')), 'rate: refusal is logged, not silent');
r = await json(contact, ip('203.0.113.8'), U3); ok(r.status === 200, 'rate: another IP is unaffected');
r = await json(contact, { ...ip('203.0.113.7'), 'X-Lead-Test': 'test-token-local' }, U3); ok(r.status === 200, 'rate: test-header requests are not limited');
ok(readdirSync(join(cfgDir3, 'spool', 'rate')).every(f => /^[0-9a-f]{40}.txt$/.test(f)), 'rate: only hashed IPs on disk');

// 11. parity with the original lead.js (same input -> same Resend payload)
let captured = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (String(u).startsWith('https://api.resend.com')) { captured = JSON.parse(o.body); return new Response('{"id":"js-1"}', { status: 200 }); }
  return realFetch(u, o);
};
const { onRequestPost } = await import(pathToFileURL(leadJs).href);
const env = { RESEND_API_KEY: 'k', LEAD_TO: 'info@gemcaptrucking.com', TEST_TOKEN: 'test-token-local', TEST_TO: 'qa@example.test' };
const FIELDS = ['from', 'to', 'subject', 'html', 'text', 'reply_to'];
async function parity(name, lead, file, hdr = {}) {
  const baseline = stubLines().length;
  const phpRes = file ? await post(mp(lead, file.name, file.buf), hdr) : await json(lead, hdr);
  const p = stubLines()[baseline]?.body;
  captured = null;
  const req = file
    ? new Request('https://x.test/api/lead', { method: 'POST', headers: { ...H, ...hdr }, body: mp(lead, file.name, file.buf) })
    : new Request('https://x.test/api/lead', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json', ...hdr }, body: JSON.stringify(lead) });
  const jsRes = await onRequestPost({ request: req, env });
  const c = captured;
  const diff = !p || !c ? ['(missing payload)'] : [...FIELDS, 'attachments'].filter(k => JSON.stringify(p[k]) !== JSON.stringify(c[k]));
  ok(!diff.length && phpRes.status === jsRes.status, `parity with lead.js: ${name}`, 'differs: ' + diff.join(',') + ` status php ${phpRes.status} js ${jsRes.status}`);
  return { p, c, diff };
}
await parity('quote JSON', quote);
await parity('contact JSON', contact);
await parity('driver multipart + PDF', driverLead, { name: 'cv.pdf', buf: pdf });
await parity('test header', contact, null, { 'X-Lead-Test': 'test-token-local' });
await parity('odd input (unicode, control chars, long value)', { form: 'contact', page: '/p?x=1&y=<2>', fields: { name: 'José Núñez \u0007', email: 'jose@example.com', message: 'Olá ' + 'ç'.repeat(4100), weird_key: 'v', 'a-b': 'x' }, attribution: { first: { channel: 'Referral', referrer: 'a.com' } } });

// the visitor's confirmation email (autoreply)
const lastAck = () => acks().at(-1);
let a0 = acks().length;
r = await json({ ...quote, fields: { ...quote.fields, email: 'ack1@example.com' } });
let ack = lastAck();
ok(r.j?.ok && acks().length === a0 + 1 && ack.body.to[0] === 'ack1@example.com' && ack.body.subject === 'We received your quote request | GEMCAP®'
  && ack.body.from === 'GEMCAP Trucking <noreply@marketingcartel.com>' && ack.body.reply_to === 'info@gemcaptrucking.com' && /^ack-/.test(ack.idem), 'autoreply: quote -> confirmation to the visitor, replies go to GEMCAP', JSON.stringify(ack?.body?.to));
ok(/Hi Jane,/.test(ack.body.text) && /305-551-5626/.test(ack.body.text) && !/Pallets|Newark|O'Brien/.test(ack.body.html + ack.body.text), 'autoreply: first name only, nothing else the visitor typed');
a0 = acks().length;
r = await json({ ...quote, fields: { ...quote.fields, email: 'ACK1@example.com' } });
ok(r.j?.ok && acks().length === a0, 'autoreply: one per address per 24 h (case-insensitive); the lead still goes out');
r = await json({ ...contact, fields: { ...contact.fields, name: 'spam.example now', email: 'ack2@example.com' } });
ack = lastAck();
ok(ack.body.to[0] === 'ack2@example.com' && /^Hello,/.test(ack.body.text) && !/spam\.example/.test(ack.body.html + ack.body.text) && ack.body.subject === 'We received your message | GEMCAP®', 'autoreply: a name that is not a plain name is dropped (no links relayed)');
r = await json({ ...contact, fields: { ...contact.fields, email: 'victim@example.com' } }, { 'X-Lead-Test': 'test-token-local' });
ack = lastAck();
ok(ack.body.to.length === 1 && ack.body.to[0] === 'qa@example.test' && ack.body.subject.startsWith('[TEST] '), 'autoreply: a test request confirms to TEST_TO, never the typed address');
r = await post(mp({ ...driverLead, fields: { ...driverLead.fields, email: 'ack3@example.com' } }));
ack = lastAck();
ok(ack.body.to[0] === 'ack3@example.com' && ack.body.subject === 'We received your application | GEMCAP®' && /Hi Ann,/.test(ack.body.text) && !ack.body.attachments, 'autoreply: driver -> application confirmation, no resume attached');
a0 = acks().length;
r = await json({ ...contact, fields: { name: 'Phone Only', phone: '5550002222', message: 'call me' } });
ok(r.j?.ok && acks().length === a0, 'autoreply: no email address -> no confirmation');

{
  const U4 = `http://127.0.0.1:${PORT4}/api/lead`, before = acks().length;
  await json({ ...contact, fields: { ...contact.fields, email: 'cap1@example.com' } }, {}, U4);
  r = await json({ ...contact, fields: { ...contact.fields, email: 'cap2@example.com' } }, {}, U4);
  const got = acks().slice(before).map(a => a.body.to[0]);
  ok(r.j?.ok && got.length === 1 && got[0] === 'cap1@example.com' && /AUTOREPLY_PER_DAY reached/.test(readFileSync(join(cfgDir4, 'spool', 'relay.log'), 'utf8')),
    'autoreply: AUTOREPLY_PER_DAY caps confirmations (shared Resend quota); the lead still goes out', JSON.stringify(got));
}

// Cloudflare edges: CF-Connecting-IP counts only when REMOTE_ADDR is a Cloudflare address
{
  const src = readFileSync(join(root, 'public_html/api/lead.php'), 'utf8');
  const fn = n => src.match(new RegExp('function ' + n + '\\(.*?\\n}\\n', 's'))[0];
  const ranges = src.match(/const GEM_CF_RANGES = array\(.*?\);/s)[0];
  const f = join(tmp, 'cidr.php');
  writeFileSync(f, '<?php\n' + ranges + '\n' + fn('gem_in_cidr') + fn('gem_from_cloudflare') +
    "foreach (array('172.70.1.2','104.23.9.9','2606:4700:10::1','131.0.75.1','1.2.3.4','172.63.255.255','2001:db8::1','not-an-ip') as $ip) echo $ip, '=', gem_from_cloudflare($ip) ? 1 : 0, ' ';");
  const o = await new Promise(res => { const p = spawn('php', [f]); let s = ''; p.stdout.on('data', d => s += d); p.on('close', () => res(s.trim())); });
  ok(o === '172.70.1.2=1 104.23.9.9=1 2606:4700:10::1=1 131.0.75.1=1 1.2.3.4=0 172.63.255.255=0 2001:db8::1=0 not-an-ip=0', 'Cloudflare ranges: edges recognised, others not', o);
}

// Cloudflare Turnstile (servers 5-7; server 1 has no TURNSTILE_SECRET)
{
  const U5 = `http://127.0.0.1:${PORT5}/api/lead`, U6 = `http://127.0.0.1:${PORT6}/api/lead`, U7 = `http://127.0.0.1:${PORT7}/api/lead`;
  const tsLines = () => existsSync(tsOut) ? readFileSync(tsOut, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const relay = dir => { try { return readFileSync(join(dir, 'spool', 'relay.log'), 'utf8'); } catch { return ''; } };
  const spoolText = dir => { try { return readdirSync(join(dir, 'spool')).filter(f => f.startsWith('leads-')).map(f => readFileSync(join(dir, 'spool', f), 'utf8')).join(''); } catch { return ''; } };
  const who = n => ({ ...quote, fields: { ...quote.fields, name: n, email: n.toLowerCase().replace(/\W/g, '') + '@example.com' } });
  const visitor = { 'X-Forwarded-For': '198.51.100.23' };

  let n0 = stubLines().length, t0 = tsLines().length;
  r = await json({ ...who('Tsgood One'), turnstile: 'good-4c1e9a' }, visitor, U5);
  let sv = tsLines()[t0];
  ok(r.status === 200 && r.j.ok && stubLines().length === n0 + 1, 'turnstile: accepted token -> 200, lead emailed', JSON.stringify(r.j));
  ok(sv && sv.secret === 'ts-secret-local' && sv.response === 'good-4c1e9a' && sv.remoteip === '198.51.100.23', 'turnstile: siteverify gets secret, token and the rate limiter\'s visitor IP', JSON.stringify(sv));
  ok(!JSON.stringify(stubLines().at(-1)).includes('good-4c1e9a') && !spoolText(cfgDir5).includes('good-4c1e9a'), 'turnstile: the token is neither emailed nor spooled');

  n0 = stubLines().length;
  r = await json({ ...who('Tsbad Two'), turnstile: 'bad-7f3a21' }, visitor, U5);
  ok(r.status === 400 && r.j.ok === false && r.j.error === 'verify', 'turnstile: refused token -> 400 {error:verify}', r.status + JSON.stringify(r.j));
  ok(stubLines().length === n0 && !spoolText(cfgDir5).includes('Tsbad Two'), 'turnstile: refused lead is not emailed and not spooled');
  const log5 = relay(cfgDir5);
  ok(/turnstile refused \(invalid-input-response\)/.test(log5) && !/bad-7f3a21|Tsbad|tsbadtwo|198\.51\.100\.23/.test(log5), 'turnstile: refusal logged in relay.log without token, IP or personal data', log5.split('\n').filter(l => /turnstile/.test(l)).join(' | '));

  n0 = stubLines().length; t0 = tsLines().length;
  r = await json(who('Tsnone Three'), visitor, U5);
  ok(r.status === 400 && r.j.error === 'verify' && stubLines().length === n0 && tsLines().length === t0, 'turnstile: missing token -> 400 verify (siteverify not even called)', r.status + JSON.stringify(r.j));
  r = await json({ ...who('Tshost Four'), turnstile: 'otherhost-1' }, visitor, U5);
  ok(r.status === 400 && r.j.error === 'verify' && /turnstile refused \(hostname\)/.test(relay(cfgDir5)), 'turnstile: token solved on another hostname -> 400 verify', r.status + JSON.stringify(r.j));

  n0 = stubLines().length;
  r = await post(mp({ ...driverLead, turnstile: 'good-mp' }, 'cv.pdf', pdf), {}, U5);
  ok(r.status === 200 && stubLines().length === n0 + 1 && tsLines().at(-1).response === 'good-mp', 'turnstile: driver multipart carries the token in the lead JSON -> 200', JSON.stringify(r.j));
  r = await post(mp(driverLead, 'cv.pdf', pdf), {}, U5);
  ok(r.status === 400 && r.j.error === 'verify', 'turnstile: driver multipart without a token -> 400 verify', r.status + JSON.stringify(r.j));

  t0 = tsLines().length;
  r = await json({ form: 'quote', partial: true, fields: { pickup: 'x' } }, {}, U5);
  ok(r.status === 200 && r.j.partial === true && tsLines().length === t0, 'turnstile: partial step without a token -> 200 partial, not checked');
  n0 = stubLines().length;
  r = await json(contact, { 'X-Lead-Test': 'test-token-local' }, U5);
  ok(r.status === 200 && stubLines().at(-1).body.to[0] === 'qa@example.test' && tsLines().length === t0, 'turnstile: X-Lead-Test request needs no token (not checked)', r.status + JSON.stringify(r.j));

  for (const [tok, what] of [['nonjson-1', 'siteverify answers HTML'], ['internal-1', 'siteverify internal-error']]) {
    n0 = stubLines().length;
    r = await json({ ...who('Tsopen ' + tok), turnstile: tok }, visitor, U5);
    ok(r.status === 200 && r.j.ok && stubLines().length === n0 + 1, `turnstile: ${what} -> fail open, lead accepted`, r.status + JSON.stringify(r.j));
  }
  ok((relay(cfgDir5).match(/turnstile unreachable/g) || []).length === 2, 'turnstile: each fail-open is logged "turnstile unreachable"');

  n0 = stubLines().length;
  r = await json({ ...who('Tsdown Five'), turnstile: 'good-x' }, visitor, U6);
  ok(r.status === 200 && r.j.ok && stubLines().length === n0 + 1 && /turnstile unreachable/.test(relay(cfgDir6)), 'turnstile: siteverify down -> lead accepted + logged', r.status + JSON.stringify(r.j));

  n0 = stubLines().length;
  r = await json({ ...who('Tsfail Six'), turnstile: 'XXXX.DUMMY.TOKEN.XXXX' }, visitor, U7);
  ok(r.status === 400 && r.j.error === 'verify' && stubLines().length === n0, 'turnstile: Cloudflare always-fail test secret -> 400 verify', r.status + JSON.stringify(r.j));

  n0 = stubLines().length; t0 = tsLines().length;
  r = await json(who('Tsoff Seven'));
  ok(r.status === 200 && stubLines().length === n0 + 1 && tsLines().length === t0, 'turnstile: TURNSTILE_SECRET empty -> no token needed, siteverify never called', r.status + JSON.stringify(r.j));

  n0 = stubLines().length;
  const t1 = Date.now();
  r = await json({ ...who('Tsslow Eight'), turnstile: 'slow-1' }, visitor, U5);
  const took = Date.now() - t1;
  ok(r.status === 200 && r.j.ok && stubLines().length === n0 + 1 && took < 6500 && (relay(cfgDir5).match(/turnstile unreachable/g) || []).length === 3,
    `turnstile: siteverify slower than 5 s -> times out, lead accepted + logged (took ${took} ms)`, r.status + JSON.stringify(r.j));
}

// CallTrackingMetrics FormReactor (server 8 -> tests/stub-ctm.php; servers 1-7 have no CTM_* keys)
{
  const U8 = `http://127.0.0.1:${PORT8}/api/lead`;
  const ctmLines = () => existsSync(ctmOut) ? readFileSync(ctmOut, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const relay = dir => { try { return readFileSync(join(dir, 'spool', 'relay.log'), 'utf8'); } catch { return ''; } };
  const retry = () => { try { return readFileSync(join(cfgDir8, 'spool', 'ctm-retry.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
  const lastLead = dir => [...relay(dir).matchAll(/\+00:00 sent lead ([0-9a-f-]{36})/g)].at(-1)?.[1];
  // without fastcgi_finish_request (php -S) the relay runs after the answer is flushed: wait for its log line
  const until = async (fn, ms = 9000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await new Promise(r => setTimeout(r, 50)); } return !!fn(); };
  const ctmLog = id => new RegExp('ctm (sent|FAILED|skipped)[^\\n]*' + id);
  const settle = async dir => { const id = lastLead(dir); await until(() => ctmLog(id).test(relay(dir))); return id; };
  const sid = 'abcDEF1234567890';
  const qWith = (over = {}) => ({ ...quote, ctm_sid: sid, fields: { ...quote.fields, lp: 'ftl-nj', ...over } });

  // off when unconfigured
  r = await json({ ...quote, ctm_sid: sid });
  ok(r.j?.ok && ctmLines().length === 0 && !/ctm/.test(relay(cfgDir)), 'ctm: no CTM_* keys (servers 1-7) -> no CTM call, no log line', String(ctmLines().length));
  for (const [miss, label] of [['CTM_SECRET_KEY', 'secret'], ['CTM_ACCESS_KEY', 'access key'], ['CTM_FORM_ID', 'form id']]) {
    cfg8({ [miss]: '' });
    r = await json(qWith(), {}, U8);
    await new Promise(res => setTimeout(res, 300));
    ok(r.j?.ok && ctmLines().length === 0, `ctm: ${label} empty -> CTM off (no call), lead still emailed`, String(ctmLines().length));
  }
  ok(!/ctm/.test(relay(cfgDir8)), 'ctm: partly configured -> silent (no log line, no error)');
  cfg8();

  // quote: mapping, auth, endpoint
  let n0 = stubLines().length;
  r = await json(qWith(), {}, U8);
  let id = await settle(cfgDir8);
  let c = ctmLines().at(-1), b = c ? JSON.parse(c.raw) : {};
  ok(r.status === 200 && r.j.ok && /^stub-/.test(r.j.id) && Object.keys(r.j).join() === 'ok,id' && stubLines().length === n0 + 1, 'ctm: quote -> same visitor answer {ok,id} + lead emailed', JSON.stringify(r.j));
  ok(c && c.method === 'POST' && c.path === '/api/v1/formreactor/FRT0123abcdEF' && c.auth === 'Basic ' + Buffer.from('ctm-access-local:ctm-secret-local').toString('base64') && /^application\/json/.test(c.ctype || ''),
    'ctm: POST /api/v1/formreactor/<CTM_FORM_ID>, HTTP Basic access:secret, JSON', JSON.stringify({ path: c?.path, ctype: c?.ctype }));
  const wantQ = { phone_number: '5550102030', country_code: '1', caller_name: 'Jane "JD" Doe', email: 'jane@example.com', visitor_sid: sid, custom_form_type: 'quote',
    custom_landing_page: 'ftl-nj', custom_sent_from_page: '/quote/', custom_request_summary: 'Full truckload · Newark, NJ to Atlanta, GA · ready 2026-11-03 · Dry van' };
  ok(JSON.stringify(b) === JSON.stringify(wantQ), 'ctm: quote payload mapping (phone digits, name, email, sid, form type, lp, page, summary)', JSON.stringify(b));
  ok(new RegExp('ctm sent lead ' + id + ' status 200').test(relay(cfgDir8)), 'ctm: success -> relay.log "ctm sent lead <id> status 200"');

  // driver multipart: first + last name, driver summary, never the resume or sms_consent
  r = await post(mp({ ...driverLead, ctm_sid: sid, fields: { ...driverLead.fields, state: 'FL', phone: '+1 (305) 555-0199' } }, 'cv.pdf', pdf), {}, U8);
  await settle(cfgDir8);
  c = ctmLines().at(-1); b = c ? JSON.parse(c.raw) : {};
  ok(r.j?.ok && b.caller_name === 'Ann Lee' && b.phone_number === '3055550199' && b.custom_form_type === 'driver-prequal' && b.custom_request_summary === 'FL · 5 years · Owner operator' && b.custom_landing_page === 'cdl-drivers',
    'ctm: driver -> first+last name, 11-digit +1 phone to 10 digits, state/experience/drive_as summary, lp', JSON.stringify(b));
  ok(!/PDF|cv\.pdf|sms|consent|twic|resume/i.test(c.raw) && c.raw.length < 600, 'ctm: driver payload carries no resume, file name or sms_consent', c?.raw?.slice(0, 200));

  // contact with and without a phone
  r = await json({ ...contact, ctm_sid: sid, fields: { ...contact.fields, phone: '305 555 0100' } }, {}, U8);
  await settle(cfgDir8);
  b = JSON.parse(ctmLines().at(-1).raw);
  ok(r.j?.ok && b.custom_form_type === 'contact' && b.caller_name === 'Sam' && b.custom_request_summary === 'Get a quote · Hello there' && !('custom_landing_page' in b), 'ctm: contact with phone -> topic + message summary', JSON.stringify(b));
  let k0 = ctmLines().length;
  r = await json({ ...contact, ctm_sid: sid }, {}, U8);
  id = await settle(cfgDir8);
  ok(r.j?.ok && ctmLines().length === k0 && new RegExp('ctm skipped: no phone, lead ' + id).test(relay(cfgDir8)), 'ctm: contact without phone -> skipped + logged "ctm skipped: no phone"', String(ctmLines().length - k0));
  r = await json({ ...contact, fields: { ...contact.fields, phone: '555' } }, {}, U8);
  await settle(cfgDir8);
  ok(r.j?.ok && ctmLines().length === k0, 'ctm: phone that is not a US number -> skipped');
  r = await json({ ...contact, fields: { ...contact.fields, phone: '3055550100', message: 'long '.repeat(400) } }, {}, U8);
  await settle(cfgDir8);
  b = JSON.parse(ctmLines().at(-1).raw);
  ok([...b.custom_request_summary].length === 500, 'ctm: message over 500 chars -> summary capped at 500', String(b.custom_request_summary?.length));

  // visitor_sid validation
  for (const [v, want] of [['short7x', false], ['a'.repeat(65), false], ['bad sid!<x>', false], ['1234567890abcdef1234', true], [['x'], false]]) {
    r = await json({ ...qWith(), ctm_sid: v }, {}, U8);
    await settle(cfgDir8);
    b = JSON.parse(ctmLines().at(-1).raw);
    ok(want ? b.visitor_sid === v : !('visitor_sid' in b), `ctm: ctm_sid ${JSON.stringify(String(v).slice(0, 14))} -> ${want ? 'sent' : 'left out'}`, JSON.stringify(b.visitor_sid));
  }

  // test leads: skipped unless CTM_SEND_TESTS
  k0 = ctmLines().length;
  r = await json({ ...contact, fields: { ...contact.fields, phone: '3055550100' } }, { 'X-Lead-Test': 'test-token-local' }, U8);
  await until(() => /ctm skipped: test lead/.test(relay(cfgDir8)));
  ok(r.j?.ok && ctmLines().length === k0 && /ctm skipped: test lead/.test(relay(cfgDir8)), 'ctm: X-Lead-Test lead -> not sent to CTM (CTM_SEND_TESTS off)');
  cfg8({ CTM_SEND_TESTS: 'false' });
  r = await json({ ...contact, fields: { ...contact.fields, phone: '3055550100' } }, { 'X-Lead-Test': 'test-token-local' }, U8);
  await new Promise(res => setTimeout(res, 300));
  ok(ctmLines().length === k0, "ctm: CTM_SEND_TESTS 'false' (string, as set-config writes it) is off");
  cfg8({ CTM_SEND_TESTS: true });
  r = await json({ ...contact, fields: { ...contact.fields, phone: '3055550100' } }, { 'X-Lead-Test': 'test-token-local' }, U8);
  await until(() => ctmLines().length === k0 + 1);
  ok(r.j?.ok && ctmLines().length === k0 + 1 && JSON.parse(ctmLines().at(-1).raw).caller_name === '[TEST] Sam', 'ctm: CTM_SEND_TESTS true -> test lead sent, name marked [TEST]');
  cfg8();

  // failures: the visitor's answer and the email are unchanged, the id goes to ctm-retry.jsonl, the log has the status only
  for (const [m, want, over] of [['fail', 500, {}], ['error', 200, {}], ['ok', 0, { CTM_API_URL: `http://127.0.0.1:${DEAD}/api/v1/formreactor/` }]]) {
    writeFileSync(ctmMode, m); cfg8(over);
    n0 = stubLines().length; const r0 = retry().length;
    r = await json(qWith({ name: 'Ctmfail ' + m }), {}, U8);
    id = await settle(cfgDir8);
    const em = stubLines().at(-1)?.body;
    ok(r.status === 200 && Object.keys(r.j).join() === 'ok,id' && /^stub-/.test(r.j.id) && stubLines().length === n0 + 1 && em.subject === `Quote request: Ctmfail ${m} (O'Brien & Sons)`,
      `ctm: ${over.CTM_API_URL ? 'CTM unreachable' : 'CTM answers ' + m} -> visitor answer + email unchanged`, JSON.stringify(r.j));
    const rt = retry().at(-1);
    ok(retry().length === r0 + 1 && rt.id === id && Object.keys(rt).join() === 'id,at,status' && rt.status === want && new RegExp('ctm FAILED lead ' + id + ' status ' + want).test(relay(cfgDir8)),
      `ctm: ${m}${over.CTM_API_URL ? ' (down)' : ''} -> relay.log "ctm FAILED ... status ${want}" + lead id in ctm-retry.jsonl`, JSON.stringify(rt));
  }
  writeFileSync(ctmMode, 'ok'); cfg8();

  // Resend down (queued) is an accepted lead too: CTM still gets it
  writeFileSync(mode, 'fail');
  k0 = ctmLines().length;
  r = await json(qWith({ name: 'Ctm queued' }), {}, U8);
  await until(() => ctmLines().length === k0 + 1);
  ok(r.j?.ok && r.j.queued === true && Object.keys(r.j).join() === 'ok,queued,id' && JSON.parse(ctmLines().at(-1).raw).caller_name === 'Ctm queued', 'ctm: Resend down -> answer still {ok,queued,id}, lead sent to CTM after it');
  await until(() => /ctm sent lead [^\n]*\n$/.test(relay(cfgDir8)));
  writeFileSync(mode, 'ok');

  // no keys or personal data in the logs
  const logs = relay(cfgDir8) + (existsSync(join(cfgDir8, 'spool', 'php-errors.log')) ? readFileSync(join(cfgDir8, 'spool', 'php-errors.log'), 'utf8') : '') + JSON.stringify(retry());
  ok(!/ctm-secret-local|ctm-access-local|Y3RtLWFj|Jane|jane@|5550102030|3055550|Newark|Ann Lee|Sam\b|abcDEF1234567890|Ctmfail|FRT0123/.test(logs), 'ctm: relay.log / php-errors.log / ctm-retry hold no key, form id, sid or lead data',
    (logs.match(/.*(ctm-secret|Jane|Newark|abcDEF|FRT0123).*/) || [''])[0].slice(0, 160));
  ok(!existsSync(join(cfgDir8, 'spool', 'php-errors.log')), 'ctm: no PHP warnings on any CTM path');

  // CTM_API_URL is honoured only for http://127.0.0.1 (else CTM's real URL); CTM_FORM_ID must look like an id
  {
    const src = readFileSync(join(root, 'public_html/api/lead.php'), 'utf8');
    const f = join(tmp, 'ctmurl.php');
    writeFileSync(f, '<?php\n' + src.match(/const GEM_CTM_URL = .*?;/)[0] + '\n' + src.match(/function gem_ctm_url\(.*?\n}\n/s)[0] +
      "foreach (array(array('http://127.0.0.1:9/api/v1/formreactor/', 'FRT1'), array('http://127.0.0.1/x', 'FRT1'), array('http://localhost:9/', 'FRT1'), array('https://evil.example/', 'FRT1'), array('http://127.0.0.1.evil.example/', 'FRT1'), array('', 'FRT1'), array('', '../x'), array('', 'a b'), array('', 'FRT' . str_repeat('A1', 32))) as $c) echo gem_ctm_url(array('CTM_API_URL' => $c[0], 'CTM_FORM_ID' => $c[1])), '|';");
    const o = await new Promise(res => { const p = spawn('php', [f]); let s = ''; p.stdout.on('data', d => s += d); p.on('close', () => res(s.trim())); });
    const real = 'https://api.calltrackingmetrics.com/api/v1/formreactor/FRT1';
    ok(o === ['http://127.0.0.1:9/api/v1/formreactor/FRT1', 'http://127.0.0.1/x/FRT1', real, real, real, real, '', '', 'https://api.calltrackingmetrics.com/api/v1/formreactor/FRT' + 'A1'.repeat(32)].join('|') + '|', 'ctm: CTM_API_URL override only for http://127.0.0.1; form id validated', o);
  }

  // forms.js sends ctm_sid at the top level: the email (and lead.js parity) is unchanged by it
  await parity('quote JSON + ctm_sid', { ...quote, ctm_sid: sid });

  // CTM slower than 6 s: the call is cut off, the lead is safe, the next visitor is not stuck behind it for long
  writeFileSync(ctmMode, 'slow');
  const t1 = Date.now();
  r = await json(qWith({ name: 'Ctm slow' }), {}, U8);
  const answered = Date.now() - t1;
  id = await settle(cfgDir8);
  const total = Date.now() - t1;
  ok(r.j?.ok && answered < 7000 && total < 8000 && new RegExp('ctm FAILED lead ' + id + ' status 0').test(relay(cfgDir8)) && retry().at(-1).id === id,
    `ctm: CTM slower than 6 s -> timed out, logged + retry (answer after ${answered} ms, relay done after ${total} ms)`, r.status + JSON.stringify(r.j));
  writeFileSync(ctmMode, 'ok');
}

for (const p of procs) p.kill();
try { rmSync(tmp, { recursive: true, force: true }); } catch {}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
