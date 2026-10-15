# 09 · Measurement & conversion plan (draft, 2026-09-30)

Arthur's bar: "this is the site where SEO working matters most; it has to be a machine that captures everything, gets more
leads and converts more". The deck's measurement slide (Search Console Domain property, game-plan events, call tracking,
monthly report) is the **floor**. This is the full system. Built in phase 9; client decisions marked **[CLIENT]**.

## 1 · Where each lead came from (per lead, not only in aggregate)
- On every visit, store **first touch and last touch** (landing page, referrer, UTM source/medium/campaign/term/content,
  `gclid` / `gbraid` / `wbraid` / `fbclid` / `msclkid`) in first-party storage; the game plan form submits them as
  hidden fields with the lead. Every lead record says "came from Google organic, landed on /businesses/law-firms/, returned
  via a Google Ads click 3 days later".
- UTM discipline for everything we link (GBP website link `?utm_source=google&utm_medium=organic&utm_campaign=gbp`,
  directory profiles, email signatures, social bios), so "direct" stops swallowing traffic.
- **Calls:** dynamic number insertion (a tracking number per source, swapped by script), calls logged with source and
  landing page. Florida requires **all-party consent** to record calls → a recording notice at the start of the call.
  **[CLIENT]** vendor and budget (CallRail-class tools, roughly tens of dollars a month).

## 2 · What happens after the lead (closing the loop)
- Leads go to a CRM with a status: new → contacted → qualified → proposal → won (with value) / lost (with reason).
  **[CLIENT]** which CRM they use today (or a simple one we set up).
- Won/qualified statuses feed back to the ad platforms: **Google Ads offline conversion import / enhanced conversions for
  leads** and **Meta Conversions API**, so ads optimize for clients who sign, not form fills. **[CLIENT]** ad account access.
- Report by source **to revenue**: which pages, searches and campaigns produce signed clients.
- **Speed to lead:** the fastest lever outside the site. **One** alert per lead, from where they already work: their
  CRM's own notification if they have one (the form only hands off to it), else the form backend's. Never two alerts for
  the same lead; the hub sends none. Plus a reply-time target the client commits to. **[CLIENT]** who answers and how fast.

## 3 · Where the page loses people
- **Game plan funnel** (GA4 events): opened (and from which CTA/section) → each question answered (with the answer) →
  plan shown → contact started → each field → submitted → thank-you. Drop-off per step and per answer path.
- **Section engagement:** an event when each section is actually seen (IntersectionObserver, once per view) + scroll
  depth → "70% reach the cases, 30% reach the FAQ" per template and per device.
- **CTA clicks** with their location (hero, sticky bar, section, footer) → which CTA placements convert.
- **Session recordings + heatmaps:** Microsoft Clarity (free), loaded after interaction; masks form fields. Shows *why*
  people stall (rage clicks, dead clicks, confusion). Disclosed in the privacy policy.
- **Errors:** JS errors and failed form submissions reported as events; a daily synthetic test submits the form and
  checks the lead arrives (alert if not).
- **Real-user speed:** the `web-vitals` library (~2 KB) sends each visitor's LCP/INP/CLS to GA4, by page and device —
  our own field data even before Google's CrUX has enough traffic.

## 4 · Search visibility (the SEO machine's gauges)
- Search Console **Domain** property; **bulk export to BigQuery** (keeps query/page history beyond 16 months).
- **Bing Webmaster Tools** (Bing's index feeds Copilot and other AI answers; its AI performance report).
- Rank tracking for the target keyword per page + a **local geo-grid** for map-pack positions across Coral Springs and
  neighboring cities. Google Business Profile insights (calls, directions, website clicks) monthly.
  **Tool: OpenSEO** (github.com/every-app/open-seo, MIT), self-hosted on the VPS: rank tracking, keyword research,
  competitor and AI-visibility data, with an MCP server so the loop's Claude reads it directly. Data from DataForSEO,
  pay per use (Arthur's key). Geo-grid coverage still to check; if missing, a separate local-grid tool.
- **AI visibility log:** the same prompts every month in ChatGPT, Google AI Mode/Overviews, Perplexity, Copilot; who is
  named, dated.
- Content decay watch: pages losing clicks for 2+ months get flagged for a refresh.

## 5 · Improving on purpose: the closed loop (decided 2026-10-01)
- **One place for all data:** BigQuery holds GA4, Search Console (bulk export), Google Ads (Data Transfer), Meta, Clarity
  summaries, form leads with attribution, and lead statuses read from the client's CRM (no CRM of our own; if they have
  none, the one-click won/lost in our Leads tab). Without the status the loop optimizes for cheap leads, not signed clients.
- **The loop (weekly):** a scheduled Claude routine reads the base → finds the weakest point → writes a hypothesis with a
  measurement window ("step 2 of the form loses 40%; change X; measure 3 weeks") → prepares the change (branch + build +
  Lighthouse gate with tags on) → **Arthur approves** → deploy → the routine measures and records the result. Claude
  proposes, a human approves: never auto-apply. Same for ads/strategy: Claude proposes bids, audiences, copy; a human
  presses the button (it spends money).
- **Low volume:** dozens of leads a month, so lead counts are the long confirmation, not the trigger. The loop reads
  higher-volume signals first: form step drop-off, section reach, CTA clicks, Clarity rage/dead clicks, queries with
  impressions but no clicks, content decay. One change per area at a time; proper A/B tests only once the game plan has
  enough starts per month.
- **One visual system, ours:** a single web app in the site's own visual identity (replaces Looker Studio), behind a
  login on Arthur's VPS. Tabs: Overview · Site (funnel, sections, speed) · Search (queries, positions, local grid, AI
  visibility) · Ads · Leads (source → status → value) · Improvements (Claude's proposals queue: approve / reject, then the
  measured result). The monthly one-page report is generated from the same base.
