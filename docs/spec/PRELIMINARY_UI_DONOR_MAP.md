# Preliminary Workout.cool UI donor map

Task 00 verifies this map against an immutable donor commit. Product/design decisions are already made; the audit confirms paths and technical coupling.

| Pattern | Preliminary class | max&gym decision |
|---|---|---|
| Mobile navigation density | A — inspire | Rebuild with Material UI bottom navigation and max&gym information architecture. |
| Desktop sidebar/header | A — inspire | Rebuild as responsive Material UI navigation rail/sidebar. |
| Exercise card hierarchy | B — reimplement | Thumbnail, title, equipment/muscle metadata, status controls. |
| Exercise search/filter experience | B — reimplement | Full-screen mobile filter sheet, local IndexedDB query. |
| Exercise detail content hierarchy | A/B | Rebuild with two-position local images and max&gym instructions. |
| Program cards and day accordions | B — reimplement | Material UI cards/accordions using local Program entities. |
| Program builder grouping | B — reimplement | Local builder; no server actions. Explicit move controls required. |
| Drag-and-drop implementation | D by default | Do not import dnd-kit by default. Consider only after CP5 audit and only with accessible alternative and acceptable bundle cost. |
| Active workout set presentation | A/B | Rebuild from screen blueprint around local transaction/state machine. |
| Workout action sheets | B — reimplement | Material UI mobile drawers/bottom sheets. |
| Statistics card composition | A/B | Rebuild using the chart library retained/selected by CP0/CP7 audit. |
| Chart library code | D by default | Do not import donor chart stack solely for visual similarity. |
| Loading/empty/error states | A/B | Rebuild with max&gym copy and diagnostics. |
| Marketing/landing pages | D — reject | Not part of product. |
| Authentication/account | D — reject | No account. |
| Prisma/PostgreSQL/server actions | D — reject | Incompatible with static/local architecture. |
| Payments/ads/premium/email | D — reject | Out of scope. |
| Leaderboards/social | D — reject | Out of scope. |
| Exercise videos/thumbnails | D — reject | Media licence not approved; version 1 uses Free Exercise DB images. |
| Tailwind/shadcn/Radix/DaisyUI styling | D — reject | Material UI is the sole production UI system. |
| Pure framework-independent utility | C only after proof | May be adapted with immutable provenance, tests, and MIT notice. |

## Likely donor areas to inspect

Workout.cool currently organizes code under areas such as:

- components/shared user-interface code;
- entities, including exercise;
- features, including layout, programs, workout builder, workout session, and statistics;
- widgets.

Task 00 records exact paths at the pinned commit. The absence or movement of a path does not reopen the product decision; it changes only the audit evidence.
