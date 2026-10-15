# Web interface checklist

Vendored from Vercel Labs `web-interface-guidelines` `command.md` (MIT), fetched 2026-10-02 and frozen
here (the upstream skill re-fetches it at runtime; we do not). React/Next/hydration items dropped;
repo overrides marked **[repo]**.

Output: group by file, `file:line - issue`, terse, no preamble.

## Accessibility
- Icon-only buttons need `aria-label`; decorative icons `aria-hidden="true"`.
- Form controls need `<label>` (or `aria-label`); labels clickable.
- `<button>` for actions, `<a>` for navigation - never `<div>` with a click handler.
- Images need `alt` (`alt=""` if decorative).
- Async updates (validation, form result) announced with `aria-live="polite"`.
- Semantic HTML before ARIA. Headings hierarchical h1-h6; one h1; skip link to main content.
- `scroll-margin-top` on anchored sections (clears the sticky header).

## Focus
- Visible focus on every interactive element; never `outline: none` without a replacement.
- `:focus-visible` over `:focus`; `:focus-within` for compound controls.
- Sticky header / bottom bar / overlays must not cover the focused element.

## Forms
- Inputs have `name` and the right `autocomplete` token **[repo: lead forms always use real autocomplete
  tokens - the upstream "autocomplete=off on non-auth fields" rule is NOT applied]**.
- Correct `type` (`email`, `tel`) and `inputmode` (ZIP = `numeric`). Never block paste.
- `spellcheck="false"` on email and codes. Checkbox/radio + label share one hit target.
- Submit stays enabled until the request starts; show progress while sending.
- Errors inline next to the field; focus the first error on submit; message says how to fix it.
- Placeholders show an example pattern and end with "…"; never replace the label.

## Animation
- Honor `prefers-reduced-motion`. Animate `transform`/`opacity` only. Never `transition: all`.
- Correct `transform-origin`; SVG transforms on a `<g>` with `transform-box: fill-box`.
- Interruptible; autoplay motion > 5s needs a pause control; muted decorative loops stop under reduced motion.

## Typography
- `…` not `...`; curly quotes; `&nbsp;` in units and brand names that must not break.
- `tabular-nums` for compared numbers; `text-wrap: balance` on headings.

## Content
- Containers survive long words and long content (`overflow-wrap: anywhere`, `min-width: 0` on flex children).
- No broken UI for empty values.

## Images
- Explicit `width` and `height` (or `aspect-ratio`) on every image - no CLS.
- Below the fold: `loading="lazy"` + `decoding="async"`. LCP image: `fetchpriority="high"`, never lazy.
- Responsive `srcset`/`sizes`, AVIF/WebP. Prefer muted `<video>` over GIF, with a still fallback.

## Performance
- `preconnect` only for third-party origins actually used; preload the above-the-fold font only.
- No layout reads during interaction loops; batch DOM reads/writes.
- `content-visibility: auto` for long below-fold sections (with `contain-intrinsic-size`).

## Navigation
- Links are real `<a>` (Cmd/Ctrl/middle-click work). Expanded panels/tabs reachable by URL when it helps sharing.

## Touch
- `touch-action: manipulation`; tap highlight set intentionally; `overscroll-behavior: contain` in sheets.
- Swipe/drag gestures always have a tap and keyboard alternative. No `autofocus` on mobile.

## Layout
- Full-bleed and fixed bars respect `env(safe-area-inset-*)`. No horizontal page scroll.
- Flex/grid over JS measurement.

## Theming
- `<meta name="theme-color">` matches the header/page background. `color-scheme` set.
- Native `<select>` gets explicit `background-color` and `color`.

## Locale
- Dates/numbers via `Intl.*` when rendered by script. Brand names that auto-translate badly get
  `translate="no"`.

## States
- Buttons and links have hover (gated to fine pointers), active and focus states; interactive states
  raise contrast over rest.

## Copy
- Active voice; numerals for counts; specific button labels ("Request a quote", not "Submit").
- Error messages include the next step. **[repo: casing follows the client's DESIGN.md - Title Case is
  not imposed.]**

## Flag on sight
`user-scalable=no` / `maximum-scale=1`; paste blocked; `transition: all`; `outline: none` without
replacement; click handlers on `div`/`span`; images without dimensions; unlabeled inputs or icon
buttons; animated GIF where video fits; gesture-only actions.
