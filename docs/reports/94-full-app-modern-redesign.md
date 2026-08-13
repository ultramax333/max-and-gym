# Full application modern redesign

Date: 2026-08-12

Scope: shared visual system, application shell and all route families

Requirements: UI-010 through UI-020 and the global mobile shell, Home, Train, Programs, Library, Progress, Settings, Diagnostics and onboarding screen blueprints

## Outcome

The approved calm performance-minimalist direction now applies across the whole application. The work extends the shared Material UI theme and shell first, so legacy editors and secondary pages inherit the same surface, form, dialog, button, feedback and navigation language. The primary hubs and previously dated list-based pages received explicit compositions.

No workout, generator, persistence, backup, timer, native Android or catalogue business logic changed.

## Global visual system

- Dark technical palette retained with clearer surface hierarchy and restrained teal/blue accents.
- Responsive typography, stronger heading hierarchy and tabular metric support.
- Consistent cards, fields, chips, alerts, dialogs, tabs, toggles, list rows, snackbars and progress bars.
- Forty-eight-pixel minimum button and icon-button targets retained.
- Translucent top bar, modern mobile bottom navigation and branded desktop rail.
- Safe-area-aware containers, stable vertical scrolling and forced horizontal clipping at the application shell.
- Reduced-motion and visible-focus behavior retained.

## Explicitly redesigned routes

- Home and Train use featured next-session cards, consistent icon surfaces and clear quick actions.
- Programs use a segmented status surface, richer program cards and mobile-safe wrapped actions.
- Generator and active workout retain the modern redesigns from the two preceding checkpoints.
- Library uses stronger search/filter hierarchy, local-image cards and an explicit no-photo state.
- Settings is regrouped into Profile, Training, Data and About surfaces.
- Tools replaces the legacy icon list with responsive utility cards.
- History uses a full-size date navigator, card surface and a coherent empty state.
- Diagnostics now uses the same route container and semantic page header.
- Onboarding uses a focused seven-step card and a safe-area-aware sticky action bar.
- Progress, backup, video, summary, editor and secondary routes inherit the updated global system.

## Changed files

- `src/theme/maxGymTheme.ts`
- `src/theme/maxGymTheme.test.ts`
- `src/components/layout.tsx`
- `src/components/app_bar.tsx`
- `src/components/nav.tsx`
- `src/components/ui/UiPrimitives.tsx`
- `src/pages/shell/ShellPages.tsx`
- `src/pages/programs/ProgramPages.tsx`
- `src/pages/library/LibraryPages.tsx`
- `src/pages/settings/settings.tsx`
- `src/pages/apps/appsMenu.tsx`
- `src/pages/history/history.tsx`
- `src/pages/onboarding/onboarding.tsx`
- `src/pages/diagnostics/DiagnosticsPage.tsx`
- `tests/release.spec.ts`

## Data and release impact

- Database schema: unchanged.
- Import/export and backup formats: unchanged.
- Generator and workout algorithms: unchanged.
- Android native behavior: unchanged.
- Runtime network origins: unchanged.
- Dependencies and UI frameworks: unchanged; Material UI remains the only production UI system.
- App version/build number: unchanged; this checkpoint is intentionally not deployed.

## Verification

- TypeScript: passed.
- Full scoped ESLint: passed with zero warnings.
- Unit/component suite: 47 files and 185 tests passed.
- Production PWA build: passed; 13,294 modules transformed and 175 files precached.
- GitHub Pages subpath smoke: passed.
- Pixel 9a accessibility and generator journeys: 3/3 passed at 412 × 915.
- Expanded visual routes: passed at both 360 × 800 and 412 × 915.
- Project, architecture, accessibility and network audits: passed.
- Manual browser review: Home, Train, Programs, Library, Settings and onboarding checked at 412 × 915 with no horizontal overflow or console error.

## Accessibility evidence

- Every representative route retains a semantic level-one heading.
- Icon-only actions remain explicitly named.
- Primary action targets remain at least 48 pixels high.
- State and selection use text and icons in addition to colour.
- Mobile cards stack instead of compressing into horizontal tables.
- The onboarding navigation exposes full-size Back/Next controls.

## Known limitations

- Dense legacy workout editors retain their established information architecture, but inherit the new global components and shell.
- Exercise entries without a reviewed local image now show an explicit placeholder; the redesign does not fabricate exercise media.
- Large exercise and application chunks remain an existing bundle-size optimization opportunity and are not a visual-release blocker.

## Rollback

Revert the files listed above. No database, cache-version or backup-format rollback is required.

## Provenance

No donor code, external visual asset, remote font, second UI framework or new dependency was introduced. All styling is implemented with the existing Material UI system and local assets.
