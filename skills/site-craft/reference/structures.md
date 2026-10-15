# Structures: page macrostructures and component archetypes

Source: Hallmark by Nutlope (MIT, github.com/Nutlope/hallmark), `references/macrostructures/` and
`references/components/`. Rewritten, no text copied; our overrides win (operating-rules.md, memories, DESIGN.md,
`craft-floor.md`, `motion.md`, `mobile.md`, `forms.md`, `effects.md`, `imagery.md`).

## How to use (phase 4, architecture + wireframe)

1. Name the page's goal and funnel first (site-method, funnel architecture). The macrostructure is how that page
   carries its section table; it never replaces the table (every section still names its funnel step + objection).
2. Pick one macrostructure per page type (home, service/product page, about, listing, article, FAQ, docs hub). Pages
   of one site may use different ones; one page uses one.
3. Pick the nav and footer archetypes alongside it - they are part of the page shape.
4. Record in the client's `DESIGN.md` under **Structure fingerprint**: macrostructure per page type, nav, footer,
   and the six axes: **heading placement, body composition, divider language, button voice, image treatment,
   reveal pattern**.
5. Variety rule: a new site differs from the last two clients on **>= 3 of the six axes** (review.md A7). Ported
   chrome (nav, menu sheet, form, footer from an approved site) is exempt.
6. When torn, show Arthur 2-3 picks from different families in the wireframe, with a star on the default.

Motion in any archetype below obeys `motion.md`: only `transform`/`opacity`, reveals reserve their space, nothing
above the fold waits on a reveal or a ticker, one authored moment per page, `prefers-reduced-motion` respected,
hover gated to `(hover: hover) and (pointer: fine)`. Where Hallmark animates something else (height,
`grid-template-rows`, clip-path unmask, blur, stroke draw-on), the override is "fade/translate instead, or none". Every archetype is mobile-first: it must read as a single fluid column from 320px before any desktop layout.

## Macrostructures (21)

Format: what it is - fits - our overrides.

**01 Bento Grid** - irregular grid of mixed-span tiles (feature, quote, image, figure); rhythm from size variety.
Fits: SaaS/product feature pages, multi-service overviews, any page with several equal entry points. Overrides:
mixed spans, never same-size icon cards (craft-floor); even tile counts, no orphan tile at any width; phones get one
column in funnel order; reveal none or one-shot fade.

**02 Long Document** - continuous prose, heads emerging from the flow, inline links instead of blocks.
Fits: about/mission, case study, blog article, policy, docs article, founder post. Overrides: measure 65-75ch;
headings stay real `h2/h3` (outline); on a lead site the site's one CTA still exists (inline + mobile action bar).

**03 Marquee Hero** - the first screen is one huge statement or image; no CTA in it; the page turns into
something else below. Fits: portfolio, studio, campaign, about. Overrides: fails the 5-second first-timer check
(review.md) on a primary page - use only where that page's goal allows; a lead home keeps promise + CTA in the
first screen. Display text is the LCP: metric-matched fallback, no entrance animation, no overflow at 320px.

**04 Stat-Led** - one large figure plus a worded headline; the rest of the page backs it. Fits: B2B, impact,
fundraising, any brand with one defensible metric. Overrides: one strong, verified number (claims-need-proof), no
weak numbers; never the generic hero-metric/stat-row template (craft-floor Refuse); hero figure renders at its final
value (no count-up above the fold); charts only from real data.

**05 Workbench** - guided tour of the real product in use: captures with captions and annotations.
Fits: SaaS, apps, dev tools, dashboards. Overrides: real captures only, no hand-drawn browser/phone chrome
(craft-floor); annotations as HTML, not baked into the image; captions fade/translate (no unmask); captures below
the fold lazy with fixed aspect ratio; sticky CTA = our mobile action bar (C4).

**06 Conversational FAQ** - direct questions as headings, short honest answers. Fits: support, pricing companion,
regulated or high-skepticism offers. Overrides: a companion page/section, not the primary page; static -
`<details>` opens instantly, no row/height animation (motion.md); FAQ markup per site-seo; answers in the visitor's
words (site-copy).

