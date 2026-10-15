# Effects - CSS recipes

Our own recipes, reimplemented from ideas seen in Kinetics (ckissi/kinetics), MicroKit (microkit.co), Magic UI
and Aceternity's free tier (scan: `.claude/skills/site-method/examples/links-scan-2026-10-14.md`). No code copied: those
are React/Tailwind/Framer Motion, and we never install them. Every recipe obeys `motion.md`: transform/opacity
only, nothing above the fold waits on it, hover gated to `(hover: hover) and (pointer: fine)`, reduced motion
handled. Use one or two per site, where they serve a purpose (feedback, proof, attention on the CTA). A sober brand
(legal, finance, health...) gets the quiet ones (press, lift, fill); a hot "wow" is the hero's single authored moment, not these.

## 1. Spring easing tokens (the "weight")

Real damped-spring curves sampled into CSS `linear()` (computed 2026-10-14, 20 steps; settle to 0.2%):

```css
:root {
  /* zeta 0.75: 2.8% overshoot, settles in ~320ms. Press release, toggles, chips. */
  --ease-spring-snappy: linear(0, 0.07, 0.224, 0.405, 0.577, 0.723, 0.836, 0.918, 0.972, 1.004, 1.021, 1.028,
    1.028, 1.024, 1.019, 1.014, 1.01, 1.006, 1.003, 1.001, 1);
  /* zeta 0.6: 9.3% overshoot, settles in ~520ms. Card lift, menu-sheet arrival. Too lively for small UI. */
  --ease-spring-lift: linear(0, 0.108, 0.34, 0.594, 0.809, 0.962, 1.052, 1.09, 1.093, 1.076, 1.052, 1.029,
    1.011, 0.999, 0.993, 0.991, 0.992, 0.994, 0.996, 0.998, 1);
}
```

The visible motion ends at ~60% of the duration; the tail is sub-pixel, so a 320ms spring reads as ~200ms and
stays within the "UI under 300ms" feel. `linear()` is Baseline (Chrome 113, Safari 17.2, Firefox 112). Through a
custom property an older browser cannot fall back to an earlier declaration (invalid at computed time = the
initial `ease`), which is an acceptable degradation; no extra code for it.

## 2. Press with release spring (every pressable)

```css
.btn { transition: transform 320ms var(--ease-out); transition-timing-function: var(--ease-spring-snappy); }
.btn:active { transform: scale(0.97); transition-duration: 100ms; transition-timing-function: var(--ease-out); }
```

Down is quick and plain; the release springs back. Never springs on the way down.

## 3. Card lift (hover, desktop only)

```css
@media (hover: hover) and (pointer: fine) {
  .card { transition: transform 520ms var(--ease-out); transition-timing-function: var(--ease-spring-lift); }
  .card::after { /* the shadow lives on a pseudo-element: animate its opacity, never box-shadow */
    content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: var(--shadow-lifted);
    opacity: 0; transition: opacity 240ms var(--ease-out); pointer-events: none; }
  .card:hover { transform: translateY(-4px); }
  .card:hover::after { opacity: 1; }
}
```

`.card` needs `position: relative`. 4px of lift at most; 2px on dense grids.

## 4. Fill button (the primary CTA's hover)

```css
.btn-fill { position: relative; overflow: hidden; isolation: isolate; }
.btn-fill::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--fill);
  transform: scaleX(0); transform-origin: left; transition: transform 280ms var(--ease-out); }
@media (hover: hover) and (pointer: fine) { .btn-fill:hover::before { transform: scaleX(1); } }
```

The label color changes with plain `color` transition (cheap, tiny element). Check the label's contrast in both
states. Variant: `transform-origin` follows the side the pointer entered (set by 4 lines of JS), only if the site
already ships JS below the fold.

## 5. Cursor glow (dark bands only, desktop only)

A soft light that follows the pointer inside a card or the CTA band. The glow is a pseudo-element moved by
`transform`, never a repainted `background`:

```css
.glow { position: relative; overflow: hidden; }
.glow::before { content: ""; position: absolute; width: 280px; height: 280px; left: -140px; top: -140px;
  border-radius: 50%; background: radial-gradient(closest-side, var(--glow-color), transparent);
  transform: translate(var(--gx, -999px), var(--gy, -999px)); opacity: 0; transition: opacity 200ms var(--ease-out);
  pointer-events: none; }
@media (hover: hover) and (pointer: fine) { .glow:hover::before { opacity: 1; } }
```

