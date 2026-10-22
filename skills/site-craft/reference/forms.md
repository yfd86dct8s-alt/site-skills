# Forms: architecture and style (internal guide)

Arthur 2026-10-12, on Elevate's intake form: "a primeira parte do formulário é de uma alternativa só, então ela deveria
ser clique e já passava próximo passo... tá sem botão de voltar... tem que fazer o style and architecture guide pros
forms... o do tmc já tinha acertado em alguns dos pontos que você errou nesse." This file is that guide. It collects
what TMC's approved quiz (E05/E11) and GEM's forms already settled, so the next site starts from them instead of
rediscovering them on Arthur's phone. Copy rules for forms (field cost, labels, errors, microcopy) live in
`site-copy/reference/forms-cro.md`; this file is the structure, behaviour and look. Both apply.

## 1. Architecture: decide before markup

1. **Name the one outcome** the form buys the visitor (a case review, a game plan, a quote). The final button says it
   ("Get my free case review", "Build my full game plan"), in the same words as the CTAs that lead to the form.
2. **Steps only when they help:** above ~5-6 fields, or when the first answer changes the next questions. Order: the
   visitor's situation first (a conversation about their problem), details second, contact last.
3. **One topic per step.** A step whose ONLY control is one single-choice group is a **one-tap step** (below).
4. **Every field changes what the visitor gets** (forms-cro.md). Fold what can be folded: one "Your name" field, not
   first + last; "best time to call" optional chips, not a required select. Count required answers on the longest path
   and justify each one.
5. **Branches:** a choice reveals its own follow-ups (`[data-reveal]` + `[data-when]`); hidden branches stay out of
   validation and out of the payload. Options can never contradict an earlier answer.
6. **Contact step last**, with the legal lines next to the button (regulated clients: the rulebook's exact elements;
   SMS consent = unchecked, optional, never a condition).
7. **Ready to connect, never fake:** no endpoint -> the submit says the form is not connected yet and gives the phone,
   keeping what was typed. With an endpoint: POST, then the thank-you page (noindex, says what happens next).
   The endpoint sends two emails, the client's alert and the visitor's confirmation (`site-method` "Every site
   ships these").

## 2. Behaviour

**One-tap steps (TMC quiz rule).** No Next button while unanswered. A pointer pick advances by itself after a 220 ms
confirmation (the other options dim to .45; 0 ms under reduced motion; stays inside the 500 ms input window, so the
height change is not CLS). Re-tapping the answer that is already picked (after Back) advances too (no `change` fires:
handle the click). Arrow keys only move the choice and reveal Next; Enter, Space or Next commit it. A preset answer
(a practice page that knows the situation) shows Next from the start; never skip the step silently.

**Back.** One Back control in the card head, top left (arrow + "Back", text button, 44 px tall, no fill, ink colour),
the step label on the same row to the right; hidden on step 1. The row keeps 44 px on every step (no jump when Back
appears). Back keeps every answer and returns to the step as it was.

**Step change.** The new step rises 8 px and fades in, 220 ms, transform/opacity only, none under reduced motion.
Focus moves to the new step's question (its legend or first label, `tabindex=-1`, `preventScroll`), never to an input
(that pops the keyboard on phones) and never shows a focus box. The step label is `aria-live="polite"` (it announces
"Step 2 of 3: ..."); the progress bar is decoration (`aria-hidden`), animated with `scaleX`. If the card head is under
the fixed nav, re-aim it to the top (smooth unless reduced motion).

**Validation.** On Next/submit, per step: inline message under the field (what is wrong + how to fix), `aria-invalid` +
`aria-describedby`, focus to the first error, errors clear as the visitor fixes them. Enter inside a step = Next, never
the final send. Phone: >= 10 digits; email: a plain shape check. Never block paste.

**Sending.** Button disabled with `aria-busy` and "Sending..."; failure message in `role=status`/`alert` with the
phone; the form keeps its values; the result box is laid out at its final height (no shift).

**Loading (TBT).** A below-the-fold `<form>` costs ~50 ms of TBT at load (autofill parse): stamp it from
`<template data-stamp>` ~900 px before the viewport (IntersectionObserver; read the LAST entry, not `en[0]`). A CTA click
stamps the form first, then scrolls to it (known-mistakes #6). The slot reserves the MEASURED step-1 height per
breakpoint, separately for pages with a preset answer (it shows Next: taller). Re-measure whenever step 1 changes.

## 3. Style

- **The card:** white (`--color-card`) with a hairline and a soft shadow, roomy padding (20-40 px), one column on phones;
  two columns only for short paired fields (phone + email) from ~640 px.
- **Inside a dark band the card keeps the LIGHT roles, buttons included.** A band's white button style must never reach
  the card (`:is(.section--navy, .section--blue) :is(.form-card, .on-light) .btn-outline { light roles }`). Elevate's
  Back was white on white for hours because of this. GEM has the same latent rule (`components.css:438`).
- **Choices as chips/cards:** whole card tappable, >= 48 px (52 px stacked), 16 px text, the indicator always reserved
  (no reflow on pick), checked = tint + ring; short options (4 short labels) in a 2 x 2 grid on phones, never four
  stacked rows; long options stacked.
- **Labels:** visible, above the control, 600 weight; "(optional)" in muted text; placeholders are examples only.
- **Controls:** 16 px text (no iOS zoom), `type` / `inputmode` / `autocomplete` / `autocapitalize=off` on email /
  `enterkeyhint` (`next`, last single-line field `send`, textareas `done`).
- **Buttons:** one primary per step (amber), full width under 480 px; secondary = Back in the head only.
- **Geometry is constant across states (CLS):** border width never changes on hover/focus/error (states change
  colour, background, outline); the error/helper line reserves `min-height: 1lh` even when empty; an input and the
  button beside it share one height (44 px floor). The "Sending" state appears only after ~150 ms, then stays >= 300 ms.
- **Fine print** (B2/B3-type lines) at 13 px / 1.45, muted, every required element kept, right under the button.
- **Dark theme:** the card stays readable in both themes; run the checks in both.

## 4. Port, don't rebuild

- Classic steps (Elevate's version has every rule above): `.claude/skills/site-method/examples/elevate-forms.js`,
  `src/components/ConsultationForm.astro`, `IntakeBand.astro`, form CSS in `07-style-guide/components.css` (form card,
  `.form-card__top`, `.form-back`, chips, `.is-picked`, `step-in`) and `sections.css` (intake band, slot heights).
- The adaptive quiz (several single/multi questions that build an answer): TMC E11 `site/public/home/gameplan.js` +
  `gameplan-core.js` (pure, testable), `.gp*` CSS in `site/public/sg/components.css`, `FinalCta.astro`, `AuditSheet.astro`.
- Partial lead after step 1 and the not-connected message: GEM `site/public/js/forms.js`.

## 5. Checks (run before showing any form; copy the tools into each new site)

- `node tools/form-flow.mjs <base> <route> <presetRoute>`: Chromium + WebKit, 390 + 1534, light + dark: one-tap step
  advances on a tap and shows no Next before; Back visible from step 2 with text contrast >= 4.5:1 on the card; Back
  keeps the answer; arrow keys never advance; focus lands on the question; card head not under the nav; preset shows Next.
- `node tools/form-steps.mjs <base> <route> <outDir>`: screenshots of every step + each button's colours.
- `node tools/anchor-landing.mjs <base>`: every CTA lands on the form, centred, no hash left.
- Slot vs real step-1 height at 320-1534, with and without a preset: within ~10 px.
- Manual: Arthur's iPhone after a reload, one-thumb, keyboard up on the contact step (the button stays reachable).