- **What makes the hub complete (added 2026-10-01):**
  - *Change log on every chart:* each deploy, ad change, price/offer change, Google update and client event (holiday,
    new hire) is marked on the timeline. Without it the loop cannot tell what caused a change.
  - *Alerts, not only a panel:* problems only, never new leads (see §2): anomaly (traffic, form errors, ranking drop,
    ad spend spike); weekly digest. Channel decided last (Arthur thinks Messages, i.e. SMS/iMessage, beats WhatsApp
    for them; to confirm).
  - *Data health:* an alert when any tracked event drops to zero or a source stops arriving: tracking breaks silently.
  - *Uptime + renewals:* site down, form backend down, SSL and domain expiry.
  - *One-click rollback* of any change the loop shipped, if its metric worsens.
  - *Money view:* ad spend + tool costs vs won value → cost per lead, cost per signed client, return per channel.
  - *Reputation:* Google reviews (count, rating, new review alert, unanswered ones); a local-ranking lever.
  - *Speed to lead:* time from lead to first contact, per lead and on average (from the CRM status change).
  - *Experiment memory:* every hypothesis, change and measured result kept; the loop reads it before proposing, so it
    does not retry what failed. Becomes the playbook for future sites.
  - *Roles:* the client sees **all the data** (they are an SEO agency: every tab, every number). Only the Improvements
    queue (proposals to change the site, approve/reject) is Arthur's. A log of who approved what.
  - *Lead fallback without a CRM:* a one-click won/lost + value per lead in the Leads tab (no pipeline, tasks or email:
    not a CRM).
- **Weekly upkeep (separate from the loop, decided 2026-10-01):** a scheduled routine checks everything is fine and
  fixes what is broken or out of date. Proven breakage is fixed **without asking** (the fix passes the full test suite
  + Lighthouse gate, deploys, and is reported after); anything that changes content, design or strategy, or makes the
  site heavier, goes to the Improvements queue instead. Checks: uptime, SSL/domain dates, broken internal/external links,
  Search Console indexing errors and 404s, sitemap/robots/canonicals, structured data validity, redirects, the form end to
  end, tracking health, Lighthouse with tags on + real-user speed, dependency security advisories and updates (applied
  only if every check stays green), stale dates/facts on pages (fixed if the source is ours, flagged if it needs the
  client). Output: one dated entry in the change log + the weekly digest.
- **Timing:** the data base and the weekly upkeep go live with the launch; the loop switches on after 4–8 weeks of real data.
- **Other clients (later):** the same app as a hub only (no loop), connected to what they already have, with each
  tool's tracking limits.

## 6 · Without undoing the speed
- All tags load **after the page is interactive or on first interaction**; nothing blocks the first screen. Option:
  server-side Google Tag Manager on the VPS (moves most tag code off the phone).
- The Lighthouse gate runs **with every tag on**; the 182 KB / 97 numbers get re-measured that way (PageSpeed Insights,
  same test for the old site).
- Privacy: the policy lists every tool; Global Privacy Control honored; TCPA-style consent line if we text leads; no
  session recording of form field contents.

## Build order (phase 9)
1 attribution capture + form backend + CRM hand-off → 2 GA4 funnel/section/CTA events + web-vitals → 3 Search Console
Domain + BigQuery + Bing → 4 call tracking → 5 Clarity → 6 offline conversions to Ads/Meta → 7 all sources into BigQuery
+ our dashboard app + monthly report → 8 (after 4–8 weeks of data) the weekly Claude improvement loop.
