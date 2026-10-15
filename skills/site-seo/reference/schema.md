Distilled from Corey Haines' marketingskills `schema` (MIT, commit 1efedbc) and AgriciDaniel/claude-seo `seo-local` (MIT, commit 4b99de2, text only), read 2026-10-12. Changes: examples cover the common site types (local business, service, person, organization); Google feature status re-checked against developers.google.com on 2026-10-12; rating/review markup restricted by our proof rules.

# Schema (JSON-LD)

## Eligibility first

Schema.org validity is not Google feature eligibility. Before writing markup "to get a rich result",
check Google's supported-features gallery (developers.google.com/search/docs/appearance/structured-data/
search-gallery). Status as verified 2026-10-12 (re-verify before relying on it; this changes):

- **FAQPage:** Google stopped showing FAQ rich results on 7 May 2026 and removed the documentation on
  15 June 2026. Do not add FAQPage to win a rich result. Visible FAQ content is still good for visitors.
- **HowTo:** rich result retired 14 Sep 2023 (docs removed).
- **WebSite / SearchAction (sitelinks search box):** retired 29 Nov 2024. `WebSite` is still used for the
  site name; skip SearchAction.
- Still in the gallery: Organization, Local business, Breadcrumb, Profile page, Article, Product, Review
  snippet, Video and others. There is no standalone Person feature; Person is useful as supporting
  entity data and for Profile page.

Schema is not a ranking factor. Its value: eligible rich results and clean machine-readable facts for
search and AI systems. Do not add a type or claim solely to obtain a feature.

## Rules

- One `@graph` block per page in JSON-LD (in `<head>`), entities linked by stable `@id` values
  (`https://example.com/#org`, `.../locations/city/#office`, `.../team/jane-doe/#person`).
- Mark up only what is visible on the page and proven (site-copy ledger). No hidden claims, no
  placeholder or demo data (name, phone, address, hours must match the visible NAP exactly).
- No `aggregateRating`/`Review` for a business's own self-collected reviews on its own pages (not eligible
  for local business and a misleading-markup risk); never invent counts.
- Render and validate: Rich Results Test and the browser DOM; check Search Console enhancements after
  launch for the types that have reports.

## Local business

- Business: the most specific schema.org `LocalBusiness` subtype that is true (`LegalService`, `Dentist`,
  `MovingCompany`, `Restaurant`...); verify on schema.org. Law: schema.org marks `Attorney` as legacy; use
  `LegalService`. A business with no premises visitors can reach is an `Organization` with `areaServed`.
- Required/recommended: `name`, `url`, `telephone`, `address` (PostalAddress), `openingHoursSpecification`
  (standard English day values), `geo` (5+ decimals), `image`/`logo`, `sameAs` (real profiles: GBP, niche
  directories, professional registries such as a state bar record), `priceRange` only if truthful, `areaServed` with named cities/counties
  for service-area presence, `knowsAbout` or `makesOffer`/`Service` for services (practice areas, product lines).
- Multi-location: the parent `Organization` (or main business entity) has `@id` `#org`. Each office page
  carries its own business entity with a unique `@id`, its own address/phone/hours/geo, and
  `"branchOf": {"@id": "#org"}`. Office page = real staffed office only; a service-area page is not an
  office (see `local-pages.md`).
- NAP must be identical in visible text, JSON-LD and the Google Business Profile.

## Person (team)

On each team bio: `Person` with `name`, `jobTitle`, `worksFor` (the organization @id), `image`, `url`,
`alumniOf`, `sameAs` (professional registry, profile links), `knowsAbout`. Credentials, admissions and years exactly
as the official record shows (the bar record for law); anything the ledger has not proven is not in the markup. Use a profile page
layout where the page is genuinely about one person.

## BreadcrumbList and Organization

- `BreadcrumbList` on every deep page; items mirror the visible breadcrumbs and URL hierarchy; last item
  is the current page.
- `Organization`: `name`, `url`, `logo` (crawlable image URL, hashed), `sameAs`, contact point only if
  published. One organization entity per site, referenced by `@id` everywhere else.

## Do not use

FAQPage/HowTo for rich-result purposes, SearchAction, `Attorney` as the main type, review markup on
unproven ratings, speakable/other types with no real consumer. Mention in the PR/handoff which types
were intentionally skipped and why.
