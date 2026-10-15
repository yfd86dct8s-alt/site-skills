# Motion

Distilled from Emil Kowalski's `emil-design-eng` and `review-animations/STANDARDS.md` (MIT). React,
Framer Motion, spring, clip-path and blur material removed (repo rule: transform/opacity only, CSS first).

## Should it animate?

| How often the visitor sees it | Decision |
|---|---|
| Constantly (nav hover, menu toggle used many times) | None or near-instant |
| Often (hover on cards, accordion) | Short and subtle |
| Occasionally (menu sheet, form step change, toast) | Standard |
| Once (hero arrival, first reveal of a key section) | Can carry the page's one authored moment |

Never animate keyboard-initiated actions. Every animation needs a purpose: spatial consistency, state
indication, explanation, feedback, or preventing a jarring change. "Looks cool" is not a purpose.

## Easing tokens (put in tokens.css)

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entering/exiting, UI feedback - the default */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* things moving on screen */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* menu sheet / bottom sheet */
```

Spring feel without a library: the `linear()` spring tokens in `effects.md` (transform only).

Never `ease-in` on UI. Hover/color changes may use plain `ease`; constant motion uses `linear`.

## Durations

| Element | Duration |
|---|---|
| Button press feedback | 100-160ms |
| Tooltip, small popover | 125-200ms |
| Dropdown, select | 150-250ms |
| Menu sheet, modal | 200-400ms |
| Hero arrival / section reveal (page sections) | up to ~600ms total, staggered 30-80ms between items |

UI animations stay under 300ms. Exits run at 60-75% of the enter duration. Focus rings are never in a
`transition` list - they appear instantly. Accordions and disclosures do not animate height
(nor `grid-template-rows`): open instantly or fade the content.

## Physicality

- Never animate from `scale(0)`: start from `scale(0.95-0.97)` + `opacity: 0`.
- Press feedback on every pressable element: `:active { transform: scale(0.97) }`,
  `transition: transform 160ms var(--ease-out)`.
- Dropdowns scale from their trigger (`transform-origin` at the trigger edge); modals stay centered.
- Use CSS transitions (interruptible) over keyframes for anything the visitor can trigger repeatedly.
- `transition` lists properties explicitly - never `transition: all`.
- `will-change` only on an element about to animate, removed after; never as a baseline.

## Reveal on scroll (page sections)

- Element is visible by default; JS adds the hidden-start class only when it will animate it, so no-JS
  and slow-JS visitors see content (and LCP is never gated).
- Hidden start = `opacity: 0; transform: translateY(12-24px)` - space is already reserved, so no CLS.
- One IntersectionObserver for the page; unobserve after reveal.
- Nothing above the fold waits on a reveal.

## Reduced motion

`prefers-reduced-motion: reduce` means fewer and gentler, not zero: keep opacity fades (shortened),
drop movement, parallax and scale. Never a global `0.01ms` kill that removes useful state feedback.

## Hover

Gate hover styles: `@media (hover: hover) and (pointer: fine) { ... }` - otherwise taps leave sticky
hover states on phones. Touch gets feedback through `:active`.

One hover signal per element - lift, fill or colour, not several at once. No hover-scale by default; scale
only where the ledger allows it (portraits sharing a plain wall, known-mistakes #12).