**07 Manifesto** - poster-scale declarations, one assertion per block, colour bands. Fits: about/beliefs,
rebrand, campaign, mission-led products. Overrides: fails the 5-second check on a primary page - use where the goal
allows; a static tilt is fine, entrance sweeps are transform only; the CTA is present, not "far below".

**08 Photographic** - one dominant image per fold, text as small annotation. Fits: hospitality, food, venues,
real estate, architecture, tourism, lifestyle/fashion commerce, portfolios. Overrides: generated art-directed
scenes are OK (imagery.md, image direction first); real people only in real photos; hero image = LCP
(`fetchpriority="high"`, srcset, hashed URL, never lazy, `100svh`); text on image passes 4.5:1 via a scrim; on a
primary page the caption still carries the promise + CTA.

**09 Quote-Led** - a customer's words are the headline; more voices follow. Fits: B2B and professional services,
agencies, any offer where "people like me chose this" unlocks it. Overrides: real testimonials only, real name and
consent, quoted exactly; no placeholder people.

**10 Specimen** - asymmetric label/content columns, big serif display, hairlines, typographic CTA. Fits:
editorial, publishing, foundry, journal-like brands only. Overrides: drop the numbered margin labels (craft-floor
Refuse: section numbers, eyebrow above every heading) unless sequence matters; lead pages keep a real button.

**11 Catalogue** - uniform grid of variants of one kind of thing. Fits: e-commerce listing, product ranges,
menus, materials/colour libraries, inventory. Overrides: uniform cards are right here (items, not features); even
counts per row at each width; fixed aspect ratio (CLS); real prices/stock only; filters work without JS first.

**12 Letter** - first-person note with a greeting and a sign-off. Fits: founder note, appeal/donation, pivot or
announcement, small personal brands' about page. Overrides: not for primary commerce/lead pages; a CTA at the foot
plus the site's action bar; nothing signed that the client did not write or approve.

**13 Index-First** - the page is an organised list of links. Fits: docs hubs, resource libraries, archives,
location/service indexes, blog archive, link-in-bio. Overrides: not a marketing home; real headings group the list
(SEO internal linking, site-seo).

**14 Narrative Workflow** - numbered stages telling how the visitor goes from start to result. Fits: "how it
works", onboarding, service process, SaaS pipelines. Overrides: numbering is allowed because the sequence matters
(craft-floor exception); the steps are true and in order; stages stack vertically on phones; sweeps translate a
few px only (`overflow-x: clip`, no sideways scroll).

**15 Split Studio** - alternating text/proof diptychs down the page. Fits: service/product detail pages, SaaS
features, B2B. Overrides: phones stack every row in the same order (text, then proof), never alternating; each
proof is real; `minmax(0, 1fr)` tracks.

**16 Feature Stack** - sticky label pane beside a scrolling pane of detail visuals. Fits: premium products,
complex feature stories, multi-step services. Overrides: sticky = desktop only, stacked on mobile; sticky
`top: var(--nav-h)` under the nav (z-index scale); scroll sync is JS below the fold, crossfades opacity only.

**17 Type Specimen** - the typeface is the subject, shown at many sizes and features. Fits: foundries, design
systems with a custom face. Overrides: rare for client sites; extra weights load on that page only (fonts rule).

**18 Portfolio Grid** - cards of real projects, optional filter bar. Fits: studios, agencies, architects,
contractors, photographers, makers. Overrides: real projects only; even counts; filter as links/CSS first, card
change = opacity only; each card leads to a case page with the CTA.

**19 Map / Diagram** - one spatial diagram organises the page (flow, system, area, org). Fits: service-area
maps, ecosystem/system overviews, process diagrams. Overrides: inline SVG; phones get a linear list fallback, no
sideways scroll; nothing lives only in hover (touch); nodes appear by opacity/transform, no stroke draw-on.

