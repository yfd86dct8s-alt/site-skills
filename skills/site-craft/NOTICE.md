# Third-party notices

`site-craft` is this repo's own skill. Parts are derived from the works below, used under their
licenses (copies in `licenses/`). All derived files were rewritten/condensed and modified to fit this
repo's rules; each file's header names its source and the main changes.

| Source | Author | License | Used in |
|---|---|---|---|
| Impeccable - https://github.com/pbakaus/impeccable (v4.5.0, 2026-10-01) | Paul Bakaus | Apache-2.0 | craft-floor.md, typography.md, review.md |
| emilkowalski/skills - https://github.com/emilkowalski/skills (2026-10-02) | Emil Kowalski | MIT | motion.md, mobile.md |
| Web Interface Guidelines - https://github.com/vercel-labs/web-interface-guidelines (2026-08-18) | Vercel Labs | MIT | web-interface-checklist.md |
| Taste Skill - https://github.com/Leonxlnx/taste-skill (v2, 2026-10-13; first read 2026-09-26) | Leonxlnx | MIT | review.md checklist ideas; idea sentence (SKILL.md), hero checks and one live thing (craft-floor.md), found pictures and section comps (imagery.md) - rewritten, no text copied |
| awesome-design-md - https://github.com/VoltAgent/awesome-design-md | VoltAgent | MIT | DESIGN.md format in design-md.md (no brand content copied) |
| Hallmark - https://github.com/Nutlope/hallmark (2026-08-06) | Hallmark contributors (Together AI) | MIT | structures.md; single rules in craft-floor.md, mobile.md, forms.md, review.md, typography.md, motion.md, effects.md, design-md.md; reference-record fields in site-method phase 5 (rewritten, no text copied) |
| ui-ux-pro-max - https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (2026-10-15) | nextlevelbuilder | MIT | its data tables used as research input in site-method phases 2/4 (read from the repo, not installed or copied) |
| Impeccable v4.5.2 `layout`, `colorize`, `delight` (2026-10-15) | Paul Bakaus | Apache-2.0 | spatial thesis, OKLCH chroma taper (craft-floor.md), delight limit (effects.md) |
| cloudflare/skills `web-perf`; addyosmani `core-web-vitals` (2026-10-15) | Cloudflare; Addy Osmani | Apache-2.0; MIT | perf reporting rules (review.md), speculation rules (craft-floor.md) |
| wshobson/agents `screen-reader-testing` (2026-10-15) | Seth Hobson | MIT | screen-reader script (accessibility.md) |
| currents-dev `playwright-best-practices` visual-regression (2026-10-15) | Currents | MIT | screenshot-diff rules (review.md) |
| UIZZE `anti-ui-slop` free skill (2026-10-15) | UIZZE | Apache-2.0 | report honesty line (review.md); its paid MCP is not used |
| Corey Haines `analytics`; autonnel `server-side-conversion-tracking`; kostja94 `tracking`, `ai-traffic` (2026-10-15) | Corey Haines; autonnel; kostja94 | MIT; Apache-2.0; MIT | measurement.md (rewritten) |
| web-quality-skills `accessibility` - https://github.com/addyosmani/web-quality-skills (commit afa8da9, 2026-10-12) | Addy Osmani | MIT | accessibility.md |
| better-accessibility - https://github.com/jakubkrehel/skills (commit c0588bb, 2026-10-12) | Jakub Krehel | MIT | accessibility.md |
| agent-skills `security-and-hardening` - https://github.com/addyosmani/agent-skills (commit 1be8e34, 2026-10-12) | Addy Osmani | MIT | security-headers.md |
| Kinetics (ckissi/kinetics), MicroKit (microkit.co), Magic UI (magicuidesign/magicui), Aceternity UI free tier (2026-10-14) | various | MIT / MIT per FAQ / MIT / unclear | ideas only in effects.md, reimplemented in CSS; no code copied |
| Commercial Pipeline skill (shared via Notion/Drive, 2026-10-08) | unknown | none stated | ideas only in imagery.md; no text copied |
| Brand-guidelines guide (Fabiano Carvalho, 2026-10) | Fabiano Carvalho | none stated | two section ideas in design-md.md; no text copied |

Re-audited 2026-10-15 (a rejection now needs a quoted conflicting rule, an Arthur decision, a perf cost, a licence
or a security risk): not used - Archify (software-architecture diagrams, not site design); UIZZE paid MCP (sends
queries to a paid third party); Hallmark's above-fold load stagger, grid-rows accordion, dvh hero, theme rotation,
three-questions-first, Picsum/Unsplash, CDN fonts; claude-seo plugin/scripts (credentials, URL fetching). Not installed: Impeccable plugin/hooks/binary, Vercel deploy/optimize skills.
