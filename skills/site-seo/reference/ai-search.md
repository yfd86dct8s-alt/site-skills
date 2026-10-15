Distilled from Corey Haines' marketingskills `ai-seo` (MIT, commit 1efedbc) and AgriciDaniel/claude-seo `seo-local` (MIT, commit 4b99de2), read 2026-10-12, checked against Google's AI-features optimization guide (developers.google.com/search/docs/fundamentals/ai-optimization-guide) on the same date. Changes: only the evidence-based part kept; vendor statistics and monitoring-tool promotion dropped; tiers labelled by strength of evidence.

# AI-search visibility

## Evidence-based (Google states it)

- AI Overviews and AI Mode run on core Search ranking and quality systems: ordinary SEO, helpful original
  content, clean indexability, good page experience. No special markup, AI files, `llms.txt` or markdown
  versions are needed for Google, and Google says they neither help nor hurt there.
- Do not write separate content "for AI", do not chop pages into tiny fragments for AI, and do not spin
  up query-variation pages for AI answers: that falls under the scaled-content-abuse spam policy.
- Structured data is not required for generative features; keep it for rich-result eligibility and facts.
- Queries fan out to related sub-queries, so cover the real follow-up questions of a topic on the service
  page (our FAQ and process sections), written for people.
- No AI-specific Search Console report exists; use normal reports.

## Plausible but weaker (practitioner evidence, other engines)

- Non-Google assistants quote clear, self-contained passages: a direct 40-60 word answer under a question
  heading, definitions, comparison tables, dated facts. This is also just good writing for humans;
  adopt it only where it helps the visitor, never as a separate layer.
- Third-party presence correlates with citation: consistent listings (Bing Places, directories, niche
  directories and professional registries, e.g. a state bar profile for law), mentions in reputable local sources, real reviews. Correlation
  studies from vendors: treat as direction; do not quote figures to clients without re-verifying source
  and date.
- Original, first-hand information (real process, real timelines, local specifics) is the most defensible
  differentiator.

## Folklore or optional (do not sell as a lever)

- `llms.txt`: not a cross-vendor standard; add only if a documented consumer you care about reads it.
  Cheap, harmless, unproven.
- Claims of "30-40% higher AI visibility" from schema, "GEO scores", prompt-stuffing, hidden text for
  bots. Ignore.
- Guaranteeing placement in ChatGPT/Perplexity/AI Overviews: impossible; never promise it.

## Crawler controls

Audit each documented user agent separately, then decide per bot with the client:
search/answer fetchers (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, ordinary Googlebot/Bingbot),
possible training crawlers (`GPTBot`, `ClaudeBot`), and `Google-Extended` (affects certain Gemini
use of content Google already crawled; it does not affect Search inclusion or ranking). Blocking a search
fetcher removes you from that engine's answers; blocking a training crawler does not. Record the decision
in the dossier; confirm bot names against each vendor's docs because they change. Check that
CDN/WAF rules do not block the bots the client wants.

## Measuring

Manual panel: the client's 10-20 real queries run monthly through Google, ChatGPT and Perplexity, noting
whether the business is cited, which competitor is, and which page was used. Treat results as noisy samples.
Referral traffic from AI engines shows up in analytics by referrer: a GA4 "AI chatbots" channel group above
Referral (regex in `site-craft/reference/measurement.md`); do not over-read it.
