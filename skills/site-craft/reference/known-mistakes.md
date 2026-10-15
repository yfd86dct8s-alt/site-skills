# Known mistakes (the ledger)

Every mistake Arthur had to catch on a phone or a screenshot goes here once, with the rule that prevents it and the
check that proves it. Read it while building (Moment 1) and run its checks in the review pass (Moment 2), so the next
site does not depend on luck. Arthur 2026-10-12: "vai anotando todos esses erros cometidos, pra não precisarmos dar sorte
de ver no próximo, porque já sabíamos que aconteceria e já nos precavemos."

Format: **symptom** (site, date) - cause - rule - check. Tools live in the client's `tools/` folder (Elevate has the
reference copies: `.claude/skills/site-craft/tools/checks/`); copy them into each new site.

## Fonts and line breaks

1. **The H1 wrapped in 4 lines after a reload and in 3 after a scroll** (iPhone, Elevate, 2026-10-12).
   Cause: WebKit (Safari and every iPhone browser) matches `local()` by FAMILY name and takes weight/style from the
   `@font-face` descriptors; the italic fallback listed only `local('Georgia Italic'), local('Georgia-Italic')`, failed,
   and the italic fell to raw Georgia (8% wider) while the non-preloaded italic web font loaded. iOS kept the stale
   layout until a scroll re-laid the page out.
   The fallback fix alone did NOT stop it on the iPhone (same evening): WebKit fetches a face only when text needs it,
   so a non-preloaded italic always arrives after the first layout, and iOS's own Georgia need not match the Windows
   file the size-adjust was measured on.
   Rules: every metric-matched fallback face ends its `src` with `local('<family>')` (`local('Georgia')`,
   `local('Arial')`) after the full/PostScript names (Chrome and Firefox match those); PRELOAD every face used above the
   fold - the italic of a one-word emphasis too; site.js re-lays h1/h2 out on `document.fonts` `loadingdone`. A
   headline must keep its line count on the fallback, and the real test is Arthur's iPhone after a reload.
   Check: `node tools/font-fallback.mjs <base> / <inner routes>` (every fallback face loads in WebKit and Chromium; h1/h2/
   .lead keep their line count at 360/390/414 with the web fonts held back).

## Shadows, bands and themes

2. **The review cards sat in a hard-edged grey block** (iPhone, dark theme, Elevate, 2026-10-12).
   Cause: (a) a swipe row (`overflow-x: auto`) clips everything outside its padding box, so the cards' big shadow was
   cut into a rectangle; (b) the bands that turn light in the dark theme re-declared colours but not the shadow tokens,
   so they kept the dark theme's black shadows on paper.
   Rule: inside a scroller, use a shadow that fits the scroller's padding (`--shadow-1` + a hairline), or pad the
   scroller for it. An inverted band re-declares EVERY theme token its children read, shadows included.
   Check: screenshot every band at 414 in light and dark, with each swipe row scrolled mid-way; look for hard edges.

