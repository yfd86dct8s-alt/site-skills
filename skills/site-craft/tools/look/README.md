# look - the quick look after every section

Arthur (2026-10-14) wanted the agent to see what it builds while building, so obvious mistakes don't slip through.
The ledger (`.claude/skills/site-craft/reference/known-mistakes.md`) showed the misses were never "could not see"
but "looked at the wrong state" (dark theme, desktop, a later form step, hover, after a reload). A live-browser MCP
(Chrome DevTools MCP, agent-browser) was evaluated and rejected: Chromium-only (several misses were iPhone/WebKit),
and it duplicates our Playwright toolbox. This script renders those states, flags the obvious bugs and writes one
contact sheet to look at.

```bash
# per section, while building (about 20 s): the section at 390 WebKit + 1534x692 Chromium, light + dark
MSYS_NO_PATHCONV=1 node .claude/skills/site-craft/tools/look/look.mjs http://localhost:8761 / --el "#team" --hover ".people li"
# whole page(s), first screen + full page per view
MSYS_NO_PATHCONV=1 node .claude/skills/site-craft/tools/look/look.mjs http://localhost:8761 /,/contact/ --wide
# site states: a module exporting states = [{ name, views?: ['390'], scope?: css, run: async (page, view) => {} }]
MSYS_NO_PATHCONV=1 node .claude/skills/site-craft/tools/look/look.mjs http://localhost:8761 /contact/ --states clientes/<c>/tools/look-states.mjs
```

Then **open `sheet.png` and look at it** before the next section. The automatic checks catch the obvious; the sheet
is for what only eyes catch (hierarchy, balance, a secondary button shouting louder than the primary).

Checks per view (FAIL = exit 1): horizontal page overflow with its culprits; page/console errors and 4xx/5xx;
broken images; overlapping text (fixed/sticky chrome excluded); text cut by its box or cut top/bottom; text
contrast 4.5:1 (3:1 large; text over photos skipped); an aria-hidden copy fully on screen (the marquee duplicate);
heading heights changing after scroll + reload in WebKit (the iPhone font-fallback bug). Warnings: the same
text block fully visible twice; touch targets under 24px on phones.

Verified 2026-10-14 on the Elevate build: clean pages pass with no false FAIL, and each injected ledger bug
(page overflow, invisible Back button, overlapping label, broken image, stacked marquee copy, cut text) FAILs.

Not covered (keep the per-site tools): anchor landing (`anchor-landing.mjs`), form flow (`form-flow.mjs`), quick
theme clicks (`theme-clicks.mjs`), sub-pixel centring (`circle-center.mjs`), Lighthouse (`lh.mjs`).
Requires the shared toolbox at `C:/dev/web-toolbox` (Chromium + WebKit, see `.claude/skills/site-craft/tools/web-toolbox/README.md`).
