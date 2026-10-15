# GEMCAP - image plan (phase 6/7)

Written 2026-10-03 after Arthur asked whether the image and prompt architecture was planned. It was not, for the
hero: images were generated before the text-safe areas were fixed against the real headline and his 1534x692 screen,
so the first batches had the truck too big for the text and the model ignored framing instructions half the time.
This file is the method from now on. Brand rules: `DESIGN.md` > Imagery; livery: `06-brand/livery-review.html`.

## 1. Method (every slot, in this order)

1. **Layout first.** Measure the slot on the real page at 320, 390, 768 and 1534x692 (Arthur's screen): box size and
   aspect per breakpoint, and the **safe zones** (where text sits, where the subject must stay, what any crop cuts).
2. **Framing comes from a layout guide, not from words.** Image models follow "put the truck in the right 45 percent"
   loosely, and they will not draw a small subject: the 4K "plate" idea (truck at a quarter of the frame, cropped per
   breakpoint) failed on 2026-10-03 - asked for 25% of the width, Pro drew 46% in both plates (one also faced the wrong
   way). What works: a **layout guide** as the last reference image - an earlier good photo of the scene scaled and
   placed exactly where the subject must land on the target canvas, its margins edge-stretched and blurred
   (`tools/img/guide.py`), with the prompt saying "match its framing exactly, continue the scene into the blurred
   margins". 2 of 4 samples obeyed size and position with a clean livery (one per slot); generate 2 per slot.
   Each layout/breakpoint family gets its own photo (hero: A-wide, A-mid, B, phone); crops only trim, never reframe.
3. **Prompt from fixed blocks** (section 3): the shared blocks are identical in every prompt, so the set looks like
   one shoot; only the composition and setting blocks change per slot.
4. **Generate 2-3 per slot** (2K, or the 4K plate for heroes), then QA (section 4). Log every image (`log.jsonl`).
5. **Pick, measure, export.** Read the subject's box on a 1% grid (fractions of the photo), then export AVIF (q62) +
   WebP + JPEG fallback at several `srcset` widths with explicit width/height (`tools/img/hero_export.py` for the
   hero: it also writes the numbers the CSS needs). The hero is the only preloaded image; everything else lazy.
   Then two checks on the real page (headless, 18+ screen sizes): the text-to-subject gap (never touching) and the
   text contrast over the photo (worst 2% of the background under each line: 4.5:1 body, 3:1 large text).
6. **Post-production at the end, only on images the site uses** (Arthur, 2026-10-03): the real logo and badge
   composited (perspective + light matched), manufacturer emblems and model defects removed.

## 2. Slots (from the approved wireframe)

Inner-page heroes follow the wireframe pattern: desktop = text left, image right in a frame; phone = text first,
image below. No text over those images, so no text-safe zone; the subject stays inside the central 80 percent so
the 4:3 desktop frame and the 3:2 phone frame both hold it.

| # | Slot | Scene | Rig(s) | Desktop | Phone | Text over it | Model |
|---|---|---|---|---|---|---|---|
| 1 | Home hero | Overseas Highway / Seven Mile Bridge, turquoise water, late morning | white | A: 21:9, truck right (A-wide for hero boxes from ~2.1:1, A-mid below); B: 21:9, truck centered low | 9:16 + extra sky, text on top, truck below | yes | done (Pro 2K, guides) |
| 2 | Home services (feature) | fleet line-up at the Miami yard | 5 colors | 3:2 | 3:2 | no | done (NB2), fix logos at the end |
| 3 | Home cruise spotlight | port gate at PortMiami at sunrise, cruise ships behind | navy + white | 4:3 | 3:2 | no | NB2 2K |
| 4 | Home drivers teaser | driver (seen from behind / three-quarter, no face focus) walking to a GEMCAP truck at a Florida truck stop, golden hour | black | 4:3 | 3:2 | no | NB2 2K |
| 5 | Trucking hero | interstate at dawn, open road, the rig in motion | navy | 4:3 | 3:2 | no | NB2 2K |
| 6 | Cruise hero | cruise ship at the pier (PortMiami), the rig alongside | white | 4:3 | 3:2 | no | Pro 2K |
| 7 | Cruise section | truck at the dock, pallets of provisions going aboard, ship's hull | blue | 3:2 | 3:2 | no | NB2 2K |
| 8 | Expedited hero (G-EXPRESS) | blue hour, a GEMCAP rig leaving the yard, headlights on, vivid sky (not dark) | black | 4:3 | 3:2 | no | NB2 2K |
| 9 | Logistics hero | dispatch room: screens with an abstract U.S. + Canada route map from Miami (no readable text), no faces | - | 4:3 | 3:2 | no | NB2 2K |
| 10 | Drivers hero | driver beside a GEMCAP truck on the highway shoulder / truck stop, golden hour, no face focus | silver | 4:3 | 3:2 | no | NB2 2K |
| 11 | About hero | GEMCAP office and fleet at the Miami yard (low building, palms) | mixed | 4:3 | 3:2 | no | NB2 2K |
| 12 | Founder | **real photo of Maricelis Montiel, or the letter without a photo. Never generated.** | - | - | - | - | - |

The U.S. + Canada map with arcs from Miami (proof block) and the route-line steps are SVG, not generated images.
Aerial 3D routes (BIBLIOTECA item 7) only if a page needs it later.

## 3. Prompt architecture (fixed blocks)

Every prompt = FORMAT + COMPOSITION + VEHICLE + SETTING + LOOK + NEGATIVES, in that order.

- **FORMAT** - "Photorealistic {aspect} photograph for a Miami trucking company's website."
- **COMPOSITION** (per slot) - the subject's place and size as fractions of the frame, what stays empty and why
  ("space for a headline"), camera height and lens. For plates: subject at moderate size, generous margins.
- **VEHICLE** (per rig, generated by `tools/livery/prompts.py` from the same table as the proofs) - the truck model
  sentence + the livery sentence + the reference roles: image 1 = the rig's flat proof (the side we will see:
  road side when the truck faces left), image 2 = compact logo, image 3 = the cab mark. Same words in every prompt.
  Model sentence since 2026-10-03 (the white rig once came out as a long-nose with chrome stacks; Arthur wants every
  rig to be the same model): "a sloped aerodynamic hood and a large chrome grille, similar to a Kenworth T680 (the same
  model as the rest of the GEMCAP fleet: no vertical exhaust stacks, no long square classic hood)". For single-rig
  shots, a photo of another fleet rig as an extra reference ("use it only for the tractor's model and shape") locks the
  model.
