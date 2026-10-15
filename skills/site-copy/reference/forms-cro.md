Distilled from Corey Haines' marketingskills `cro` v2.0.3 and `cro/references/form.md` (MIT, commit 1efedbc, read 2026-10-12). Changes: demo/trial/SaaS forms dropped; field-count percentages kept as rough direction only; our rule "ask only what visibly changes what the visitor gets" and TBT/template rules added; no enrichment or third-party form tools.

# Forms and page-level CRO

## Every field has a cost

Rough direction from the source: 3 fields = baseline, 4-6 fields lose roughly 10-25%, 7+ lose 25-50%. Treat as
direction, not a promise; never quote these figures to a client as ours.

A field earns its place only if the answer **visibly changes what the visitor gets** (a faster callback
to the right person, a real estimate, the right office). Questions that only help us (lead scoring,
"how did you hear about us", budget gating, marketing-source surveys) are cut or moved after the
submit. Ask for each field: needed before we can help? Obtainable another way (UTM/referrer capture is
silent, not a question)? Can it wait for the callback?

Typical lead form: name, phone or email (whichever we will actually use), one free-text
"what happened / what do you need" (optional), plus at most one choice that routes the lead. Phone optional
unless the promise is a call; if required, say why in one line ("so we can call you back today" - only
if true).

## Order, layout, labels

- Easiest first (name), sensitive last (phone, case details). Single column. Two columns only for first/last.
- Visible labels, never placeholder-only. Placeholders are examples ("name@example.com"), not labels.
- Mobile layer applies (`site-craft/reference/mobile.md`): 16px inputs, `type`/`inputmode`/`autocomplete`/
  `enterkeyhint`, targets >= 44px, never block paste, sticky or clearly visible submit.
- Selects: radios under ~5 options; "Other" gets a text field. Checkboxes parallel and few.

## Multi-step

Only above ~5-6 fields or with genuinely distinct sections or branches. Rules: "Step 2 of 3" progress,
easy first, one topic per step, Back works and keeps answers, state survives refresh, required vs optional
marked, final step holds the sensitive fields. The first step should already feel like a conversation
about the visitor's problem, not an intake form.

## Microcopy

- Button: verb + what they get ("Get My Free Case Review"), the site's one label for this intent. While
  sending: disabled + "Sending..."; never a silent button.
- Errors: what happened + why + how to fix, next to the field, input preserved, focus to the first error:
  "That email is missing an @. Check it looks like name@example.com". Never "Invalid input".
- Success: what happens next, who contacts them, in what window, and a non-form route (call). Promise
  only a window the client will meet (ties to the proof ledger). No fake demo submit in builds: with no
  endpoint connected the form shows a "not connected" state in dev, never a pretend success.
- Trust near the submit: privacy line that is true ("We use your details only to answer this request"),
  the response window if real, the phone number as an alternative, a real review/credential only if it is
  in the ledger. No security badges that are not real. Do not promise a lead-deletion period
  (see Arthur's rule); "delete on request" is fine.

## Performance and measurement

- Below-the-fold `<form>` elements cost ~50 ms TBT (autofill scan): stamp the form from a `<template>`
  when it scrolls near, keep `contain-intrinsic-size` (content-box) so there is no CLS. Hero form: keep
  it light, no validation library.
- Event names, dedupe, consent and reporting: `site-craft/reference/measurement.md`.
- Measure with consent-gated tags loaded after interaction, never before: form view, first-field focus,
  submit attempt, success, errors by field, device split. Lighthouse is run with tags on. Keep the
  event names identical across sites.

## Page-level CRO checks (in order of impact)

0. Message match: the headline repeats the promise of the ad or query that brought the visitor.
1. Value proposition: five-second test. What, for whom, where, what next.
2. Headline: specific, in the visitor's words, matches the ad/search that brought them.
3. One primary CTA, visible without scrolling, repeated at decision points; call and form both reachable
   from every screen on mobile.
4. Scannability: the argument survives skimming headings and the first line of each section.
5. Trust near the CTAs: only proven items (ledger). A strong single proof beats a pile of weak ones.
6. Objections answered where they arise: price, "will this work for my case", timing, "what if" - FAQ and
   process steps. Write FAQs as the visitor's literal questions.
7. Friction: field count, unclear next step, slow load, mobile issues, interstitials.

Page-audit report shape: Verdict (is the page the problem, or the offer?), Fix now (<= 7 items, each with effort
and confidence), Test - don't guess, Not a problem, Could not check. Under ~1,000 sessions or ~30 conversions the
data is noise: say so and rank from first principles. Never promise a % lift.

Do not run A/B tests on low-traffic sites; decide from principles and the review pass, test only with
volume.
