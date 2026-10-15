# Measurement: attribution, events, consent, reporting (internal guide)

Sources (distilled, rewritten, no verbatim text): Corey Haines `marketingskills` `analytics` skill + event-library /
GA4 / GTM references (MIT); autonnel `server-side-conversion-tracking` (Apache-2.0); kostja94 `marketing-skills`
`tracking` and `ai-traffic` (MIT). Structure generalized from our first worked plan (TMC `09-measurement-plan.md`).

Every site is a lead machine: full attribution, funnel and CRM measurement is the default, not an add-on. It ships in
phase 9 and passes the Lighthouse gate **with every tag on**. Applies to any niche; client names appear only in
labelled worked examples. Copy-side form events: `site-copy/reference/forms-cro.md`. Form mechanics: `forms.md`.
CSP origins for tags: `security-headers.md`. AI-search measuring: `site-seo/reference/ai-search.md`.

## 1. Plan before tags

1. Write the questions first ("which pages produce signed clients?", "which form step loses people?"), then the events
   that answer them. **Every event row names the decision it informs.** No decision, no event.
2. Tracking plan table in the dossier (`09-measurement-plan.md`):
   `event | decision it informs | trigger | params | counted as | owner tool`.
3. Mark every item that needs the client (ad account, CRM, call-tracking vendor, recipients) as **[CLIENT]**. Do not
   block the build on it: build the connector, show a "not connected" state, never fill with demo or partial data.

## 2. Event names and params

- Use the **GA4 recommended name** whenever one exists; a custom name for the same thing loses GA4's built-in reports.
  Lead sites: `generate_lead` (form success), `qualify_lead`, `working_lead`, `close_convert_lead`,
  `close_unconvert_lead`, `disqualify_lead` (CRM statuses, sent server-side). Also `sign_up`, `search`, `share`, and
  enhanced-measurement names as-is (`page_view`, `scroll`, `click`, `file_download`, `form_start`, `form_submit`).
- Otherwise: lowercase `snake_case`, object_action, **<= 40 characters** (GA4 drops longer names). Context goes in
  params, not names: `cta_click {location: "hero"}`, not `hero_cta_click`.
- Same names on every site (cross-site comparison is the point). Starter set for a lead site:

| Event | Decision it informs | Trigger |
|---|---|---|
| `cta_click` (`location`, `cta_id`) | which CTA placements earn their space | click on any primary CTA |
| `form_open` (`entry`) | which entry points start forms | form/quiz first shown |
| `form_step` (`step`, `answer_id`) | which step or answer path to simplify | step completed |
| `form_error` (`field`, `rule`) | which field copy/validation to fix | validation failure |
| `generate_lead` (`form_id`, `lead_type`) | conversion; ads bidding | backend confirmed success |
| `phone_click` / `email_click` | call vs form split per device | `tel:` / `mailto:` tap |
| `section_view` (`section`) | which sections to cut, move or shorten | first time >= 50% visible |
| `web_vitals` (`metric`, `value`, `rating`) | field speed per template/device | `web-vitals` library |

- **A lead is counted once per session**: fire `generate_lead` only on the backend's success response, guard with a
  session flag, and set the GA4 key event to count once per session. Thank-you page reloads must not re-fire.
- **No PII in analytics params**: no name, email, phone, address, free-text answers, or URLs that contain them.
  Answer IDs, not answer text. Check query strings: a GET form leaks PII into `page_location`.

## 3. Attribution capture (into the lead record)

