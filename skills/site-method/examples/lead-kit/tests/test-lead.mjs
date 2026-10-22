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

for (const p of procs) p.kill();
try { rmSync(tmp, { recursive: true, force: true }); } catch {}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
