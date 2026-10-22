// GEMCAP · lead intake (Cloudflare Pages Function, POST /api/lead). The site's three forms (quote, contact, driver
// pre-qualification) post here; each lead goes out as one email to GEMCAP (Arthur 2026-10-20: info@gemcaptrucking.com
// for now, a lead intermediary may come later) through Resend's HTTPS API, sent from TMC's verified domain.
// Source of truth: websites/clientes/gem-cap-trucking/site/functions/ (copied to gemcap-site/functions/ on publish).
// Env (Pages project settings, never in the repo): RESEND_API_KEY (sending key), LEAD_TO, LEAD_FROM; optional
// TEST_TOKEN + TEST_TO: a request with header X-Lead-Test: <TEST_TOKEN> goes to TEST_TO instead (delivery checks).
// Partial leads (step 1 of the quote, no contact details yet) are acknowledged and not emailed.

const FORMS = { quote: 'Quote request', contact: 'Website message', 'driver-prequal': 'Driver pre-qualification' };
const LABELS = {
  need: 'What do you need?', pickup: 'Pickup (city, state or ZIP)', delivery: 'Delivery (city, state or ZIP)', ready: 'Ready date',
  what: 'What is it?', equipment: 'Equipment', hazmat: 'Hazmat', name: 'Name', company: 'Company', email: 'Email',
  phone: 'Phone', notes: 'Notes', topic: 'Topic', message: 'Message', first_name: 'First name', last_name: 'Last name',
  home_phone: 'Home phone', state: 'State', zip: 'ZIP', drive_as: 'Driver type', experience: 'Experience',
  accidents: 'Accidents (3 years)', violations: 'Moving violations (3 years)', twic: 'TWIC card', resume: 'Resume',
  sms_consent: 'SMS consent', lp: 'Landing page',
};
const ALLOWED_HOSTS = [/^gemcap-preview\.pages\.dev$/, /\.gemcap-preview\.pages\.dev$/, /^(www\.)?gemcaptrucking\.com$/, /^localhost$/, /^127\.0\.0\.1$/];
const MAX_FILE = 5 * 1024 * 1024;
const FILE_OK = /\.(pdf|docx?|rtf|txt|odt|jpe?g|png)$/i;

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clean = s => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, 4000);
const nice = v => v.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());

function b64(buf) {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  if (origin) {
    let host = '';
    try { host = new URL(origin).hostname; } catch {}
    if (!ALLOWED_HOSTS.some(r => r.test(host))) return json({ ok: false, error: 'origin' }, 403);
  }
  if (Number(request.headers.get('Content-Length') || 0) > MAX_FILE + 200000) return json({ ok: false, error: 'too large' }, 413);

  let lead, file = null;
  try {
    const type = request.headers.get('Content-Type') || '';
    if (type.includes('multipart/form-data')) {
      const fd = await request.formData();
      lead = JSON.parse(fd.get('lead') || '{}');
      const f = fd.get('resume');
      if (f && typeof f === 'object' && f.size) {
        if (f.size > MAX_FILE || !FILE_OK.test(f.name)) return json({ ok: false, error: 'file' }, 400);
        file = { filename: f.name.replace(/[^\w.\- ]/g, '_').slice(0, 120), content: b64(await f.arrayBuffer()) };
      }
    } else lead = await request.json();
  } catch { return json({ ok: false, error: 'bad request' }, 400); }

  const form = FORMS[lead?.form] ? lead.form : null;
  if (!form) return json({ ok: false, error: 'form' }, 400);
  if (lead.partial) return json({ ok: true, partial: true });
  const f = {};
  for (const [k, v] of Object.entries(lead.fields || {})) if (typeof v === 'string' && v.trim()) f[clean(k).slice(0, 40)] = clean(v);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || '') ? f.email : '';
  if (!email && !f.phone) return json({ ok: false, error: 'contact' }, 400);
  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'not configured' }, 503);

  const who = form === 'driver-prequal' ? [f.first_name, f.last_name].filter(Boolean).join(' ') : f.name;
  const subject = `${FORMS[form]}: ${who || email || f.phone}` + (f.company ? ` (${f.company})` : '') + (form === 'contact' && f.topic ? ` · ${nice(f.topic)}` : '');
  const rows = Object.entries(f).map(([k, v]) => [LABELS[k] || nice(k), /^(drive_as|twic|hazmat|need|topic|equipment)$/.test(k) ? nice(v) : v]);
  if (file) rows.push(['Resume file', `${file.filename} (attached)`]);

  const a = lead.attribution || {};
  const touch = t => !t ? '' : [t.channel, t.utm_source && `source ${t.utm_source}`, t.utm_medium && `medium ${t.utm_medium}`,
    t.utm_campaign && `campaign ${t.utm_campaign}`, (t.gclid || t.gbraid || t.wbraid) && 'Google Ads click', t.fbclid && 'Meta ad click',
    t.landing && `landed on ${t.landing}`, t.referrer && `from ${t.referrer}`].filter(Boolean).map(clean).join(' · ');
  const meta = [['Sent from page', clean(lead.page || '')], ['First visit', touch(a.first)], ['This visit', touch(a.last)]].filter(r => r[1]);

  const table = list => list.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#4A5A78;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;color:#0B1F44;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');
  const html = `<div style="font:15px/1.5 Arial,sans-serif;color:#0B1F44;max-width:640px">
<h2 style="margin:0 0 4px;font-size:20px">${esc(FORMS[form])}</h2>
<p style="margin:0 0 16px;color:#4A5A78">New lead from the GEMCAP website.${email ? ' Reply to this email to answer the sender directly.' : ''}</p>
<table style="border-collapse:collapse;width:100%">${table(rows)}</table>
<p style="margin:24px 0 6px;font-size:13px;color:#4A5A78"><b>Where this lead came from</b></p>
<table style="border-collapse:collapse;width:100%;font-size:13px">${table(meta)}</table></div>`;
  const text = `${FORMS[form]} - new lead from the GEMCAP website\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nWhere this lead came from\n` + meta.map(([k, v]) => `${k}: ${v}`).join('\n');

  const test = env.TEST_TOKEN && request.headers.get('X-Lead-Test') === env.TEST_TOKEN;
  const to = (test ? env.TEST_TO : env.LEAD_TO) || 'info@gemcaptrucking.com';
  const body = { from: env.LEAD_FROM || 'GEMCAP Website <alerts@marketingcartel.com>', to: to.split(',').map(s => s.trim()),
    subject: (test ? '[TEST] ' : '') + subject, html, text };
  if (email) body.reply_to = who ? `${who.replace(/[<>",]/g, '')} <${email}>` : email;
  if (file) body.attachments = [file];

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!r.ok) { console.log('resend', r.status, await r.text()); return json({ ok: false, error: 'send' }, 502); }
  const out = await r.json();
  return json({ ok: true, id: out.id });
}

export const onRequest = () => json({ ok: false, error: 'method' }, 405);
