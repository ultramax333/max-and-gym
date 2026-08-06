# CP8 checkpoint — offline hardening and version-1 release candidate

## Summary

- Task: 08 — hardening and version-1 release;
- base commit: `64ee66b` (CP7);
- branch: `task/08-offline-hardening-release`;
- application/database/export/cache: `1.0.0 / 8 / 2 / 2`;
- status: **local candidate verified; CP8 acceptance pending external gates**.

## Delivered

Release defaults and identity were normalized; prior-schema migration coverage now spans versions 2–7 and future-schema rejection; database-open failure has a non-destructive recovery screen and stable diagnostic ID. All page routes are lazy-loaded. Dependency and licence resolution is based on the installed lock graph. Reproducible architecture, dependency, accessibility, performance and strict vulnerability audits were added.

The production PWA was exercised at both target phone widths for hash routes, semantics, named controls, touch target, overflow, offline reload, active-workout persistence, diagnostics, visual capture and runtime-origin isolation. CI now separates quality and Chromium release evidence, while Pages deploys one verified artifact and performs a post-deploy identity smoke.

## Verification result

| Gate | Result |
|---|---|
| TypeScript / ESLint | Pass / zero warnings |
| Unit, component, domain, migration | 27 files / 82 tests pass |
| Browser release | 12/12 pass on 360 and 412 |
| Production build / Pages subpath | Pass |
| Initial JS versus CP7 | 659,633 bytes / 68.9% reduction |
| Static and dependency audits | Pass; architecture retains one documented legacy warning |
| Registry security | 0 blocking; 1 user-approved unreachable RSC exception |
| Licences/provenance | 0 unknown, 0 restricted, complete pins |
| Physical Android / production smoke | Pending external |

## Checkpoint decision

All automated local code/test/audit gates pass. CP8 is not marked accepted because incomplete bilingual copy still needs an explicit product decision or correction, and its exit gate requires physical Android evidence, production identity/tag parity, deployed old-cache update and production smoke. `PROJECT_STATUS.md` remains unchanged. No tag, push, merge or publication was performed.

Recommended next action: review this candidate, complete the external checklist, then authorize the release-candidate tag and GitHub publication workflow.
