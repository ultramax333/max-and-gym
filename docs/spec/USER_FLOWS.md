# User flows

## UF-01 — First installation

1. Open the GitHub Pages URL.
2. App shell loads.
3. Welcome explains local-only data.
4. Select two or three weekly sessions.
5. Select 40 or 60 minutes.
6. Confirm mixed goals.
7. Confirm Full Gym and Metric units.
8. Review default hard exclusions.
9. Enable or disable low-back-comfort warm-up.
10. Enable body measurements/photos.
11. Choose sound/vibration/wake-lock preferences.
12. Request persistent storage.
13. Generate or choose the starter program.
14. Show Android installation instructions.
15. Arrive on Home.
16. Record onboarding completion transactionally.

Failure handling:

- denied persistent storage does not block onboarding;
- interruption resumes from last completed step;
- exercise seed failure shows Retry and Diagnostics;
- no account prompt appears.

## UF-02 — Start the next workout

1. Home shows Next Workout.
2. Tap the card.
3. Review estimated duration and blocks.
4. Tap Start.
5. Active session is created before navigation.
6. Warm-up opens.
7. Complete or explicitly skip warm-up.
8. First exercise opens with previous values.

Acceptance target: no more than three taps from Home to the first exercise.

## UF-03 — Complete a normal set

1. Planned load and repetitions are prefilled.
2. Adjust if needed.
3. Optionally enter effort.
4. Tap Complete Set.
5. UI disables duplicate submission.
6. An operation identifier is generated.
7. Set and active-session position save in one transaction.
8. Success state appears.
9. Rest starts from persisted timestamps.
10. Undo is available.
11. Next target is visible.

Failure handling:

- failed write reverts optimistic completion and shows Retry;
- repeated operation identifier does not duplicate the set;
- app refresh resumes at the same position.

## UF-04 — Rest and background recovery

1. Rest starts.
2. User backgrounds the app.
3. Browser may throttle or suspend timers.
4. On visibility return, remaining time is derived from `endsAt`.
5. If rest elapsed, show elapsed state and best-effort alert.
6. A killed process does not guarantee an alert, but reopening recovers the correct timer state.

## UF-05 — Resume interrupted workout

1. App detects one active session at boot.
2. Home prioritizes Resume.
3. Tap Resume.
4. Validate session integrity.
5. Restore current exercise, set, elapsed session time, and timer.
6. If a recoverable inconsistency exists, repair and record a diagnostic event.
7. If not recoverable, offer safe snapshot/export before reset.

## UF-06 — Substitute an exercise

1. Open exercise actions.
2. Tap Replace.
3. Show alternatives matching movement function, target muscles, equipment, safety tags, and time budget.
4. Excluded candidates never appear.
5. Show why each option matches.
6. Choose this session only or future program.
7. Save original and actual exercise identifiers.
8. Translate prescription conservatively.
9. Continue without losing logged sets.

## UF-07 — Finish workout

1. Tap Finish.
2. If planned work remains, show a clear incomplete-work confirmation.
3. Commit final session status and end timestamp.
4. Stop timer and release wake lock.
5. Calculate summary and records from persisted data.
6. Create progression proposals.
7. Show duration, completed work, records, notes, discomfort, and proposals.
8. User accepts, edits, rejects, or postpones each proposal.
9. Return to Home.

## UF-08 — Generate a program

1. Open Programs → Generate.
2. Choose two or three days.
3. Choose 40 or 60 minutes.
4. Adjust goal emphasis.
5. Review constraints, priorities, and variation.
6. Generate deterministically from a seed.
7. Show weekly structure, duration, movement balance, and explanations.
8. Regenerate accessories without changing locked main exercises.
9. Replace individual exercises.
10. Save as draft or activate.
11. Preserve prior program history.

## UF-09 — Quick core session

1. Home → Quick Core.
2. Choose 10 or 15 minutes.
3. Choose cable/standing, floor, or mixed.
4. Engine validates transition sequence.
5. Start.
6. Complete controlled blocks.
7. Finish and save as a workout.

## UF-10 — Add progress photo

1. Progress → Body → Photos.
2. Tap Add.
3. Choose camera/gallery.
4. Select pose.
5. App re-encodes, resizes, removes unnecessary metadata, and creates thumbnail.
6. Show estimated local storage cost.
7. Add optional weight/note.
8. Save Blob and metadata transactionally.
9. Revoke temporary object URLs.
10. No network request occurs.

## UF-11 — Export personal backup

1. Settings → Backup.
2. Run integrity preflight.
3. Show included record and photo counts.
4. Generate `.maxgym` ZIP.
5. Validate manifest and checksums before download.
6. Save last successful backup timestamp.
7. Show recovery instructions.

## UF-12 — Restore

1. Settings → Import.
2. Select `.maxgym`.
3. Read manifest without modifying current data.
4. Validate version, checksums, media references, and storage capacity.
5. Show summary and conflicts.
6. Choose Replace or Merge.
7. Create a pre-import snapshot.
8. Import into staging or a transaction.
9. Run integrity checks.
10. Commit.
11. Show counts and any non-blocking warnings.

## UF-13 — Diagnose a failure

1. A visible error shows a stable error identifier.
2. Open Settings → Diagnostics.
3. View build/schema/service-worker/storage state.
4. Run self-test.
5. Export diagnostic package.
6. Share the package and error identifier for analysis.
7. No personal workout values or photos are included by default.
