Distilled from Corey Haines' marketingskills `seo-audit` v2.2.0 and `site-architecture` (MIT, commit 1efedbc, read 2026-10-12). Changes: SaaS/ecommerce/international sections cut; migration and 301-map method written for this repo; pre-launch checklist and polite-crawl rule added; length ranges kept as guides, not hard limits.

# Technical SEO

## Render before concluding

`curl`/fetch tools do not see JS-injected content, and fetch-to-markdown strips `<script>`. Before
reporting "no JSON-LD", "no H1", "no canonical": load the page in a real browser (web-toolbox Playwright)
and query the DOM, e.g. `document.querySelectorAll('script[type="application/ld+json"]')`, or use Google's
Rich Results Test. Our Astro output is static HTML, so for our own build `dist/` is the truth; for the
client's old site, render.

## Migration and 301 map (phase 2 -> 9)

1. Inventory the current site: public sitemap, a polite crawl of internal links (low rate, passive),
   Search Console "pages" and top landing pages if the client gives access, Wayback for ghost URLs, and
   backlink targets from the client's tools. Record URL, status, title, H1, canonical, indexability,
   traffic/links, and what the page is for. Put it in `02-baseline.md` or `url-inventory.csv`.
2. Decide per old URL: keep the same path, 301 to the closest equivalent new page, merge, or let 410/404
   (only for truly dead, no links, no traffic). Never mass-redirect to the homepage (soft 404).
3. Build `redirects-map.csv` (old path, new path, reason). Single hop only; no chains or loops; flatten if the
   new URL itself changes later. Include `http->https`, `www` vs apex, trailing slash and case variants as
   rules, not rows.
4. Preserve URLs that rank when the new structure allows; changing a URL always needs its 301.
5. Implement at the server layer (nginx/Apache/Cloudflare rules), not meta refresh/JS.
6. Test before launch: every old URL returns 301 to the mapped URL in one hop, the target returns 200, is
   indexable and self-canonical. Spot-check the top 20 pages by traffic by hand.
7. After launch: submit new sitemap, watch Search Console coverage and 404 reports for two to four weeks,
   fix gaps, keep redirects for at least a year.

## URLs and architecture

- Lowercase, hyphen-separated, readable slugs, no IDs, no dates in URLs unless the content is dated.
- URL path mirrors the hierarchy and breadcrumbs: `/services/car-accidents/`, `/locations/city/`.
  Subfolders, not subdomains. Keep one trailing-slash policy site-wide.
- Every important page within three clicks of the home page; no orphan pages. Service pages are
  first-class pages (see `local-pages.md`).
- One URL per topic; keyword cannibalisation (two pages for one query) is solved by merging or by
  distinct intents, not by tweaking titles.

## Titles, meta, headings

- Title: unique, main query first, about 50-60 characters (pixel width really decides), aligned with the H1,
  brand last. Google may rewrite titles; stop fighting a rewrite that is more accurate.
- Description: unique, about 150-160 characters, states the benefit and a reason to click; it is not a
  ranking factor but drives clicks. Copy comes from `site-copy`.
- One H1 per page, logical H2/H3, headings describe content, never used only for styling.
- Images: descriptive file names, real alt text (not keyword stuffing), dimensions set, modern formats,
  `?h=<hash>` on every URL we publish.

## Canonicals, indexing, robots

- Every indexable page has a self-referencing absolute canonical (https, final host, same trailing-slash
  policy). Parameter/duplicate variants canonicalise to the clean URL.
- `noindex` only for pages that must exist but not rank (thank-you, internal search); never combine
  `noindex` with a robots.txt block (Google cannot see the tag). Staging and review previews: `noindex`
  header plus no links from the live site.
- `robots.txt`: allow everything intended, reference the sitemap; check for leftover `Disallow: /`.
- Robots meta, `noindex` and canonical live in the initial HTML, never set or removed by JS (a noindex removed
  by JS may still be honoured - matters for preview noindex in PRE-PRODUCTION).
- Content and JSON-LD within the first 2 MB of HTML (no large inline base64); desktop and mobile content parity.
- Ping IndexNow on every deploy (Bing also feeds ChatGPT search).
- Before fixing a page's type for a target query, look at the top 10: if > 60% share one page type, match it.

## Sitemaps

XML sitemap with only canonical, indexable, 200 URLs; accurate `lastmod` only when content changed;
referenced in robots.txt and submitted in Search Console; split files before 50,000 URLs/50 MB. Build it
from the same route list as the redirect map so they cannot disagree.

## Internal linking

Descriptive anchors (not "click here"); hub-to-spoke and spoke-to-hub; each service page links to its
related areas and vice versa; breadcrumbs on every deep page; contextual links in body copy (a few per
1,000 words). Footer/nav bloat dilutes; link what a visitor would want next.

## Pre-launch checklist (phase 9, before Lighthouse CI)

Rendered check: titles/meta unique, one H1, canonical self-referencing, JSON-LD parses and matches
visible facts, hreflang absent unless multilingual, 301 map tested, sitemap and robots correct, no
`noindex` left from preview, HTTPS everywhere with HSTS, 404 page returns 404, mobile viewport, CWV from
Lighthouse mobile, analytics tags loaded after interaction and Lighthouse re-run with them on.
