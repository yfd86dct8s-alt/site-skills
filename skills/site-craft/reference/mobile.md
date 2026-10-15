# The phone layer

Distilled from Emil Kowalski's `mobile-native` (MIT). Applies to every page; mobile is the base layer,
desktop is the enhancement (fluid from 320px; check 360/390/414/768).

| Problem | Fix |
|---|---|
| Hover stuck after tap | Wrap hover styles in `@media (hover: hover) and (pointer: fine)` |
| Gray/blue flash on tap | `html { -webkit-tap-highlight-color: transparent; }` + an `:active` state on every tappable |
| Hero cut off / jumps when URL bar moves | Hero `min-height: 100svh` (stable). Not `dvh` on page content (shifts mid-scroll). Not `100vh`. |
| Page zooms into a form field | `input, textarea, select { font-size: 16px }` minimum. Never `maximum-scale=1` / `user-scalable=no`. |
| Tap feels laggy | `touch-action: manipulation` on `a, button, [role=button]`; feedback on `:active`, not on click |
| Content under the notch | `viewport-fit=cover` in the viewport meta + `env(safe-area-inset-*)` padding on fixed bars |
| Bottom action bar covers content / home indicator | Pad it with `env(safe-area-inset-bottom)`; pad the page end by the bar height |
| Menu sheet scroll leaks to the page | `overscroll-behavior: contain` on the sheet |
| Long-press selects button text | `user-select: none` on buttons only (never on body text) |
| Horizontal scroller scrolls the page | `touch-action: pan-y` / scroll-snap with `overscroll-behavior-x: contain` |
| Sideways scroll from one stray element | `overflow-x: clip` on BOTH `html` and `body` (`clip`, not `hidden`: keeps `position: sticky`) |
| Grid column blown out by an image/long word | `minmax(0, 1fr)` tracks, not bare `1fr`; display headlines `overflow-wrap: anywhere; min-width: 0` |
| Status bar color mismatch | `<meta name="theme-color">` matching the header background |

Form keyboards: `type="email"`, `type="tel"`, `inputmode="numeric"` for ZIP, `autocomplete` tokens
(`given-name`, `family-name`, `tel`, `email`, `organization`, `postal-code`, `address-level2`),
`enterkeyhint="next"/"send"`. Never block paste.

Thumb zone: primary actions reachable at the bottom of the screen on phones (app-style action bar
after the hero CTA leaves the viewport). Touch targets >= 44x44px with >= 8px between them. A small visual control keeps its look and grows
its hit area with `::before { content: ""; position: absolute; inset: -12px }`.

Test on Arthur's real iPhone 11 (LAN QR, `verify/qr-lan.mjs` pattern) before calling a mobile pass done;
emulation does not reproduce sticky hover, tap delay, safe areas or the keyboard.