3. **The desktop strip under the hero showed its list twice, stacked** (desktop, Elevate, 2026-10-12, live for hours).
   Cause: the marquee's aria-hidden copy was hidden with `.strip__dup { display: none }` (0,1,0) while
   `.strip ul { display: flex }` (0,1,1) displayed it.
   Rule: a rule that hides a helper (marquee copy, mobile-only clone) is at least as specific as the rule that shows the
   element; prefer scoping the copy's display to the breakpoint that needs it.
   Check: at 1534x692 (Arthur's desktop) look at the foot of the first screen and every marquee; at each breakpoint the
   aria-hidden copies are displayed only where the marquee runs.

## Buttons and nav

4. **The secondary button out-shouted the primary** (Elevate hero, 2026-10-12).
   Cause: an outline button (white fill + 2px blue border) beside the gold primary.
   Rule: a secondary next to the primary is either white without a border or a border without a fill - never both.
   Check: squint at the first screen on the phone: the primary is the first thing the eye lands on.

5. **The theme toggle sat in a different place from the other sites** (Elevate, 2026-10-12).
   Cause: a ported nav (TMC/GEMCAP: toggle last on desktop, first in the phone bar) was re-ordered with `order: -1`.
   Rule: ported, approved components keep their placement and behaviour; a deviation is Arthur's call, written in
   `DECISOES.md`.
   Check: compare the nav action order with the reference site at 414 and 1534.

## In-page links and forms

6. **"Get a free case review" landed on the band's intro, with a strip of the previous band above it and the form below
   the fold; after that, every reload jumped back to the same spot** (iPhone, Elevate, 2026-10-12).
   Causes: the CTA pointed at the section, not the form; the browser kept `#case-review-section` in the address, so a
   reload re-ran the jump; the form's own id lived inside `<template data-stamp>` (stamped near the viewport for TBT), so
   a jump to it found nothing; the slot reserving the form's place was 1200px (TMC's long /drivers/ form, ported
   without re-measuring) against a 450-480px form, so the page shrank 730px when the form appeared.
   Rules: a CTA that promises the form lands on the form, centred in the free screen under the nav (Arthur: "centralizado
   verticalmente"), or just under the nav when taller; an in-page jump never leaves `#...` in the address and a page
   opened with a hash drops it after landing; anchors never point only inside a `<template>` - the click stamps the form
   first; a stamping slot reserves the MEASURED height per breakpoint; a CTA on a page that has the form goes to that
   form, not to /contact/.
   Check: `node tools/anchor-landing.mjs <base>` (every visible "#" link on every page, phone WebKit + desktop
   Chromium: target exists, not under the nav, forms centred, no strip of another band, no hash left in the address).

## Porting

7. **Values ported from another site were wrong for this one** (slot height above; nav order above).
   Rule: when porting a component, list the numbers it carries (heights, offsets, orders, breakpoints) and re-measure
   each on the new site before shipping.

## Forms (the full guide: `forms.md`)

8. **The form's Back button was invisible** (Elevate, every page, 2026-10-12, live for hours; Arthur: "tá sem botão de
   voltar no formulário"). Cause: `:is(.section--navy, .section--blue) .btn-outline` turned outline buttons white for the
   dark band, and the white form card inside the band inherited it: white text and border on white.
   Rule: a light card inside a dark band re-declares its own button roles; a band-level button rule always excludes
   `.form-card` / `.on-light`. Check: `node tools/form-flow.mjs` (Back text contrast >= 4.5:1 on the card, light + dark).

9. **Step 1 was a single choice with a Next button** (Elevate, 2026-10-12; Arthur: "deveria ser clique e já passava
   próximo passo"; TMC's quiz already did it). Rule: a step whose only control is one single-choice group advances on a
   tap (220 ms confirmation; arrow keys never advance; a tap on the kept answer advances after Back; preset shows Next).
   Check: `node tools/form-flow.mjs`.

10. **Form details TMC had already solved were rebuilt worse** (Elevate, 2026-10-12: Back at the foot beside Next, focus
    on the first input after a step change, a silent step change for screen readers, first + last name and a required
    call-time select). Cause: the form was ported from GEM's classic quote form without reading TMC's approved quiz.
    Rule: start every form from `forms.md` section 4 (port list) and its checks. Check: `forms.md` section 5.

## Type in shapes

11. **The numbers in the step circles sat ~2px high** (Elevate home + inner pages, iPhone, 2026-10-12; Arthur: "os números
    no círculo estão descentralizados"). Cause: `display: grid; place-items: center` centres the LINE BOX, and a display
    serif's figures do not sit in the middle of it (Newsreader: ascent .75em, figure height ~.7em -> the ink is ~0.1em
    above centre; measured the same in WebKit and Chromium). Rule: any glyph centred in a fixed shape (step circles,
    badges, counters) is centred by its INK: measure it, then nudge (Newsreader: `padding-top: 0.2em` in a border-box
    circle), lining tabular figures. Check: `node tools/circle-center.mjs <base>` (digit vs disc centre <= 1.25 CSS px,
    WebKit + Chromium, 3x).

## Images

12. **One lawyer's card hover read as a zoom on the photo** (Elevate, Seth Karasik, 2026-10-13; Arthur: "nos outros tá
    parecendo que eles aumentam. nesse tá parecendo zoom na imagem"). Cause: the AI-extended background behind him carried
    a palm shadow; the hover scale grew the pattern with him, so the wall visibly zoomed, while the other plain walls hid
    the scale. Rule: portraits that share a hover scale share a plain, pattern-free wall (light falloff only); fix a stray
    one by rebuilding the wall, never by touching the person (`.claude/skills/site-craft/tools/img/people_plainwall.py <key>`). Check: put the team
    portraits side by side and look for any texture behind a head before shipping.


## Interaction

13. **The hero photo sat under a blue veil after a few quick clicks on the theme button; only a reload cleared it**
    (GEMCAP, 2026-10-13; Arthur: "cliquei algumas vezes pra trocar o modo... o único jeito de voltar ao normal é
    recarregando"). Cause: the toggle's View Transition crossfade (~250 ms). While it runs, Chrome hit-tests every click to
    `<html>` (`::view-transition { pointer-events: none }` does NOT change that): repeat clicks were lost, and a double
    click selected what sat under the pointer - the full-bleed hero photo behind the nav - which then wore the
    `::selection` colour until something cleared the selection. Rule: a button that starts a View Transition tracks it
    (`fading` + the theme it heads to), and while it runs a capture `mousedown` on the document is prevented (nothing gets
    selected) and a capture `click` on `<html>` over the button's rect counts as a button click; the button itself
    prevents `mousedown` when `e.detail > 1`. Reference: GEMCAP `07-style-guide/nav.js` theme section. Check:
    `node tools/theme-clicks.mjs <base>` (Chrome + Edge, clicks and double clicks at 0-400 ms gaps: theme parity, no
    selection).
