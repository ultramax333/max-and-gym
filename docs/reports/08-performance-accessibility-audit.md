# CP8 performance and accessibility audit

## Performance

| Measure | Result | Gate |
|---|---:|---|
| CP7 initial JavaScript | 2,124,140 bytes | baseline |
| CP8 initial JavaScript | 659,633 bytes minified | Pass ≤700,000 |
| Reduction | 68.9% | Pass |
| Largest non-data route chunk | 395,966 bytes | Pass ≤450,000 |
| Lazy exercise-data chunk | 866,252 bytes | Pass ≤900,000 |
| Total production artifact | 31,036,071 bytes / 523 files | recorded |

Route-level `React.lazy` splitting moved legacy screens, charts, generator, photos, backup and diagnostics out of the first route. Vite still emits its generic 500 kB warning for the entry and exercise dataset; the explicit CP8 budgets pass. Exercise photographs dominate total artifact size and remain intentional offline seed media.

## Accessibility

Static WCAG 2.2 AA checks pass: primary text contrast 17.94:1, secondary text 9.36:1, 3 px visible focus outline, reduced-motion handling and 48×48 CSS-pixel button/icon targets. The shared layout now exposes one main landmark, while legacy Settings and Diagnostics have visible `h1` headings.

Playwright checked Home, Programs, Progress, Library, Settings and Diagnostics at 360×800 and 412×915 for a visible main landmark/title, named buttons and no horizontal overflow. Active-workout primary controls measured at least 48 px. All 12 release browser scenarios passed.

Remaining manual work: exhaustive keyboard order/focus restoration, TalkBack announcements and real Android reachability must be checked on the production build. These are not claimed as hardware passes.