**20 Ecosystem Index** - several rails or grids, each a different cut of a large body of content. Fits:
marketplaces, communities, media/blog-heavy sites, multi-category commerce home. Overrides: rails use scroll-snap +
`overscroll-behavior-x: contain` (mobile.md); thumbnails lazy with fixed ratio; real content only, no demo items.

**21 Component Playground** - preview + code blocks as the primary content. Fits: design systems, component
libraries, developer docs. Overrides: utility pages only; the Copy button shows a success state announced via
`aria-live` (craft-floor States).

## Component archetypes

Format: id name - fit - override. **NOT USED** = conflicts with a rule; the rule is quoted.

### Nav (N)
- **N1 Wordmark + 2 links** - few destinations, landing pages. Phones keep the same two items or fold into the sheet.
- **N1b Three-section bar** (wordmark / link cluster / sign-in + filled CTA) - product, SaaS, multi-service sites.
  Dropdowns open by click as well as hover; no animated `backdrop-filter`; static blur only if the style guide earns it
  (craft-floor: "Glass and blur as decoration").
- **N2 Floating corner chip** - fold-heavy pages (Photographic, Marquee). On phones the CTA moves to the thumb zone.
- **N3 Side rail** - long editorial/portfolio pages, desktop only; phones get a top bar + sheet.
- **N4 Hidden behind cmd-K** - **NOT USED**: mobile is the base layer (mobile.md) and a phone has no cmd-K; every
  destination must be visible or one tap away.
- **N5 Floating pill** - modern-minimal sites with a distinct hero surface under it. Our ported pill nav lives here;
  Arthur wants it **tested against a non-pill nav in hero rounds** (a toggle), not assumed. Static blur only.
- **N6 Newspaper masthead** - editorial, magazine, publishing only; costume on product sites.
- **N7 Brutal slab** - loud, declarative brands (sport, manifesto). No blur, no round, no soft shadow with it.
- **N8 Terminal command** - genuine CLI/dev-tool brands only (craft-floor: no monospace as costume).
- **N9 Edge-aligned minimal** (wordmark left, one CTA right) - luxury/quiet brands with few pages; the one CTA is the
  site's CTA.
- **N10 Bar morphing into a pill on scroll** - modern-minimal; one DOM, constant height, crossfade opacity +
  transform only, one curve; JS listener passive.
- **N11 Mega-menu panel** - many grouped destinations (platforms, large catalogues, docs). On phones it becomes the
  ported menu sheet; scrim fades by opacity; no animated blur.
- **N12 Announcement banner + retracting nav** - a true, time-bound announcement only. Retract with `transform`
  (never height); dismissal leaves no gap and no CLS.
- **N13 Visible search pill** (cmd-K as a bonus) - search-heavy docs, catalogues, content sites; works by tap.

### Hero (H)
- **H1 Marquee statement** - see Macrostructure 03; primary pages only where the goal allows.
- **H2 Split diptych** (text / image or real capture) - the safe default for service and product pages; text block in
  sync with the image subject (visual balance); stacks text-first on phones.
- **H3 Quote-led** - a real testimonial that earns the front page; real name and consent.
- **H4 Stat-led** - one strong verified figure + worded headline; final value at paint, no ticker above the fold.
- **H5 Letter opening** - personal/founder brands; not for primary lead or commerce pages.
- **H6 Photographic fold** - generated art-directed scene or real photo (real people = real photo); LCP rules of 08.
- **H7 Demo video clipped by the viewport edge** - SaaS/dashboard with real footage. Poster image is the LCP
  (`fetchpriority="high"`), video muted/playsinline loaded after; reduced motion = poster only; phones = no bleed
  (`overflow-x: clip`), poster or short loop.
- **H8 Tilted browser-frame mockup** - **NOT USED**: craft-floor "no hand-drawn fake browser/phone chrome around
  them". A real, untilted, frameless capture is H2 or F5.
- **H9 Custom illustration centrepiece** - brands with a drawable thing (a craft, a process, a character). Hand-built
  SVG, no illustration-pack art; static or one transform/opacity moment.

