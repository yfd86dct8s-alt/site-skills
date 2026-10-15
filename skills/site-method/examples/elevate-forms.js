/* ELV · forms (consultation, contact). Loaded with defer on pages that have a form.
   Markup contract (see src/components/*Form.astro):
     <form data-form="quote" data-endpoint="" data-after="/thank-you/" novalidate>
       .form-step[data-step="1"] ... [data-next]   .form-step[data-step="2"] ... [data-back]   (steps optional)
       .field > label/legend + control + .field__error#id     radio groups: fieldset.field[data-required-group]
       .form-status[role=status]                                progress: .progress (decoration) + [data-step-label] (live)
       .form-step[data-auto] = a step whose only control is one single-choice group: a tap advances (TMC's quiz rule)
       [data-back] lives in the card head (one button, hidden on step 1). Rules: site-craft/reference/forms.md
   Ready to connect: data-endpoint is empty until the client says where leads go (site/README.md: lead delivery). With no
   endpoint a submit never fakes success: it says the form is not connected yet and gives the phone and email.
   With an endpoint: POST JSON (fields + attribution), then the thank-you page. Step 1 of the quote is also sent as a
   partial lead when data-partial="1". Forms inside <template data-stamp> are stamped near the viewport (Chrome's
   autofill parse costs ~50 ms of TBT at load for a form on the page). */