```js
// one listener per page, below-the-fold module; rAF-throttled
document.addEventListener('pointermove', (e) => {
  const el = e.target.closest?.('.glow'); if (!el) return;
  const r = el.getBoundingClientRect();
  requestAnimationFrame(() => { el.style.setProperty('--gx', `${e.clientX - r.left}px`);
    el.style.setProperty('--gy', `${e.clientY - r.top}px`); });
}, { passive: true });
```

Reduced motion: hide the glow (`.glow::before { display: none }`).

## 6. Marquee (logo or review strip)

```html
<div class="marquee" aria-label="Client reviews"><div class="marquee-track">ITEMS ITEMS-COPY(aria-hidden)</div></div>
```

```css
.marquee { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.marquee-track { display: flex; gap: var(--gap); width: max-content;
  animation: marquee var(--marquee-dur, 40s) linear infinite; }
@keyframes marquee { to { transform: translateX(calc(-50% - var(--gap) / 2)); } }
.marquee:hover .marquee-track, .marquee:focus-within .marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; flex-wrap: wrap; width: auto; } .marquee-track [aria-hidden] { display: none; } }
```

The duplicated set carries `aria-hidden="true"` and no focusable links. `mask-image` is static (not animated).
Never above the fold on mobile (constant motion competes with the LCP and the CTA). Speed: ~40px/s; a review
strip must be slow enough to read.

## 7. Number ticker (proof figures)

Counts up once when the figure enters the viewport. Only for strong numbers (see the no-weak-numbers memory).

```css
.ticker { font-variant-numeric: tabular-nums; display: inline-block; min-width: var(--ticker-ch, 4ch); }
```

```js
// below-the-fold module; the final number is in the HTML (no-JS, SEO and screen readers get it)
const io = new IntersectionObserver((entries) => entries.forEach(({ isIntersecting, target }) => {
  if (!isIntersecting) return; io.unobserve(target);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const end = Number(target.dataset.value), t0 = performance.now(), d = 900;
  const fmt = new Intl.NumberFormat('en-US');
  const step = (t) => { const p = Math.min((t - t0) / d, 1), e = 1 - Math.pow(1 - p, 3);
    target.textContent = fmt.format(Math.round(end * e)) + (target.dataset.suffix ?? '');
    if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.ticker[data-value]').forEach((el) => io.observe(el));
```

Reserve the final width (`min-width` in `ch`, tabular figures) so nothing shifts while it counts.
`aria-live` stays off: the HTML already holds the final number.

## 8. Reveal without JS (scroll-driven)

Our reveal (motion.md, reveal-pace memory) is an IntersectionObserver. Where supported, CSS can do it with no JS:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: reveal linear both; animation-timeline: view(); animation-range: entry 0% entry 40%; }
    @keyframes reveal { from { opacity: 0; transform: translateY(16px); } }
  }
}
```

Scroll-linked, so the pace follows the scroll (it does not fire at a fixed 240/320ms). Use it for decorative
items only; key content keeps the IO reveal, which has the approved pace. Never `filter: blur()` (repo rule).

## 9. Word-by-word headline (below the fold only)

Split at build time (Astro), not in the browser: each word in `<span style="--i:N">`, the full sentence in an
`aria-label` on the heading and the spans `aria-hidden`. Reveal = opacity + 0.3em translateY with
`transition-delay: calc(var(--i) * 40ms)`, capped at ~10 words. Never on the hero headline (LCP text).

## 10. Hover-reveal card (team, services)

Extra line or CTA hidden at rest: `opacity: 0; transform: translateY(8px)` -> visible on `:hover` and
`:focus-within`. On touch it is always visible (the hover gate), so the content must make sense shown.

## Not taken

Spotlight/beam borders animating a conic angle (`@property` repaints every frame), morphing text, particles,
3D tilt (perspective transforms on large cards cost compositing on phones). WebGPU/Three.js, GSAP and Anime.js
are not defaults, but not banned: see the heavy-library exception in `SKILL.md` (strong specific idea, below the
fold or on interaction, reduced-motion fallback, Lighthouse gate, Arthur sees it first).

## Small art and delight

- Icons, diagrams and marks: CSS/SVG first; never an unmodified library illustration; no Lottie.
- Delight never delays the task, never adds a claim, and never costs more than the moment it decorates.
