# Craft floor

Adapted from Impeccable `reference/craft-floor.md` (Apache-2.0, Paul Bakaus). Changes: motion rule
replaced by this repo's CLAUDE.md rule; detector/hook references removed; marketing-site notes added.

The approved DESIGN.md / style guide overrides anything here; your own habit does not.

## Verify (checks on the built result, not intentions)

Run them together in one inspection round per page, at 360, 390, 768 and 1534x692 (Arthur's screen).

- **Contrast:** body and placeholder text >= 4.5:1, large text >= 3:1. On colored surfaces tint secondary
  text from that hue or the foreground; never plain gray.
- **Colour discipline:** no pure `#fff` / `#000` as a base - page white and ink are tinted almost
  imperceptibly toward the brand hue (e.g. `oklch(99% 0.004 <hue>)`); every neutral/gray carries a trace of
  that hue (chroma >= 0.005), never zero-chroma gray. The accent (CTA colour) covers <= ~5% of any viewport
  by area; brand-colour bands are not accent. Author tokens in OKLCH (hex fallback not needed); OKLCH ramps lose chroma near white
  and black, so taper chroma at the ends instead of keeping it constant.
- **Depth:** shadows carry an offset and a soft blur. A zero-offset colored halo is decoration.
- **Spatial thesis first:** before layout, name the reading path, what groups, what leads, and the density.
- **Spacing:** tight groups, generous separation, more space above a heading than below it. Page, section
  and card padding use different steps (equal padding everywhere reads flat). Read the computed values.
- **Type:** body measure 65-75ch, balanced headings, obvious scale and weight steps, tracking floor
  -0.04em. Run the real copy at every width and fix what overflows.
- **Motion:** one authored moment per page, not the same entrance on every section. Exponential
  ease-out from an already-visible default. Only `transform` and `opacity` (repo rule - never blur,
  backdrop-filter, clip-path, mask or shadow animation).
- **States:** hover, focus-visible, active, disabled, loading, error, success, empty. Real content,
  working controls, keyboard focus.
- **Browser surfaces:** text selection, caret, focus rings, underline offset, scrollbar (where themed),
  `theme-color`, tabular numerals in data. Theme them from the palette - the cheapest signal that a
  page was built, not assembled.
- **Copy:** the visitor's language. Controls name their action ("Request a quote", not "Submit");
  errors name the problem and the fix.
- **Coverage:** every brief requirement present and findable within seconds.
- **Clickable labels stay on one line** (buttons, nav links, CTAs, tabs, footer links) from 320 to 1920px.
  Fix in order: shorten the label, `white-space: nowrap`, then collapse the row.
- **Stacking:** a named z-index scale in tokens (no `9999`); a second sticky element takes `top: var(--nav-h)`
  and sits below the nav.
- **Dark surfaces:** elevation by a lighter surface, not a black shadow.
- **Screenshots:** no hand-drawn fake browser/phone chrome around them.
- **Hero:** every headline <= 2 lines at every width; the hero image/media covers >= half of the first screen;
  at most two centred elements unless the photo's subject is centred (visual-balance memory); a hint of what
  comes next (proof strip or the next section's edge) is visible on the first screen.
- **One live thing per site:** one thing the visitor can do with real content (an estimate, a check, a
  "see it in your colour"). Works by thumb, has a no-script fallback, sits below the fold or on an inner page,
  never blocks reading, never shows fake data.
- **Instant inner pages (multi-page sites):** speculation rules prerender likely next pages
  (`eagerness: conservative` or `moderate`); analytics waits for `prerenderingchange` (`measurement.md`);
  Lighthouse re-run with tags on. Chromium-only, so it is a progressive enhancement.
- **Button shape:** TMC and anything related to TMC = fully rounded (pill) buttons, always (Erick's request).
  Other clients: corner shape is a style-guide toggle.

## Refuse (category defaults - the brief may earn some back; reaching for one by habit means you were not deciding)

Page scaffolds:
- Same-size cards of icon + heading + text as the page structure. Cards are the lazy container; nested
  cards are always wrong.
- The hero-metric template: big number, small label, supporting stats, accent. If numbers are real and
  strong, integrate them into a sentence or a composed proof block, not a generic stat row.
- A kicker/eyebrow label above every heading. Let the heading carry its own weight. (Allowed only where
  it carries information the heading cannot, e.g. a step number in a real sequence.)
- Section numbers (01 / 02 / 03) unless the sequence itself matters to the reader.
- A modal for a task that needs neither interruption nor protected focus.

Surface habits:
- Gradient text. Emphasis comes from weight or size.
- Glass and blur as decoration.
- A colored `border-left`/`border-right` above 1px on cards, list items, callouts.
- Hard offset shadows (`4px 4px 0`) outside a genuinely neobrutalist world.
- Sparklines, progress rings, soft rounded rectangles standing in for content.
- Monospace as a "technical" costume rather than for code, data or measurement.
- A system display face as the display voice. Self-host a face whose character matches the brand.
- Emoji or unicode glyphs standing in for an icon system. One icon family, one stroke weight.
- Geometric masks approximating a photo subject's edge. Cut a real alpha matte or skip it.
- Stock or AI-generated photos with visible defects (garbled logos, wrong text). Real photos beat flourish.
- Light or dark picked by category. Pick from the use scene: who, where, under what light.

The floor holds the mechanics; it never picks the direction. With every check green, spend the page on
the committed world.
