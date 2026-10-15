# Typography

Distilled from Impeccable `reference/typeset.md` (Apache-2.0). Detector/live-mode material removed.

## Set the system before editing

State: the roles the site needs (display, heading, subhead, body, label, metadata, data), the contrast
between them, reading measure and density, the authoritative families and weights, and the
performance/localization constraints. Use the fewest roles and families that make the hierarchy
unmistakable; combine size, weight, space and tone instead of asking size alone to do the work.
Name tokens by purpose (`--text-display`), not value.

## Apply

- Body >= 16px (1rem). Prose 45-75ch. Wider lines need more leading; tune line-height to the face.
- Display type may scale with the viewport (`clamp()`), max ~6rem; keep reading surfaces predictable.
- Light text on dark surfaces: a bit more line-height, a touch more tracking, one weight step up.
- Repeated roles stay identical across pages and states.
- `font-variant-numeric: tabular-nums` where numbers are compared; `text-wrap: balance` on headings,
  `text-wrap: pretty` on short paragraphs.
- Load only used weights (variable font with a narrow axis range, or 2-3 static files), self-hosted,
  `font-display: swap`, preload only the face used above the fold, metric-compatible fallback
  (`size-adjust`/`ascent-override`) so the swap does not shift layout.
- Paragraph rhythm by spacing *or* indent, not both.
- Respect zoom and user font settings.
- A second family only when it has a job the first cannot do.
- Candidate pools beyond Google Fonts: Fontshare (General Sans, Switzer, Cabinet Grotesk, Sentient...) - always
  downloaded and self-hosted, never the CDN link; check each face's licence before use.

## Verify

Never faux italic/bold: a style that is used has its real font file loaded (an italic emphasis word in a
headline = the italic file, preloaded). Roles recognizable without reading the copy; long text comfortable at every width; type belongs to the
brand; no invisible text or reflow on load; zoom and focus usable. Answer each with rendered evidence.
