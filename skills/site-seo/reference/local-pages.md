Distilled from AgriciDaniel/claude-seo `seo-local` (MIT, commit 4b99de2, text only) and Corey Haines' marketingskills `programmatic-seo` (MIT, commit 1efedbc), read 2026-10-12. Changes: dropped scoring weights and vendor statistics (re-verify before quoting any); added our proof and no-fake-data rules, legal-site notes, and the build checklist.

# Local, city and service pages

## Order of work

1. **Service pages first.** One dedicated page per core service (practice area), each worth ranking on
   its own. Industry studies rank dedicated service pages as the top local-organic factor and a
   top factor in AI-search visibility; treat that as direction and re-verify before quoting.
2. Then the home page and contact/office pages carrying consistent NAP.
3. Only then city/area pages, and only where there is something real to say.

## The doorway test

Swap the city name. If the page still reads correctly with another city, it is a doorway page: do not
build it. Doorway/near-duplicate sets risk site-wide demotion (the source cites an HVAC firm losing most
of its rankings after a 2024 core update; anecdote, not a rule). Rule of thumb from practitioners: more
than 60-70% of the page is unique content; there is no Google-confirmed threshold, so judge by value.

## What makes a city page legitimately unique

Only facts the client can supply and prove:

- A real office or a real service presence there (address, parking, transit, hours, local phone) - or, for
  service-area pages, concrete local detail: the local institutions, rules and typical scenarios relevant to the
  service that the business actually handles there.
- Local case or job types the business has really handled (anonymised, ledger-proven, bar-compliant for law).
- Area-specific FAQs from real inquiries, named neighbourhoods/counties served, real local photos
  (generated branded imagery is for the brand, not a fake "our office" photo).
- Local people: the people who serve that area, reviews from that area that are real and permitted.
- Distinct title/H1/intro written by hand (no variable-swap templates).

Everything else on the page links to the service pages; the city page does not duplicate them.

If the client cannot supply this for a city, build one stronger regional page ("Serving X, Y, Z") instead
of many thin ones. Fewer, better pages (100 great beat 10,000 thin).

## Structure

- Subfolders: `/locations/<city>/` for offices; `/services/<service>/` for services. Optional
  `/services/<service>/<city>/` only when that combination has real unique content and search demand.
- Each location page: own LocalBusiness-subtype `@id`, `branchOf` the parent (see `schema.md`).
- Crawlable static HTML for the location list (no JS-only store locator); each page in three clicks.
- Embed a map lazily (facade) so it does not cost LCP/TBT; map is a geographic signal, not a ranking
  hack. Click-to-call (`tel:`) and the form above the fold on mobile.
- NAP identical to the Google Business Profile; claim Apple and Bing listings and the relevant niche
  directories; consistency across sources matters more than quantity.

## Off-site notes (advise the client; do not automate)

Primary GBP category is the strongest local-pack factor; proximity is largely outside our control;
review quality and recency matter, but never gate or incentivise reviews. Google retired GBP Q&A
(2025): put common questions on the site. AI assistants often draw local data from Bing's index and
third-party directories, so Bing Places and consistent listings matter.

## Build checklist per page

Unique title/H1/intro (hand-written) / real local facts with ledger rows / service links / breadcrumbs /
schema matches visible NAP / listed in sitemap / links in and out / photo alt text real / does a visitor
in that city learn something they could not learn from the general page? If no, do not publish it.
