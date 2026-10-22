# Design-reference arsenal

Shared across all clients. Sections we can take structure and treatment from (never copy code, copy, imagery or brand marks). Dossiers pick from here and copy only the screenshots they cite into `clientes/<client>/05-referencias/`.

## Sources (Arthur-vetted only, 2026-10-14)

| source | URL | what to pull | terms note |
|---|---|---|---|
| 21st.dev | https://21st.dev | the biggest catalog: heroes, navs, cards, testimonials, forms, footers, CTAs | screenshots for this private archive only; its media may not be reused; a copied component needs a visible credit link (we never copy, we reimplement) |
| Aceternity UI | https://ui.aceternity.com | animated landing sections, hover cards, text reveals | free tier licence unclear: look only; never buy Pro |
| Magic UI | https://magicui.design | marquees, number tickers, bento grids, reveals | MIT |
| MicroKit | https://microkit.co | button and hover micro-interactions | MIT per its FAQ |
| Kinetics | https://kinetics.colorion.co | spring/press/lift effects | MIT claimed (no LICENSE file in the repo) |
| Motion Primitives | https://motion-primitives.com | text effects, animated groups | MIT |
| shadcn/ui | https://ui.shadcn.com (blocks) | clean structural blocks: forms, pricing-style cards, footers | MIT |

Plus anything Arthur sends. A new source only with his ok. All of these are React/Tailwind: they are a visual
reference, reimplemented in our Astro/CSS under our motion rules (`site-craft/reference/effects.md`), never
installed. The 2026-10-12 sweep of law-firm and gallery sites was removed on 2026-10-14 (Arthur: quality not
validated).

## Folders (one per section type)

| folder | holds | status |
|---|---|---|
| `hero/` | first-screen sections | 6 catalog previews (Cold Air 4 U sweep 2026-10-20); see INDEX.md |
| `nav/` | headers, menus, mobile sheets, sticky bars | 8 catalog previews (Cold Air 4 U sweep 2026-10-20) |
| `cards/` | situation/practice cards, doors, router tiles, offer cards | 13 catalog previews (8 tiles + 5 offers; Cold Air 4 U sweep 2026-10-20) |
| `proof/` | reviews, case results, credentials, numbers, social video | 16 catalog previews (credentials, reviews, social video; Cold Air 4 U sweep 2026-10-20) |
| `form/` | intake forms, multi-step, call/schedule widgets | 7 catalog previews (Cold Air 4 U sweep 2026-10-20) |
| `footer/` | footers and closing CTAs (incl. full-width CTA bands) | 11 catalog previews (5 CTA bands + 6 footers; Cold Air 4 U sweep 2026-10-20) |
| `pages/` | whole-page structures and sections (practice page, about, article, founder/people, steps, FAQ) | 16 catalog previews (founder 6, steps 5, FAQ 5; Cold Air 4 U sweep 2026-10-20) |

## Naming

- Catalog component previews (2026-10-20 sweep) are stored as `<slug>-desktop.webp` (component still or catalog preview-element shot, max 1600 px wide), not viewport captures; slug = `21st-<name>-<id>` or `<source>-<name>`.
- `<slug>-desktop.png` (1534x692 CSS px at dpr 1.25) and `<slug>-phone.png` (414x896 at dpr 2). Slug = lower-case brand name with hyphens (`irwin-mitchell`); add a suffix only if one site gives several entries (`morgan-morgan-nav`).
- Each folder has an `INDEX.md`: table of slug, URL, industry, pattern name, why it works, what to avoid, performance note. Starred rows (★) are the curated best.
- Contact sheets `_sheet-N.jpg` (6 labelled desktop shots each) so a human can scan fast; `_phones-sheet-N.jpg` for phone views.
- A shot is one frame of a live site (carousels rotate, sites change). Re-open the live URL before building from it.

## Capturing

Scripts in `_scripts/` (Playwright from `C:/dev/web-toolbox`, never npm install here):

- `capture-hero.mjs <list.json>`: screenshots each `{slug,url}` at both viewports, rejects/closes cookie banners only, no logins, no forms. For component catalogs, shoot the component's preview, not the whole catalog page.
- `make-sheets.mjs`: rebuilds the desktop contact sheets from every `*-desktop.png` in `hero/`.
- `make-phone-sheet.mjs out.jpg slug ...`: phone sheet for chosen slugs.
- `gallery-links.mjs`: dumps links from gallery pages (Awwwards, Siteinspire, OnePageLove, Godly; Lapa/Land-book block scripts).
- `build-index.py` + a `rows.txt` you write: regenerates `hero/INDEX.md`.

Sites behind Cloudflare/bot walls (Lemonade, Ro, Hims, Zocdoc, Rocket Lawyer, Avvo, Angi, Edelson) were dropped; do not scrape around them.

## How to search (Arthur 2026-10-14)

Search by **construction**, never by niche. For Gem Cap no trucking hero was any good; the right reference may have
no truck at all. Describe the idea and the build ("split hero with a floating proof card", "full-bleed photo with a
marquee of reviews under it", "editorial headline with a situation router") and look across every industry. Then
adapt it with what the client has or what we can make: generated scenes, the fleet livery, an SVG map, real
attorney photos.

21st.dev from the shell (`@21st-dev/cli`, MIT; pin the version, last checked 1.18.0): `21st search "<construction>"
--type c --json` (metadata and previews are free), `21st get <id>` only to read how a component is built (free daily
quota: **2 per day** on the free tier; never installed into a site). Logged in 2026-10-14 as Arthur's free account
(`arthurdicarahy`), so no setup needed. `--json` gives `name`, `url`, `previewUrl` (a still) and `videoUrl` per hit:
save the preview image + link into the section folder. 21st AI generation is off on this plan (do not call it).

Every hero/section proposal: 2-3 directions, each with a short name, the core idea and its effect on the visitor,
the source reference(s), what stays fixed (tokens, brand assets, required content, a11y, responsive), at least two
real differences (hierarchy, density, composition, navigation or interaction pattern, content emphasis; colour-only
does not count), risks (perf, a11y), and a ★ recommendation. Direction contract adapted from 21st-dev/skill
`21st-ui-explore` (Apache-2.0, https://github.com/21st-dev/skill, read 2026-10-14).

## Rules for use

- Public pages only. No form submission, no login.
- Reference = structure, hierarchy, pacing, treatment. Our imagery, copy and brand stay ours.
- Note performance (video, 3D, carousels) when adding an entry; our rules (no video, motion only transform/opacity, contrast on any text over an image) filter what can be adopted.
