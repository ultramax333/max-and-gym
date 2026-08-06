# Max & Gym user guide

## Install and first use

Open the production site in current Android Chrome, complete onboarding, then use Chrome's **Install app** action when offered. The first successful online load installs the offline files; reload once before deliberately disconnecting the network.

Version 1 defaults are English, Advanced, Metric, dark theme, Full Gym, three weekly days, 60-minute main sessions, 15-minute core sessions, a balanced goal mix and every high-impact/floor-transition exclusion enabled. Frequency and duration can be changed during onboarding.

## Train

Use **Train** to start the next active-program day or a free workout. The active workout is persisted locally after each critical action. Completing the same set twice with a retry identifier is ignored, timers restore from their stored end time, and reopening resumes the active session instead of creating another.

Finish the workout to create an immutable history snapshot and progression proposals. A proposal changes the live program only after explicit acceptance.

## Programs and exercises

Programs can be created, reordered, duplicated, activated and archived. The generator supports two or three days, 40- or 60-minute main sessions and 10- or 15-minute core sessions. Locked main exercises remain unchanged when accessories are regenerated.

The reviewed exercise library and its seed images are local. **Never Suggest** removes an exercise from generated content and alternatives without hiding prior history. Custom exercises may include one local image.

## Progress and private photos

Progress includes session history, raw exercise sets, records, explicitly labelled estimated 1RM trends and body measurements. Photos are resized, re-encoded and stored only in IndexedDB. The app does not upload them or put personal media in its service-worker cache.

## Back up and restore

Open **Backup** and export a `.maxgym` file after meaningful changes. Keep it outside the browser/device if possible. The archive includes structured data and referenced personal media with counts and checksums.

Before import, the app validates versions, paths, sizes, checksums and available storage. **Replace** restores the archive after confirmation; **Merge** deduplicates stable records and reports conflicts before resolution. Invalid archives do not modify current data.

If an update, storage error or database error appears:

1. do not clear browser/site data;
2. open **Diagnostics** and run the non-destructive self-test;
3. export the separate diagnostic archive if support evidence is needed;
4. export a personal backup if the database still opens;
5. retry or update the app;
6. restore with Replace only from a validated backup.

Diagnostic exports deliberately exclude workout values, measurements, notes, custom names, photos and binary media. A diagnostic export is not a personal backup.

## Offline and updates

After installation, the shell, active workout, reviewed exercise media, programs, progress, settings, backup export and diagnostics are designed to work offline. Capabilities such as wake lock, vibration, sound, notifications and persistent storage depend on the browser/device and are never required to complete a workout.

When an update is waiting during an active workout, Max & Gym defers the reload. Finish or safely pause the workout before applying it. If the installed version seems stale, reconnect, open Diagnostics, recheck the service worker, then apply the waiting update without clearing storage.

## Storage warning

IndexedDB belongs to the exact browser origin. A different protocol, domain, GitHub username or repository slug has separate storage. Browser cleanup, device loss and operating-system eviction can remove it; only an external `.maxgym` file is a durable recovery copy.
