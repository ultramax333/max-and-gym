# Max & Gym 1.8.0 release notes

## Training flow

- Generated single sessions are ordered and labelled by equipment to reduce unnecessary station changes.
- Every exercise in the active workout plan opens a full local photo and technique preview without changing the current exercise.
- Working-set counts now vary between two and five according to session length, goal, exercise role and saved contextual preference.
- The active exercise can receive one extra working set by trading one untouched working set from the closest future exercise. Completed or started work is never rewritten and the planned session duration remains unchanged.

## Contextual exercise ratings

- Exercises can be rated from one to five during a generated session.
- A rating is stored independently for body area and training goal. A row can therefore have one rating for glutes hypertrophy and another for back strength.
- Future local generation uses the matching contextual rating for selection and gives highly rated non-strength movements a small optional repetition-range extension.
- Saved generated sessions retain their rating context.

## Data and safety

- Ratings remain local in the existing `appMeta` backup surface; no database migration or reset is required.
- Set-plan adjustments are transactional and idempotent.
- Application version: `1.8.0`.
- Generator version: `deterministic-v8`.
- Database schema: `8` (unchanged).
- Export format: `2` (unchanged).
