Distilled from Corey Haines' marketingskills `copywriting` (honesty principle only, MIT, commit 1efedbc, read 2026-10-12) and AgriciDaniel/claude-seo `seo-local` legal/review notes (MIT, commit 4b99de2, text only). Changes: mostly our own process - the proof ledger and the law-firm checklist are written for this repo; no jurisdiction rules are asserted here.

# Claims, proof and regulated industries

Rule zero: a claim without proof does not ship. This is not advice, it is the gate. The source's line
holds: fabricated statistics or testimonials erode trust and create legal liability.

## The proof ledger

Keep `clientes/<cliente>/proof-ledger.md` (create if missing). One row per claim, written at copy time:

| Claim as it appears | Where used | Evidence (file/link/screenshot) | Who confirmed + date | Status |
|---|---|---|---|---|

Claims that need a row: any count (years, clients, cases, reviews, staff), "first/only/best/#1",
exclusivity, speed or availability promises ("24/7", "same day"), guarantees, awards, certifications,
results, percentages, comparisons with competitors, "licensed/insured", "in-house".

- Evidence beats memory: a screenshot of the award page, the licence number lookup, the client's written
  confirmation. A client's written confirmation counts as proof; Arthur may decide awards and claims he
  states are true.
- Status: proven / pending (stays OFF the live site, behind a flag or simply absent) / cut.
- Claim wording must not exceed the evidence ("since 2009" needs the registration date, not "over 15
  years" rounded up).
- Sweep every occurrence when a claim changes: hero, meta, OG, alt text, schema, FAQ, footer, ads.
- No weak numbers: omit small counts ("12 reviews"); keep the strong figure only.
- Competitor comparison or "we're the only X": needs proof or it is out.
- Third-party data (rankings, "AI says"): cite the source and date, or do not use.

## Regulated industries (law, health, finance, insurance)

Read the client's `02-legal-advertising.md` first. It holds the jurisdiction's advertising rules (state
bar / regulator) and what the client's counsel approved. If the file is missing, create the task to
research it and keep every item below OFF until it exists. This skill does not state what a given bar
allows; rules vary and change.

Checklist for law-firm copy (each item: confirm against `02-legal-advertising.md`, then log in the ledger):

- **Past results / verdicts:** usually need a disclaimer ("results depend on the facts of each case"),
  must be real, verifiable and not misleading; some jurisdictions restrict or forbid them. Never
  imply they predict your outcome. No composite or invented cases.
- **Testimonials and reviews:** real, with permission, no compensation implying bias; some bars require
  disclaimers or ban them. Never edit a review's meaning. No review gating (screening happy clients before
  asking for a review) - platforms and regulators prohibit it.
- **"Expert", "specialist", "board certified", "top", "best", "leading":** often restricted to formally
  certified specialties or banned as unverifiable superlatives. Prefer factual wording ("handles
  personal injury cases"; "practicing since 2009" if true).
- **Fee statements:** "free consultation" and "no fee unless we win" need accurate terms (costs vs fees,
  who pays expenses) stated or linked; do not hide conditions.
- **Attorney-client relationship:** the form needs a line that sending it does not create one and that
  non-urgent information is not privileged until engagement. Sensitive details: do not request them in
  the first form.
- **Office/location claims:** a city page or address implies a real office there; do not list a location
  that is not staffed. Name the responsible attorney where the bar requires it.
- **Attorney schema/bios:** credentials and admissions exactly as the bar record shows them; link to the
  record if possible.
- **Advertising label:** some jurisdictions require "Attorney Advertising" or similar; a legal-disclaimer
  page does not replace it.

Other regulated niches (health, finance): same method - dossier file first, ledger, conservative wording.

## When unsure

Leave the claim out of the draft, list it under "claims awaiting proof" in the final message, and let
Arthur or the client decide. Cutting costs little; a bad claim can cost the client its licence.
