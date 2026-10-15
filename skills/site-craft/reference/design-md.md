# DESIGN.md - the client's brand file

Format follows the DESIGN.md convention used by VoltAgent's `awesome-design-md` collection (MIT) and
Google Stitch (`npx @google/design.md lint` validates it; optional). We use the format only - never a
copy of another brand's system for a client.

One file per client at `clientes/<client>/DESIGN.md`. It is the handoff between sessions: any session
building or reviewing a page reads it first. The approved style guide (`07-style-guide/`) is its
rendered proof; `tokens.css` is generated from / kept in sync with its front matter.

## Template

```markdown
---
version: alpha
name: <client>-design
description: "<2-3 sentences: the world, the surfaces, the one accent, the type voice, the feel>"

colors:
  primary: "#......"        # the action color
  on-primary: "#......"
  accent: "#......"         # brand secondary, used sparingly
  ink: "#......"            # body text
  ink-muted: "#......"
  canvas: "#......"         # page background
  surface-1: "#......"
  surface-2: "#......"
  hairline: "#......"
  inverse-canvas: "#......" # footer / dark band, if any
  inverse-ink: "#......"
  semantic-success: "#......"
  semantic-error: "#......"

typography:
  display-xl: { fontFamily: <face>, fontSize: clamp(...), fontWeight: 700, lineHeight: 1.05, letterSpacing: -0.02em }
  headline:   { ... }
  subhead:    { ... }
  body:       { fontFamily: <face>, fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
  label:      { ... }

rounded: { none: 0, sm: 4px, md: 8px, lg: 16px, pill: 999px }
spacing: { 1: 4px, 2: 8px, 3: 12px, 4: 16px, 6: 24px, 8: 32px, 12: 48px, 16: 64px, section: clamp(...) }
motion:
  ease-out: cubic-bezier(0.23, 1, 0.32, 1)
  ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
  ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)
  press: 160ms
components:
  button-primary: { background: "{colors.primary}", color: "{colors.on-primary}", rounded: "{rounded.md}", height: 48px }
  ...
---

## Overview          - who visits, use scene (device, light), the feel in one paragraph; the idea sentence
                      ("On this page, [thing only they have] becomes [the device]")
## Must not look like - 2-4 lines: what the brand must never be mistaken for (e.g. "a generic
                      ambulance-chaser firm", "a freight broker template"). Steers away from the niche default
## Structure fingerprint - one line: page macrostructure + nav/footer archetype (`structures.md`) and six
                      axes: heading placement, body composition, section divider, button voice, image
                      treatment, reveal. A new client differs from the last two on >= 3 axes (ported
                      nav/sheet/form/footer exempt).
## Colors            - roles and where each may appear; contrast pairs that pass AA
## Typography        - faces (self-hosted files), hierarchy, principles
## Layout            - grid, container widths, section rhythm, whitespace philosophy
## Elevation & Depth - shadows (offset + soft blur), borders
## Shapes            - radius scale; photo/illustration geometry
## Imagery           - generated branded scenes (reference/imagery.md); real photos only for real people;
                      treatment (crop, grade, overlay); what is banned
## Components        - buttons, cards, inputs/forms, nav, menu sheet, action bar, footer
## Motion            - the one authored moment; reveal rules; reduced-motion behavior
## Do's and Don'ts   - client-specific, from DECISOES.md
## Responsive        - breakpoints (fluid from 320), touch targets, collapsing strategy
## Known gaps        - what is pending from the client (logo vector, photos, numbers)
## Prompt brief      - the whole brand in at most 15 plain lines (palette with hex, light, mood, subjects,
                      what is banned, the must-not-look-like line), pasted as the shared block of every image
                      prompt and into any other tool that must follow the brand
```

Rules: tokens referenced as `{colors.primary}`; every color pair used for text listed with its
contrast ratio; Do's/Don'ts carry Arthur's decisions so they are never re-asked. "Must not look like" and
"Prompt brief" ideas from Fabiano Carvalho's brand-guidelines guide (2026-10; no text copied); write both before the
image-direction round, since the brief is what the directions are generated from.
