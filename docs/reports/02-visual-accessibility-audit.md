# CP2 visual and accessibility audit

Date: 2026-08-06

## Visual baseline

| Viewport | Evidence | Result |
|---|---|---|
| 360 x 800 | screenshots/02-home-360x800.jpg | Home, empty state and five-item bottom navigation fit the mobile shell. |
| 412 x 915 | screenshots/02-home-412x915.jpg | Safe-area bottom spacing and primary action remain reachable. |
| 1440 x 960 | screenshots/02-home-desktop-1440x960.jpg | Desktop navigation rail is visible and content remains centred. |
| 412 x 915 | screenshots/02-onboarding-412x915.jpg | Onboarding intentionally suppresses persistent navigation. |

## Accessibility baseline

- Dark-only palette follows the documented contrast-oriented tokens.
- CssBaseline provides a visible focus outline and honours reduced motion.
- Button and icon-button component defaults have 48 px minimum dimensions.
- Route headings use semantic H1/H2 structure; reorder controls have explicit labels.
- Bottom navigation exposes all five destinations by accessible name.
- Offline mode has an announced visual state; PWA update and error-boundary states are
  retained from CP1; Settings exposes Diagnostics directly.

Automated evidence: theme and UI primitive tests, full suite (14 tests), scoped lint,
TypeScript and production build all passed.

## Follow-up

Task 03 will add data-backed loading and recoverable error cases to the active-workout
surface. Task 05 will bind the accessible reorder primitives to program data.