### Features (F)
- **F1 Bento grid** - see 01; even counts, mixed spans, one column on phones.
- **F2 Sticky-scroll stack** - see 16; desktop only, stacked on mobile.
- **F3 Tabular spec sheet** - quantitative comparisons, plans, specs; tabular numerals; rows restack on phones (no
  sideways table scroll at 320px unless it is a true data table with a sticky first column).
- **F4 Step sequence** - real sequences (process, onboarding); numbering allowed because order matters.
- **F5 Annotated capture** - product UI as the explanation; real capture, no fake chrome, labels in HTML.
- **F6 Product card grid** - commerce/listings: image, name, real price, one action; uniform on purpose; even counts.

### Section headings (S)
- **S1 Left-margin numbered labels** - **NOT USED** as a default: craft-floor Refuse "Section numbers (01 / 02 / 03)
  unless the sequence itself matters to the reader" and "A kicker/eyebrow label above every heading". The label
  column without numbers is allowed (asymmetric layout); with numbers only on a true sequence (F4/14).
- **S2 Hanging** - heading in negative space, no rule; more space above than below (craft-floor Spacing).
- **S3 Sticky pinned** - dense desktop sections; `top: var(--nav-h)`, below the nav in the z-index scale; static
  heading on phones.
- **S4 Inline** - prose-led pages; still a real heading element for the outline.
- **S5 Bottom-anchored** - galleries/captions; the label is a `figcaption`, the section keeps a real heading first in
  DOM order (outline, screen readers).

### Trust (T)
- **T1 Pull-quote with marginalia** - editorial pages; margin attribution drops beneath the quote on phones; real
  quotes only.
- **T2 Logo wall (hairline)** - real logos only, used with permission (claims-need-proof); monochrome, no boxes; may
  run as the `effects.md` marquee below the fold, never above it on mobile.
- **T3 Single huge quote** - one real quote that earns a whole section; a strong closer before the final CTA.
- **T4 Numbered stat strip** - **NOT USED**: craft-floor Refuse "The hero-metric template: big number, small label,
  supporting stats, accent. If numbers are real and strong, integrate them into a sentence or a composed proof
  block, not a generic stat row." Composed variant allowed: strong, verified figures inside a proof block or a
  sentence; no weak numbers.

### Footer (Ft)
- **Ft1 Mast-headed** - wordmark + tagline band, a few links, address/licence; quiet default for small sites.
- **Ft2 Inline-rule single line** - one-page and editorial sites; still holds the legal links.
- **Ft3 Index-style columns** - sites with many pages (services, locations, categories, docs); internal links for SEO.
- **Ft4 Dense monospace colophon** - **NOT USED**: craft-floor Refuse "Monospace as a 'technical' costume rather than
  for code, data or measurement". Composed variant allowed: a dense colophon in the body face, editorial brands only.
- **Ft5 Statement** - one closing sentence above the links; brand-led and manifesto pages; the sentence follows
  site-copy rules.
- **Ft6 Letter close** - letter-shaped pages and warm personal brands; twee on product/B2B.
- **Ft7 Newsletter-first** - only when the brand really publishes and the page already offered it; the form is
  stamped from `<template>` (forms.md loading rule).
- **Ft8 Marquee scroll** - loud brands only; the `effects.md` marquee (transform, paused on hover/focus, wraps under
  reduced motion); decorative copy `aria-hidden`.

### CTA (C)
- **C1 Outlined chip** - secondary or quiet actions; on lead sites the primary CTA stays the filled accent button, one
  label per intent site-wide (review.md).
- **C2 Inline form as CTA** (one field + submit) - email capture, newsletter, quick quote start. Stamp the form from
  `<template data-stamp>` and measure TBT with tags on (forms.md, ~50 ms per below-fold form); "not connected" state
  until an endpoint exists.
- **C3 Typographic link** - inside prose, cards and secondary paths; never the only CTA on a lead page.
- **C4 Sticky bottom bar** - our mobile action bar: appears after the hero CTA leaves the viewport, slides by
  `transform`, `env(safe-area-inset-bottom)`, page end padded by its height (mobile.md). Port the approved one.
