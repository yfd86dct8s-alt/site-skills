# Scan of links Arthur sent (2026-10-14)

Method: passive only, same as `2026-10-12-skills-scan.md`. Nothing installed. Two Sonnet researchers read
repos, READMEs, SKILL.md files and licenses. Opus did the synthesis.

## Worth taking (ideas only, reimplement in vanilla CSS/JS)
- **Kinetics** (kinetics.colorion.co, github.com/ckissi/kinetics; MIT claimed, no LICENSE file in the repo): spring
  "weight" for presses, card lifts and toggles via CSS `linear()` easing. The best fit for our motion rules.
- **MicroKit** (microkit.co; MIT per its FAQ, provenance mixed): magnetic fill button, cursor-edge glow (pointer:fine only).
- **Magic UI** (MIT): CSS marquee (review/logo strips), number ticker (IO + reduced-motion), blur-fade reveal via
  `animation-timeline: view()`.
- **Aceternity free tier** (license unclear): hover-reveal cards, word-by-word text reveal. Reimplement from the look only.
- **21st.dev** as a *visual catalog* for the phase-5 reference sweep (screenshots to the private archive only; its
  terms forbid reusing its media). Its MCP needs a free API key; not set up.
- **Brand-guidelines guide (Fabiano)**: add two blocks to DESIGN.md: a "must not look like" line (anti-direction) and a
  ~15-line quick reference that gets pasted into image-generator prompts.
- **Commercial Pipeline skill** (Notion page -> Drive zip; markdown only, no scripts, **no license**, so ideas only):
  a prompt-writing pipeline for 30 s AI ads (image references -> one Seedance video prompt -> fixes). We make no ads and
  a hero video costs LCP, so the video part is out. Its image-reference rules feed our branded-imagery process (our Gem
  Cap IMAGE-PLAN already found shared verbatim blocks and no-text). New to us: judge each batch on 3-4 binary checks, never
  "prettiest"; a failure that repeats gets its own named lock, anchored to the scene, not the frame; describe what actually
  generated, not what was planned; complexity budget (once clean, stop; if a change made it worse, revert); vehicles in a
  3/4 view with real wear and no decals (real livery/logo applied afterwards, never generated); scale stated in the
  prompt, not baked into the image.

## Skip
- knowledge-work-plugins/small-business (Arthur 2026-10-14: we do no prospecting and no client meetings, so nothing to apply it to).
shadcn/ui, Motion Primitives (React-only; low value), Anime.js (CSS covers us; maybe splitText below the fold only),
vgpu (WebGPU: TBT/LCP cost, patchy support), img2threejs (Three.js ~150 KB+), Apify OSM leads (thin coverage of US trades;
default flow targets businesses that already have sites), n8n-skills/n8n-mcp (only if we adopt n8n; the MCP can write to
the instance and its credentials, so a dev instance with read-only keys and telemetry off), thumbnail skill (no YouTube),
unlockdeepwork.com (focus music, not tooling), Anthropic brand-guidelines skill (Anthropic's own brand).

## Open
- frontend-design upstream changed 2026-09-03 (SKILL.md 9,390 bytes): check that our plugin copy is current.
