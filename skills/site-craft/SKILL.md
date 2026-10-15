---
name: site-craft
description: Craft floor and review pass for every website built in this repo (any client, any niche) (Astro, mobile-first, Lighthouse-gated). Use when designing or building any page, section, hero, style guide or DESIGN.md for a client site, and again before showing Arthur any build (review pass). Distilled from vetted parts of Impeccable, Emil Kowalski's skills and Vercel's Web Interface Guidelines, rewritten to obey this repo's performance and motion rules.
---

# Site craft

Our own skill. Nothing here installs, runs scripts, or fetches remote instructions. Sources and
licenses: `NOTICE.md`.

## Precedence (highest first)

1. `.claude/skills/site-method/reference/operating-rules.md` rules (motion vs. Core Web Vitals, Lighthouse gate, passive testing) and Arthur's memories (index in operating-rules.md).
2. The client's `DESIGN.md` / approved style guide and `DECISOES.md`.
3. This skill.

When this skill and a higher layer disagree, the higher layer wins silently. Known overrides are
already applied in the reference files (e.g. Impeccable allows blur/clip-path/mask motion; we do not).

## Moment 1 - Building (direction, hero, style guide, sections, pages)

Read before writing CSS/markup:

- **The idea sentence, before the hero:** list what only this client has (name, place, numbers, the one constraint),
  then write "On this page, [thing only they have] becomes [the device]." If the nearest competitor fits the sentence,
  it is not an idea yet. Goes in `DESIGN.md` Overview.
- `reference/structures.md` - menu of page macrostructures and component archetypes (phase 4) and their fit.
- `reference/design-md.md` - write or read the client's `DESIGN.md` (single source of tokens + rules).
- `reference/craft-floor.md` - the checks every build must pass and the AI-default patterns to refuse.
- `reference/typography.md` - type roles, measure, loading.
- `reference/motion.md` - easing/duration tokens, press feedback, reveal rules.
- `reference/effects.md` - CSS recipes: spring easing, press, card lift, fill button, cursor glow, marquee, number
  ticker, scroll-driven reveal. Pick one or two that serve a purpose.
- `reference/imagery.md` - generated branded images: direction first, fixed prompt blocks, binary batch checks, fixes.
- `reference/mobile.md` - the phone layer (svh hero, 16px inputs, tap highlight, safe areas, hover gating).
- `reference/accessibility.md` - WCAG 2.2 AA layer (focus vs sticky bars, target size, forms, manual test).
- `reference/security-headers.md` - header set, CSP rollout, PHP form-handler hardening (before deploy).
- `reference/forms.md` - every lead form: architecture (steps, one-tap steps, branches, contact last), behaviour (Back,
  focus, validation, stamping, slot heights) and style (the card inside dark bands, chips, fine print). Port, don't rebuild.
- `reference/measurement.md` - events, attribution, consent, tag loading that protects LCP/TBT, reporting.
- `reference/known-mistakes.md` - the ledger: every mistake Arthur already caught, its rule and its check. Obey it.

**Look while building (Arthur 2026-10-14).** After each section (not each edit), before starting the next:
`node .claude/skills/site-craft/tools/look/look.mjs <base> <route> --el "<section>"` (+ `--hover` for cards/buttons with hover, `--states` for
form steps or menus), fix every FAIL, then open `sheet.png` and actually look at it. The misses in the ledger were
states nobody looked at (dark theme, desktop, step 2, hover, after a reload), not a lack of screenshots.

Build without narrating the checklist. Decide the direction first (who visits, on what device, in what
light, wanting what), then let the floor hold the mechanics.

## Moment 2 - Review pass (before any screenshot goes to Arthur)

Follow `reference/review.md`: one design read (specificity, hierarchy, personas) and one mechanical read
(`reference/web-interface-checklist.md` + the floor's Verify list) - as two isolated subagents when the
page set is large, inline for a single section. Add the manual test in `reference/accessibility.md`; on deploy builds also `reference/security-headers.md`.
Run every check in `reference/known-mistakes.md` (its tools: `anchor-landing.mjs`, `font-fallback.mjs`, `form-flow.mjs`) and add any
new mistake Arthur catches to it the same day (symptom, cause, rule, check).
Fix P0/P1 findings before showing; list P2/P3 briefly. Copy and SEO have their own skills: `site-copy`, `site-seo`.

## Non-negotiables carried from operating-rules.md

- Animate only `transform` and `opacity`; reveals reserve space (no CLS); nothing delays the LCP element;
  `prefers-reduced-motion` always respected; CSS first, JS only below the fold.
- Heavy JS libraries (GSAP, Three.js/WebGL, Framer Motion...) are an exception, not a ban: allowed when one specific
  idea is strong enough to justify them, loaded only below the fold or on interaction (never delaying the first
  screen), with a static fallback for reduced motion, passing the Lighthouse gate with everything on, and shown to
  Arthur before it becomes part of the site. CSS stays the default.
- Self-hosted fonts, only used weights, metric-compatible fallback.
- No fake data, no weak numbers, copy from the visitor's side.
