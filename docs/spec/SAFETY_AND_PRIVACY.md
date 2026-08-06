# Safety and privacy requirements

## 1. Scope

max&gym is a workout planning and logging tool. It is not a medical device, diagnostic tool, physiotherapy application, or substitute for individualized assessment.

The app may organize user-selected mobility and training movements, record discomfort, and avoid known triggers. It must not claim to diagnose, treat, cure, or prevent low-back conditions.

## 2. Known movement constraints

The user reports low-back pain during:

- bunny jumps;
- exercises requiring rapid movement from plank/floor to standing.

Therefore automatic generation must exclude:

- bunny jumps;
- burpees;
- rapid plank-to-standing drills;
- comparable fast floor-to-standing conditioning;
- high-impact transition circuits.

The user can add any exercise or movement tag to `Never suggest`.

## 3. Warm-up and mobility

Provide short dynamic and exercise-specific warm-ups. Include an optional low-back-aware gentle mobility preset using slow, symptom-free movements and specific ramp-up sets.

Rules:

- mobility is optional and editable;
- no movement is described as guaranteed safe;
- avoid long, aggressive static stretching immediately before heavy strength work by default;
- stop/replace controls remain available;
- the warm-up is included in the advertised workout duration.

## 4. Discomfort logging

Optional before/during/after fields:

- area;
- intensity 0–10;
- associated exercise;
- description;
- action taken.

The app can show patterns such as “This exercise was linked to discomfort in 2 recent sessions.” It must not infer a diagnosis.

When discomfort is recorded during a workout, offer:

- reduce load;
- reduce range or repetitions only as a user-controlled note, not a medical prescription;
- substitute exercise;
- stop exercise;
- end session.

## 5. Urgent warning copy

Keep warnings concise. Example:

> Stop the session and seek prompt medical assessment for severe or rapidly worsening pain, new marked weakness or numbness, loss of bladder/bowel control, or numbness around the saddle area.

Do not show this warning on every session. Place it in the discomfort help screen and show contextually for severe/new neurological symptoms if entered.

## 6. Program-engine safeguards

- Hard exclusions always override goal scores.
- Do not use discomfort or performance data to certify exercise safety.
- A substitution must be visible and reversible.
- The engine cannot increase load after a session marked with exercise-associated pain unless the user explicitly overrides the hold.
- No automatic deload, cancellation, or medical recommendation.
- The generator explains uncertainty when constraints reduce program balance.

## 7. Privacy model

- No account.
- No cloud.
- No analytics.
- No remote image hosting.
- No telemetry.
- No health data in URLs.
- No progress-photo thumbnails in service-worker caches.
- No sensitive data in console logs or error reports.
- No automatic sharing.

The public GitHub repository contains only application code and generic seed content. Personal data remains in the browser origin’s local storage.

## 8. Progress-photo handling

- Compress locally.
- Strip metadata where practical.
- Store Blob data in IndexedDB.
- Offer blurred thumbnails.
- Require explicit confirmation before deletion.
- Include photos only in a user-triggered complete backup.
- Never include photos in comma-separated-value exports.

## 9. Storage resilience

- Request persistent browser storage after onboarding or first meaningful data entry.
- Show storage quota and usage.
- Warn when available storage is low.
- Remind the user to export a backup after meaningful growth or before a major migration.
- Never imply that browser storage is an infallible backup.

## 10. File import safety

- Validate archive structure and schema.
- Reject path traversal and unsupported files.
- Limit decompressed total size.
- Verify media checksums.
- Do not execute imported content.
- Use plain-text notes.
- Keep existing data intact until restore validation succeeds.