(function () {
  'use strict';
  var d = document;
  // keep in sync with src/data/site.ts. MAIL stays empty until the firm gives a public inbox (TODO).
  var PHONE = '(561) 770-3335', TEL = 'tel:+15617703335', MAIL = '';
  var track = function (e, o) { if (window.elvTrack) window.elvTrack(e, o || {}); };

  /* ---------- stamping below-the-fold forms ---------- */
  function stamp(tpl) {
    var slot = tpl.previousElementSibling && tpl.previousElementSibling.classList.contains('form-slot') ? tpl.previousElementSibling : null;
    var frag = tpl.content.cloneNode(true);
    tpl.replaceWith(frag);
    if (slot) slot.remove();
  }
  var tpls = d.querySelectorAll('template[data-stamp]');
  if (tpls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var tpl = e.target.nextElementSibling;
          if (tpl && tpl.tagName === 'TEMPLATE') { stamp(tpl); initAll(); }
        });
      }, { rootMargin: '900px 0px' });
      Array.prototype.forEach.call(tpls, function (t) { var s = t.previousElementSibling; if (s && s.classList.contains('form-slot')) io.observe(s); else { stamp(t); } });
      // a jump straight to the form (#apply) must find it there
      if (location.hash) { var target = d.querySelector(location.hash.replace(/[^#\w-]/g, '')); if (target && target.querySelector('template[data-stamp]')) { Array.prototype.forEach.call(target.querySelectorAll('template[data-stamp]'), stamp); } }
      addEventListener('hashchange', function () { Array.prototype.forEach.call(d.querySelectorAll('template[data-stamp]'), stamp); initAll(); });
      // site.js asks for the form before it scrolls a CTA click to it: the landing is measured on the real form, not the slot
      // a fast keyboard user can Tab past a form still in its template: the first Tab stamps every form
      addEventListener('keydown', function onTab(e) { if (e.key !== 'Tab') return; removeEventListener('keydown', onTab); Array.prototype.forEach.call(d.querySelectorAll('template[data-stamp]'), stamp); initAll(); });
      addEventListener('elv:stamp', function () { Array.prototype.forEach.call(d.querySelectorAll('template[data-stamp]'), stamp); initAll(); });
    } else Array.prototype.forEach.call(tpls, stamp);
  }

  /* ---------- validation ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function fieldOf(el) { return el.closest('.field'); }
  function setError(field, on, focusEl) {
    if (!field) return;
    var err = field.querySelector('.field__error');
    var controls = field.querySelectorAll('input, select, textarea');
    field.classList.toggle('is-error', on);
    Array.prototype.forEach.call(controls, function (c, i) {
      if (on) { c.setAttribute('aria-invalid', 'true'); if (err && (c.type !== 'radio' || i === 0)) c.setAttribute('aria-describedby', err.id); }
      else { c.removeAttribute('aria-invalid'); if (err && c.getAttribute('aria-describedby') === err.id) c.removeAttribute('aria-describedby'); }
    });
  }
  function invalid(c) {
    if (c.disabled) return false;
    var v = (c.value || '').trim();
    if (c.type === 'checkbox') return c.required && !c.checked;
    if (c.required && !v) return true;
    if (!v) return false;
    if (c.type === 'email') return !EMAIL.test(v);
    if (c.type === 'tel') return v.replace(/\D/g, '').length < 10;
    if (c.dataset.zip != null) return !/^\d{5}(-\d{4})?$/.test(v);
    return false;
  }
  function validate(scope) {
    var bad = [];
    var skip = function (el) { return !!el.closest('[data-when][hidden]'); };   // questions for another situation
    Array.prototype.forEach.call(scope.querySelectorAll('[data-required-group]'), function (g) {
      if (skip(g)) return;
      var on = !g.querySelector('input:checked');
      setError(g, on); if (on) bad.push(g.querySelector('input'));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('input:not([type=radio]), select, textarea'), function (c) {
      if (c.type === 'hidden' || c.type === 'file' || skip(c)) return;
      var f = fieldOf(c); if (!f || f.hasAttribute('data-required-group')) return;
      var on = invalid(c); setError(f, on); if (on) bad.push(c);
    });
    if (bad.length) bad[0].focus();
    return bad.length === 0;
  }

  /* ---------- one form ---------- */
  function init(form) {
    if (form.dataset.ready) return;
    form.dataset.ready = '1';
    var kind = form.dataset.form;
    var steps = form.querySelectorAll('.form-step');
    var status = form.querySelector('.form-status');
    var started = false;

    form.addEventListener('input', function (e) {
      if (!started) { started = true; track('form_start', { form: kind }); }
      var f = fieldOf(e.target); if (f && f.classList.contains('is-error') && !invalid(e.target)) setError(f, false);
    });
    form.addEventListener('change', function (e) {
      var f = e.target.closest('[data-required-group]'); if (f && f.querySelector('input:checked')) setError(f, false);
      // a choice that reveals its own follow-up questions (select or radio group): the others hide and stay out of validation
      var sel = e.target.closest('[data-reveal]');
      if (sel) { var val = sel.tagName === 'SELECT' ? sel.value : e.target.value;
        Array.prototype.forEach.call(form.querySelectorAll('[data-when]'), function (h) { h.hidden = h.dataset.when !== val; }); }
    });

    var reduced = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
    var backBtn = form.querySelector('.form-card__head [data-back]');
    function current() { var c = form.querySelector('.form-step:not([hidden])'); return c ? Number(c.dataset.step) : 1; }
    function show(n) {
      Array.prototype.forEach.call(steps, function (s) { s.hidden = s.dataset.step !== String(n); });
      Array.prototype.forEach.call(form.querySelectorAll('.is-picked'), function (g) { g.classList.remove('is-picked'); });
      if (backBtn) backBtn.hidden = n === 1;
      var bar = form.querySelector('.progress');
      if (bar) bar.querySelector('span').style.setProperty('--p', n / steps.length);
      var lbl = form.querySelector('[data-step-label]');
      if (lbl) lbl.innerHTML = lbl.dataset['label' + n] || lbl.innerHTML;   // aria-live: the new step is announced
      var cur = form.querySelector('.form-step[data-step="' + n + '"]');
      if (!cur) return;
      // back on a one-tap step: the answer is kept, so its Next shows (a tap on the kept answer also advances)
      var auto = cur.hasAttribute('data-auto') && cur.querySelector('[data-auto-next]');
      if (auto && cur.querySelector('input:checked')) auto.hidden = false;
      cur.classList.remove('is-entering'); void cur.offsetWidth; cur.classList.add('is-entering');
      // the card's top never sits under the fixed nav after a step change (phones: the form is often scrolled)
      var head = form.querySelector('.form-card__head') || cur;
      var pad = parseFloat(getComputedStyle(d.documentElement).scrollPaddingTop) || 0;
      if (head.getBoundingClientRect().top < pad) head.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      // focus the step's question, not its first input (no keyboard popping up on phones; screen readers hear the question)
      var q = Array.prototype.find.call(cur.querySelectorAll('legend, .field__label'), function (el) { return !el.closest('[hidden]'); });
      if (q) { if (!q.hasAttribute('tabindex')) q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
    }
    function next(cur) {
      if (!validate(cur)) return;
      track('form_step', { form: kind, step: Number(cur.dataset.step) + 1 });
      if (form.dataset.partial === '1' && form.dataset.endpoint) send(true);
      show(Number(cur.dataset.step) + 1);
    }
    /* one-tap steps: a pointer pick advances after a short confirmation (the other options dim); arrow keys only move the
       choice (keyboard browsing never jumps ahead): Enter, Space or the Next button that then shows commit it */
    var kbd = false, changed = false;
    function autoStep(el) { return el && el.type === 'radio' ? el.closest('.form-step[data-auto]') : null; }
    function pick(st) {
      if (st.dataset.busy) return;
      st.dataset.busy = '1';
      var g = st.querySelector('[data-required-group]'); if (g) g.classList.add('is-picked');
      setTimeout(function () { delete st.dataset.busy; if (!st.hidden) next(st); }, reduced() ? 0 : 220);
    }
    form.addEventListener('keydown', function (e) {
      if (/^Arrow/.test(e.key) && autoStep(e.target)) { kbd = true; setTimeout(function () { kbd = false; }, 0); }
    });
    form.addEventListener('change', function (e) {
      var st = autoStep(e.target); if (!st) return;
      changed = true; setTimeout(function () { changed = false; }, 0);   // read by a click handler's timeout queued before it
      if (kbd) { var f = st.querySelector('[data-auto-next]'); if (f) f.hidden = false; } else pick(st);
    });
    form.addEventListener('click', function (e) {
      // a tap on the answer that is already picked fires no change: it advances too
      var st = autoStep(e.target); if (!st) return;
      var inp = e.target;
      setTimeout(function () { if (!changed && !kbd && inp.checked) pick(st); changed = false; }, 0);
    });
    form.addEventListener('click', function (e) {
      var nx = e.target.closest('[data-next]'), bk = e.target.closest('[data-back]');
      if (nx) next(nx.closest('.form-step'));
      if (bk) show(Math.max(1, current() - 1));
    });

    function payload(partial) {
      var o = { form: kind, partial: !!partial, page: location.pathname, sent: new Date().toISOString(), attribution: window.elvAttribution ? window.elvAttribution() : null, fields: {} };
      new FormData(form).forEach(function (v, k) {
        var el = form.elements[k]; var node = el && (el.length && !el.tagName ? el[0] : el);
        if (node && node.closest && node.closest('[data-when][hidden]')) return;   // a branch the visitor did not choose
        if (typeof v === 'string') o.fields[k] = v; else if (v && v.name) o.fields[k] = v.name; });
      return o;
    }
    function say(kindCls, html) {
      if (!status) return;
      status.className = 'form-status form-status--' + kindCls;
      status.innerHTML = '';
      setTimeout(function () { status.innerHTML = html; status.classList.add('is-on'); }, 60);   // re-announced each time
    }
    function send(partial) {
      var file = !partial && form.querySelector('input[type=file]');
      if (file && file.files && file.files.length) {   // a resume: multipart, the JSON travels as one field beside the file
        var fd = new FormData(); fd.append('lead', JSON.stringify(payload(false))); fd.append(file.name, file.files[0]);
        return fetch(form.dataset.endpoint, { method: 'POST', body: fd });
      }
      return fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(partial)), keepalive: !!partial });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nx = form.querySelector('.form-step:not([hidden]) [data-next]');   // Enter inside step 1 = Next, never the final send
      if (nx) { nx.click(); return; }
      var scope = steps.length ? form.querySelector('.form-step:not([hidden])') : form;
      if (!validate(scope)) return;
      var btn = form.querySelector('[type=submit]');
      if (btn && btn.getAttribute('aria-disabled') === 'true') return;
      if (!form.dataset.endpoint) {
        track('form_submit_unconnected', { form: kind });
        say('info', '<b>This form is not connected yet.</b><span>Your answers are still here. Until it goes live, please call us at <a href="' + TEL + '">' + PHONE + '</a>' + (MAIL ? ' or email <a href="mailto:' + MAIL + '">' + MAIL + '</a>' : '') + '.</span>');
        return;
      }
      var label = btn ? btn.innerHTML : '';
      if (btn) { btn.setAttribute('aria-disabled', 'true'); btn.setAttribute('aria-busy', 'true'); btn.innerHTML = '<span class="btn__spin" aria-hidden="true"></span>Sending…'; }
      send(false).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        track('generate_lead', { form: kind });
        location.href = form.dataset.after || '/thank-you/';
      }).catch(function () {
        if (btn) { btn.removeAttribute('aria-disabled'); btn.removeAttribute('aria-busy'); btn.innerHTML = label; }
        say('info', '<b>We couldn’t send it.</b><span>Please try again, or call us at <a href="' + TEL + '">' + PHONE + '</a>.</span>');
      });
    });
  }
  function initAll() { Array.prototype.forEach.call(d.querySelectorAll('form[data-form]'), init); }
  initAll();
})();
