# ADR 0011 — Capacitor Android runtime for reliable local rest alarms

- Status: Accepted
- Date: 2026-08-07
- Decision owner: Max
- Related task/checkpoint: Task 90 corrective work; CP3 timer and CP8 Android release gates

## Context

Android can freeze or terminate a browser page. The v1.1.0 page-owned `setTimeout` therefore cannot guarantee a rest alarm or notification in the background. The workout and timer timestamps remain correct in IndexedDB, but no JavaScript callback is guaranteed at the deadline.

The requested behavior is a local alarm that sounds for longer while the application is backgrounded or the screen is locked, plus restoration of an active workout after process recreation. No backend, push service or remote runtime dependency is permitted.

## Options considered

### Option A — Keep the Progressive Web App only

Keep timestamp reconciliation and provide a best-effort foreground alert. This preserves the smallest distribution surface but cannot meet the Android background-alarm requirement.

### Option B — Trusted Web Activity

Package the hosted site with minimal native code. This keeps the GitHub origin but does not provide the direct, offline native bridge needed for exact alarms and controlled long audio.

### Option C — Capacitor with a small local Android plugin

Embed the existing React/Vite application and keep Dexie as domain truth. Mirror only the active timer identifier and deadline to Android `AlarmManager`; use a short foreground alarm service for ten seconds of sound/vibration and a Stop action.

### Option D — Rewrite in Kotlin

Rebuild the UI, repositories and domain code natively. This offers no proportional benefit and creates a large migration and regression surface.

## Decision

Adopt Option C.

- Keep the GitHub Pages PWA and Android APK in the same repository.
- Build the Android web bundle with relative asset paths and without a service worker.
- Keep IndexedDB/Dexie as the authoritative workout state. Android stores only the current timer projection and last alarm action.
- Schedule or cancel the native projection only after the corresponding Dexie transaction commits.
- Use `SCHEDULE_EXACT_ALARM`, with a truthful inexact fallback when permission is unavailable.
- Transfer existing PWA data only through the validated `.maxgym` backup/import flow. Never clear or rename the existing database.
- Restore `#/workout/active` when a process-style launch starts at the root and an active/paused session exists.
- Keep signing keys and credentials outside Git.

## Consequences

### Positive

- Reliable local scheduling outside the WebView lifecycle.
- Ten-second alarm and vibration with a native Stop action.
- Fully offline application assets and data.
- Existing React, Material UI, domain, backup and Dexie code remain shared with the web build.
- Web deployment remains available and independently testable.

### Negative

- Android adds a JDK/SDK/Gradle build surface and physical-device acceptance matrix.
- Android 12+ exact alarms and Android 13+ notifications require explicit user permission.
- PWA and APK IndexedDB origins are separate, so first-time transfer requires a `.maxgym` export/import.
- Force-stop remains an Android system boundary: the user must reopen the application before new alarms can be scheduled.

## Verification

- Web and Android web bundles build independently.
- Android CI compiles a debug APK and runs JVM tests.
- Unit tests verify schedule/cancel projection after committed timer transitions.
- Browser E2E verifies active-workout route recovery after a root relaunch.
- Pixel 9a acceptance covers app switch, screen lock, permission denial, alarm Stop/Open actions, timer changes, process recreation, offline launch and backup import.

## Supersedes / superseded by

Extends ADR 0004 (local IndexedDB, no backend), ADR 0005 (web hash routing) and ADR 0006 (PWA update behavior). It supersedes the PWA-only interpretation of the timer guarantee for the Android APK; the PWA remains best-effort.
