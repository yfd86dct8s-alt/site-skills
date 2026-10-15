# Review pass

Built from Impeccable `critique.md` / `audit.md` / `polish.md` (Apache-2.0) and a few checklist items
harvested from Taste Skill (MIT). Snapshot storage, detector binary and command routing removed.

Run before any build goes to Arthur. Two reads, kept independent so one does not anchor the other:
for a whole site, two isolated subagents (A design, B mechanical); for one section, inline A then B.

## A - Design read (judgment)

1. **Specificity verdict (start here):** could an unrelated company use this page unchanged? Name the
   choices that are category-interchangeable and the missed chances for this client's character
   (their real photos, their niche, their words).
2. **Hierarchy and first screen:** at 390x844 and 1534x692, is the primary action and the promise
   obvious without scrolling? Does the hero fit the viewport (headline + CTA visible, no awkward cut)?
3. **Cognitive load:** any decision point with > 4 visible options? One CTA label per intent across
   the site (do not mix "Get a quote" / "Request pricing" / "Contact sales" for the same action).
4. **Personas** - report red flags specifically:
   - *Distracted mobile visitor* (one thumb, interrupted, slow 4G): primary actions in the thumb zone?
     selections instead of typing? 44px targets? heavy assets lazy?
   - *First-timer* (does not know the jargon): would they know what the company does and what to do
     next within 5 seconds? Jargon explained where it first appears?
   - *Accessibility-dependent* (keyboard / screen reader / zoom 200%): focus visible and in order,
     headings form an outline, forms labelled, nothing lost at zoom.
   - *Skeptical visitor* (comparing options): is every claim backed (numbers, credentials, real
     photos, names), and is anything weak, fake-looking or unverifiable on display?
5. **Emotional journey:** reassurance at the high-stakes moments (form submit, phone call); a strong
   end (final CTA + footer), not a fade-out.
6. **Copy self-audit:** visitor's words, no filler adjectives, no claims the client has not confirmed,
   no weak numbers, consistent terms.
7. **Restraint and variety:** what can be removed with no loss? Does this site share its structural
   fingerprint (DESIGN.md "Structure fingerprint") with the last two clients? Ported chrome (nav, sheet,
   form, footer) is exempt.

## B - Mechanical read (evidence)

- `web-interface-checklist.md` against the built HTML/CSS.
- The Verify list in `craft-floor.md`, with computed values.
- Repo verify scripts: contrast, links, shell/SEO, mobile widths, Lighthouse mobile (with tags on).
- Nav height capped (~64px mobile, ~80px desktop); no horizontal scroll at 320px.
- **Token lock:** grep the built CSS for hex/rgb/oklch values and `font-family` outside `tokens.css`, and for
  off-scale spacing. Each hit is drift or a missing token.
- **DESIGN.md drift:** compare the page with `DESIGN.md` (tokens, faces, accent use, button roles); ported
  components are the usual offenders. Fix the page or update DESIGN.md, never leave them disagreeing.
- **States sheet:** the style guide shows every component in every state at once via forced classes
  (`.is-hover`, `.is-focus`, `.is-active`, `.is-error`, `.is-disabled`). The forced focus ring is demo-only;
  live, the ring stays keyboard-only.
- Custom 404 page; legal links (privacy, terms) in the footer.
- **Perf findings are quantified:** each names the asset/change and its measured saving ("hero.avif 450 KB ->
  180 KB"); 0 ms items are noted, not recommended; a metric that is already good is reported as good, and the
  pass stops there. Confirm a resource is unused before proposing removal (an unused preconnect = zero requests
  to that origin). Never claim a field (CrUX/RUM) gain after a lab fix - field data needs new visits; from code
  alone, name likely causes, never a failing metric.
- **Screenshot diffs** (package vs live, before vs after): animations disabled, moving parts masked or frozen
  (marquee, ticker, reveals, dates), a stated `maxDiffPixelRatio`.

## Score and triage

Dimensions 0-4: Accessibility, Performance, Responsive, Theming/tokens, Implementation integrity
(coherent product-specific system vs. drift and decorative filler). Total /20.

Severity: **P0** blocks a task (form cannot submit, CTA dead) - fix now. **P1** real difficulty or a
WCAG AA failure - fix before Arthur sees it. **P2** annoyance - fix in the pass. **P3** polish - batch.

Fix order: broken tasks and misleading state -> missing states -> flow/hierarchy/responsive drift ->
visual and motion inconsistencies -> code/asset cleanup. Don't perfect one corner while the rest is
below the same bar.

## Report

Separate what was checked in code from what was verified visually; anything a bounded pass could not fix is
reported as open, never as a pass. Short: health score, specificity verdict, P0/P1 list (fixed or not, with file:line), P2/P3 one line
each, what works. Then show Arthur screenshots, not the report.
