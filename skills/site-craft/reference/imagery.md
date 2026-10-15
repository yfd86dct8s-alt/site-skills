# Imagery - generated branded scenes

How we make a site's images: AI-generated, art-directed scenes in the brand's world (branded-generated-imagery
memory). Proven on Gem Cap (`clientes/gem-cap-trucking/06-brand/IMAGE-PLAN.md`, the worked example with tools);
iteration rules partly from the "Commercial Pipeline" skill (unlicensed: ideas only, no text copied; scan
`_metodologia/inbox/2026-10-14-arthur-links-scan.md`).

## Order (per site)

1. **Direction first.** 3-4 styles on the SAME scene, 2 cheap samples each, one comparison page, ★ on the
   recommendation; the full set only after Arthur picks (image-direction-first memory, CLAUDE.md phase 6).
   **The sample he approves becomes the style reference image**: attached to every prompt of the set (with "match
   this image's style, light and grade; use it only for style"), and its look words become the shared LOOK block.
   Then a first small batch (2-3 slots) for a quick look before the rest, so a drift is caught early.
2. **Slot table from the approved wireframe**: slot, scene, subject, aspect per breakpoint, text over it or not,
   model. Measure each slot on the real page (320/390/768 and 1534x692) before prompting; safe zones for text.
3. **Prompt brief** from `DESIGN.md` (the ~15-line block, see design-md.md) feeds the shared blocks.
4. **Generate, judge, log, pick, export**, as below. Post-production last, only on images the site uses.

**Real found pictures (a separate tier):** real places and history (city pages, the street, old maps) use licensed
open-collection images (Wikimedia Commons, the Met, Art Institute of Chicago open access), credited and downloaded
into the project. Never generate a real, named place.

**Section comps:** before coding the sections, one cheap generated image per section as a direction mock-up
(hero anchors to try: text bottom-left over the image, image as canvas, inverted split).

## Prompt architecture

Fixed blocks in a fixed order: FORMAT + COMPOSITION + SUBJECT + SETTING + LOOK + NEGATIVES.

- **Shared blocks are verbatim** across the whole set (LOOK, NEGATIVES, the subject/vehicle sentence). Two
  separately worded descriptions of the same thing produce two different things; the set must read as one shoot.
- **Per-slot blocks** (COMPOSITION, SETTING) are the only ones that change.
- **Framing from a layout guide, not from words.** Models follow "subject in the right 45%" loosely and refuse to
  draw a small subject; a guide image placed where the subject must land works (Gem Cap `tools/img/guide.py`).
- **Scale in the words, not baked in**: generate the object at its normal size; the size relationship is stated in
  the prompt or solved by the crop.
- **Vehicles, machines, props**: three-quarter view, whole object in frame, real material wear (clean CAD-looking
  metal reads as CGI), no decals, numbers or emblems. **The real logo/livery mark is composited afterwards,
  never trusted to the model**; the model may draw the livery colours and shapes from a flat proof.
- **People**: no face focus, nothing implying a real employee; real people (founder, team) are real photos.
- **Text in images**: none, except the logo from the references. Image models mangle letters.
- **References carry identity, the prompt carries the scene.** A reference with dramatic baked-in light fights
  every scene lit differently; subject references (a truck proof, a product) get flat, even light.

## Judging a batch

- Generate 2 per slot (2-3 for heroes). Identical prompts diverge; one sample says nothing about the prompt.
- Judge on **3-4 binary checks written before generating**, in priority order, never on "the prettiest". Prettiness
  picks the wrong thing and the next round inherits it. Typical: subject inside its zone after the crops; right
  model/livery; no defects (duplicates, melted geometry, stray text, wrong wheel counts); grade per the LOOK.
- **Describe what actually generated, not what was planned**, before the next prompt that uses it as a reference.

## Fixing

- Name the failure, change only the block that caused it, re-batch. Never re-roll an unchanged prompt hoping.
- **A failure that repeats gets its own named rule** in the prompt, stated as an absolute and anchored to the scene
  ("the truck faces left, toward the bridge's start"), not described better inside each slot's composition.
  Gem Cap example: the model sentence that locks every rig to the same tractor family.
- **Complexity budget**: once a slot is clean, stop. Each extra idea is one more thing to get wrong; if a change
  made it worse, revert to the last clean prompt instead of fixing forward.

## Delivery

- Log every generation (prompt, model, cost, seed if any) in the client's `06-brand/` log.
- Export AVIF + WebP + JPEG at several `srcset` widths with explicit width/height; hero preloaded, the rest lazy.
- `?h=<hash>` on every image URL (hash-every-image-url memory).
- **OG/social image** for every key page: 1200x630, critical content centred (platforms crop), minimal text,
  hashed URL like the rest.
- Check on the real page: text-to-subject gap and text contrast over the photo (worst 2% of the background under
  each line: 4.5:1 body, 3:1 large text).
- **Total budget cap per site written in the IMAGE-PLAN before the first batch** (GEMCAP hit "orçamento bateu" mid-build) and spend-so-far from the log; cheap model for directions and drafts, the better
  model only for heroes and finals.