- On the first hit of every visit, before any redirect, capture: `utm_source/medium/campaign/term/content`, click ids
  (`gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `ttclid`, `li_fat_id`), landing URL, referrer. Keep **first touch
  and last touch** in first-party storage (try/catch; it may be empty or capped at ~7 days on iOS).
- The form submits them as hidden fields; the backend writes them onto the **lead record** (and the CRM hand-off).
  Attribution becomes a join on our own data, not a browser guess. Redirect chains must keep the query string.
- UTM conventions: all lowercase, hyphens inside values, one register per client (`utm-register` table in the dossier).
  `utm_source` = where (google, facebook, newsletter), `utm_medium` = channel type (cpc, organic, email, social,
  referral), `utm_campaign` = the effort. Tag every link we control: Google Business Profile website link
  (`?utm_source=google&utm_medium=organic&utm_campaign=gbp`), directories, bios, email signatures. Never put UTMs on
  internal links (they restart the session).
- Calls: dynamic number insertion per source when calls matter [CLIENT vendor]; check the state's call-recording
  consent rule (all-party states need a notice).

## 4. Server-side events and identifiers

- Browser events lose a share of conversions to blockers and cookie limits; send conversions **also** server-to-server
  (Google Ads enhanced conversions for leads / offline import, Meta Conversions API) from the form backend, queued with
  retries, never inline in the submit response.
- **Browser and server events for the same lead share one `event_id`** (generated in the page, posted with the form),
  so platforms dedupe. Without it the lead counts twice.
- Hashed identifiers: normalize first, then SHA-256 hex: email lowercased and trimmed; phone in **E.164**
  (`+15551234567`, digits only after `+`); names lowercased, trimmed. **Hashed PII is still PII**: consent and the
  privacy policy apply; server-side sending is never a way around a consent choice.
- Closing the loop: CRM status changes (qualified, won with value, lost with reason) go back as `qualify_lead` /
  `close_convert_lead` and as offline conversions, so ads optimize for clients who sign, not form fills.
- Health number: share of paid-traffic leads that carry a click id. Far below the paid-traffic share = capture broken.

## 5. Consent and privacy

- Consent Mode v2 with defaults set **before** any tag: `analytics_storage`, `ad_storage`, `ad_user_data`,
  `ad_personalization` denied where the law requires opt-in (EU/UK/some US states), granted-with-opt-out elsewhere per
  the client's counsel. Update on choice; honour Global Privacy Control as an opt-out.
- The privacy policy lists every tool (analytics, ads tags, recordings, call tracking, form backend). Keep leads;
  promise "deletion on request", never a fixed N-month deletion period.
- Session recordings (Clarity-class) mask all form fields and load after interaction.

## 6. Loading without hurting LCP/TBT

- Nothing measurement-related in the critical path. Consent defaults + a tiny inline `dataLayer` stub are the only
  head scripts. GTM/gtag/pixels load **after first interaction or on idle** (`requestIdleCallback` with a timeout
  fallback), whichever comes first; never before LCP.
- Attribution capture is a few lines of inline JS (no library) so it works even if tags never load.
- Below-fold forms: stamp from `<template>` (autofill scan ~50 ms TBT), see `forms.md`.
- Off-main-thread (Partytown-style) or server-side GTM only if a Lighthouse run with tags on shows the tags are the
  problem, and only after re-measuring that it helps; both add failure modes.
- **Prerender guard**: speculation-rules prerenders execute scripts. Gate every tag and event:

```js
const whenActive = (fn) => document.prerendering
  ? document.addEventListener('prerenderingchange', fn, { once: true }) : fn();
whenActive(() => loadTagsOnInteractionOrIdle());
```

- Lighthouse gate (mobile, tags on, consent granted path) must hold the phase-9 target; re-run after any tag change.

## 7. AI traffic channel

GA4 Admin > Data display > Channel groups: copy the default, add channel **"AI chatbots"** with `Session source`
matches regex below, and **place it above Referral** (first match wins). Review sources quarterly; names change.

```
chatgpt\.com|openai|perplexity|copilot\.microsoft\.com|copilot\.com|gemini\.google|bard\.google|claude\.ai|anthropic\.com|chat\.deepseek\.com|deepseek\.com|poe\.com|meta\.ai|mistral\.ai|grok\.com|you\.com|phind\.com|edgeservices\.bing\.com
```

Treat the numbers as noisy (many AI clicks arrive as Direct). Pair with the manual AI-visibility panel in
`site-seo/reference/ai-search.md`.

## 8. Validation (before launch and after any tag change)

- GA4 DebugView + GTM preview: each event fires on its trigger, params filled, **no duplicates** (two containers, a
  trigger firing twice, SPA re-runs, thank-you reloads).
- **Test lead end to end** on the production host: submit, then confirm the lead record with attribution fields, the
  CRM hand-off, the one alert delivered, `generate_lead` in DebugView, the server event in the platform's test-events
  tool with the matching `event_id` (deduped), and match quality.
- No PII in any request to analytics/ad domains (inspect the network log). Consent denied path: no ad cookies set.
- Prerendered navigation does not fire `page_view` until activation. Mark test leads and exclude them from reports.
- Monitoring: alert when any tracked event drops to zero or a source stops arriving (tracking breaks silently).

## 9. Reporting rules

- **Compute, never eyeball**: every total, rate and delta is computed from row-level data by a script or sheet, and
  each headline number is cross-checked a second way. A segment's claim uses that segment's own rows.
- Rates divide numerator and denominator over the **same closed window**; compare only matching closed windows
  (4 full weeks vs the previous 4 full weeks, same weekdays). Leads still inside a sales cycle are pending, not lost.
- **Small samples**: under ~1,000 sessions or ~30 conversions per arm/period, label the result "directional" and do
  not declare a winner. Low-volume sites read higher-volume signals first (step drop-off, section reach, CTA clicks).
- Platform-reported conversions never sum to reality; our lead table is ground truth. Report the ratio, not equality.
- **Never promise a % lift** to Arthur or a client. Report what changed, over which window, with the sample size.
- Mark deploys, ad changes, offers and outside events on the timeline; without the change log no change is explicable.

## Worked example (TMC, 2026-09-30)

`.claude/skills/site-method/examples/tmc-measurement-plan.md`: first/last touch + click ids as hidden fields; game-plan quiz
funnel events; section reach; CTA location; web-vitals to GA4; Clarity after interaction; Search Console Domain +
BigQuery export; offline conversions to Ads/Meta from CRM status; build order: capture + backend + CRM -> GA4 events ->
Search Console/Bing -> call tracking -> recordings -> offline conversions -> warehouse + dashboard -> improvement loop.
