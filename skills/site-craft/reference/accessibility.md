Distilled from addyosmani/web-quality-skills `accessibility` v2.0 (MIT, commit afa8da9) and jakubkrehel/skills `better-accessibility` (MIT, commit c0588bb), read 2026-10-12. Changes: condensed to WCAG 2.2 AA essentials for marketing sites; Chrome DevTools MCP steps dropped (we use web-toolbox Playwright/Lighthouse); reordered by priority; ties to our focus-ring, motion and form rules.

# Accessibility (WCAG 2.2 AA for every site)

Target AA. Base basics (alt text, contrast 4.5:1 text / 3:1 large text and UI, labels, headings, landmarks,
`lang`) live in `web-interface-checklist.md`; this file is the 2.2 layer and the test method.

**A Lighthouse 100 is not conformance.** Automated tools catch only a subset of barriers. A page is done
when Lighthouse passes AND the manual walk below passes.

## Priority order when triaging

Accessible names > keyboard operation > focus and dialogs > semantics > forms > announcements > contrast >
motion.

## WCAG 2.2 additions that bite our sites

| Criterion | What it means here |
|---|---|
| 2.4.11 Focus not obscured | A focused element must not be fully hidden by the sticky header, cookie bar, or bottom action bar. Add `scroll-padding-top/bottom` equal to those bars; tab through the page and watch. |
| 2.5.8 Target size (min) | Interactive targets at least 24x24 CSS px (or enough spacing). We already use >= 44px on mobile; inline text links in body copy are exempt but footer link lists need height/spacing. |
| 2.5.7 Dragging movements | Any drag (sliders, carousels, sortable) needs a single-pointer alternative: prev/next buttons, tap. |
| 3.3.8 Accessible authentication | No cognitive tests (memorising, retyping puzzles) to log in; allow paste and password managers; CAPTCHAs need an alternative. Applies to any client portal login; a honeypot is fine. |
| 3.2.6 Consistent help | Phone/contact/chat links appear in the same place across pages (header and footer in the same order). |
| 3.3.7 Redundant entry | Do not make people retype what they already gave in the same flow (multi-step quote form carries answers; billing = shipping type prompts). |
| 2.4.13 / others | Focus appearance is AAA; still, keep a visible 2px ring at 3:1 contrast. |

## Rules that catch most real failures

- Native elements first (`button`, `a href`, `input`, `dialog`); ARIA only where HTML has no equivalent.
  A `div` with `onclick` is a bug.
- Visible focus: `:focus-visible` ring on keyboard only (no ring after mouse/tap - Arthur's rule), never
  `outline: none` without a replacement. Ring contrast >= 3:1 on every background it lands on.
- Dialogs/menus/sheets: trap focus inside while open, Esc closes, focus returns to the trigger.
  Prefer native `<dialog>` or `inert` on the page behind.
- Disabled means unavailable: do not leave a disabled button focusable with a meaning; explain why.
- Do not rely on colour alone (errors: icon + text + colour). Links in body text are distinguishable
  without colour (underline).
- Nothing the user needs runs on a timer (auto-advancing carousels pause/stop; no timeouts on forms).
- Respect `prefers-reduced-motion`; 200% zoom and text-only resize (320 CSS px reflow) must not clip or scroll
  horizontally.
- Alt text by purpose: informative = what it conveys; decorative = `alt=""`; logo links = the destination;
  functional icons get names. Branded generated art that carries no information is decorative.
- `tel:` and `mailto:` links have text that states the number/purpose, not "click here".

## Forms

Visible `<label>` bound to each control; group radios with `fieldset/legend`; required marked in text, not
only `*`; `autocomplete` tokens; errors tied via `aria-describedby`, `aria-invalid` on the field, and an
error summary or focus to the first error; status messages (`role="status"`/`aria-live="polite"`) for
sending/success so a screen-reader user hears the result. Copy of errors: see site-copy
`forms-cro.md`. Do not block paste.

## Manual test (every page set, before showing Arthur)

1. Keyboard only: Tab through the whole page, open/close the menu and every dialog, submit the form with
   Enter, reach every CTA and the phone link. Order matches visual order, focus never lost or hidden.
2. Zoom the browser to 200% and 400% width-equivalent (320 px): nothing clipped, no horizontal scroll.
3. `prefers-reduced-motion` emulated: no motion except opacity fades or nothing.
4. Read the accessibility tree snapshot (Playwright `ariaSnapshot`) for names, roles, headings, landmarks.
5. Screen reader script (NVDA on Arthur's Windows PC, or VoiceOver on his iPhone): page title read first; skip link
   works; landmarks labelled (NVDA `D`); heading outline sensible (`H`, `Insert+F7`); each input's name read with
   it; required and errors announced; links opening a new tab say so; sending/success status announced. List findings.
6. Evidence loop: Lighthouse a11y -> localise failing nodes -> fix source -> re-run the same checks.

Report in `review.md` format: P0 blockers (no keyboard path, focus trap, form unusable) before taste.
