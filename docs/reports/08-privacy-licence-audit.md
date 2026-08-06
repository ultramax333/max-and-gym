# CP8 privacy, security and licence audit

## Privacy and network

Static origin scanning and representative Chromium journeys found no analytics, Sentry, Alceris, advertising, remote-font or third-party runtime request. Browser traffic contained only the serving origin. Progress photos and custom images remain IndexedDB blobs and are excluded from service-worker runtime caching. Diagnostic export tests seed notes, loads, repetitions, measurements, names and binary media and assert that none is exported.

## Dependency security

The registry reported one distinct high-severity advisory, duplicated in npm's package totals: `GHSA-qwww-vcr4-c8h2` for React Router's server/RSC action protocol. The user approved the narrow option on 2026-08-07. The exception:

- is pinned to direct `react-router-dom` 7.18.2;
- applies only to the named advisory and affected router packages;
- expires 2026-10-01;
- is accepted only when source scanning finds no Router server/RSC package or API;
- does not allow any other high or critical finding.

The current audit result is one evaluated exception, zero blocking findings and no detected server/RSC surface. This is an unreachable-surface risk acceptance, not a claim that the upstream code is patched.

## Licences and provenance

The installed licence categories contain 715 package-manifest entries across permissive and compatible licences, including the exercise dataset's CC-BY-4.0 entry; the dependency audit evaluates a 777-package lock graph including optional/peer metadata. Results: zero unknown installed licence, zero restricted licence, zero incomplete source pin and all required provenance files present. Platform-specific optional packages absent from Windows are reported separately and are not treated as installed.

Project distribution remains GPL-3.0-or-later. `SOURCE_PINS.json`, `THIRD_PARTY_NOTICES.md`, `THIRD_PARTY_CODE_MAP.md` and `COPYING` are the release provenance set.