- **SETTING** (per slot) - the real place (PortMiami, Seven Mile Bridge, Miami yard), time of day.
- **LOOK** (shared, verbatim) - "Florida light, vivid and saturated natural color, clear air, crisp detail, high
  dynamic range, high-end commercial photography. No haze, no muted, washed-out or desaturated grading."
- **NEGATIVES** (shared, verbatim) - "No people unless described. No text, letters or numbers anywhere except the
  GEMCAP logo and mark from the references. No manufacturer emblems or ornaments on grilles and hoods. License plates
  blank or hidden. No watermark. No duplicated or floating vehicles or objects."

## 4. QA checklist (per image, before it is shown)

- Composition: subject inside its zone after the planned crops; nothing cut that matters (wheels, cab, bumper).
- Vehicle: right model family; livery right (cab color, the field at the trailer FRONT in the right color, the gold
  blade leaning toward the cab, logo on the white part, mark on the sleeper); no extra logos or lettering.
- Defects: duplicated or floating parts, melted geometry, wrong wheel counts, impossible shadows, stray text.
- Grade: living daylight (or vivid golden/blue hour where planned); never grey or muted.
- People (slots 4, 10): no face focus, nothing implying a specific real employee.

## 5. Budget

About 12 slots x 2-3 tries: Nano Banana 2 at 2K is US$0.10 per image, Pro at 2K US$0.134, Pro at 4K US$0.24.
Estimate US$5-8 for the whole site. Spent so far (2026-10-03, from the logs): US$3.23 for 25 images (livery test,
5 rigs + line-up, the white rig remade, 3 hero rounds + 2 failed 4K plates).

## 6. Hero files (2026-10-03)

**Current (round 6):** `m` = phones/portrait, a vertical photo of the same rig (`hero-m2-20261003-210244-1.png`, layout
guide `guide-m.png` built from beside2-2 with a painted deep sky: `guide.py ... --canvas 1536x2752 --src-crop
1400,0,3168,1344 --scale 0.907 --at -22,1358 --sky-top 18,88,186`); retouched in `hero_export.py`: sky joint smoothed
(`fix_seam` 1359), stretched bottom cut (crop to 2570px), sky deepened per row for white text (`deepen_for_text`
0.50-0.57), +886px of sky on top (`sky_to_aspect` 2.25, always width-scaled). `a-wide` and `a-mid` as below.
Lesson: a guide's painted areas and stretched edges get copied literally - keep guides seamless, or plan to retouch.

History (rounds 3-4):

| Slot | Photo (raw, local) | Truck box (l, t, r, b) | Used when |
|---|---|---|---|
| A-wide | `hero-beside2-20261003-190806-2.png` | 0.487, 0.190, 0.947, 0.828 | layout A, viewport aspect >= 19/10 and height >= 636px, or width >= 1176px on short screens |
| A-mid | `hero-a2-20261003-195013-1.png` (guide `guide-a2.png`) | 0.520, 0.415, 0.844, 0.845 | layout A, other wide screens |
| B | `hero-b2-20261003-195104-1.png` (guide `guide-b2.png`) | 0.350, 0.490, 0.646, 0.915 | layout B, wide screens |
| phone | `hero-phone-20261003-190304-1.png` + 781px of extended sky, clouds thinned above the truck | 0.085, 0.438, 0.952, 0.805 (before the extension) | phones, portrait tablets, narrow windows |
| C (Arthur's direction) | B's photo, left 900px cut (full height), sky on the text side deepened toward a vivid deep blue by a baked graduated grade that skips the truck (`grade_sky`) | 0.092, 0.490, 0.506, 0.915 (in the crop) | layout C, wide screens; horizon at 0.753 of the height |

Guides: `python tools/img/guide.py 06-brand/hero/photos/hero-beside2-20261003-190806-2.png 06-brand/hero/guides/guide-a2.png
--canvas 3168x1344 --scale 0.70 --at 569,380` and `python tools/img/guide.py 06-brand/hero/photos/hero-sky2-20261003-190855-1.png
06-brand/hero/guides/guide-b2.png --canvas 3168x1344 --scale 0.766 --at 383,335`. Web files: `python tools/img/hero_export.py`
-> `06-brand/hero/web/` (+ `hero-images.js`, the numbers the review page's CSS uses).
