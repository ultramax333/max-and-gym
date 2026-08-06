# Licence and source policy

## 1. Final project licence

Because max&gym derives from RepQuest, the distributed project remains under the GNU General Public License version 3 or any later version permitted by the base.

Retain:

- RepQuest copyright notices;
- full applicable GNU General Public License;
- source availability for the deployed derivative;
- modification history;
- third-party notices.

## 2. Workout.cool

Workout.cool is MIT-licensed.

Allowed:

- study its interface;
- reproduce general interaction ideas;
- copy/adapt isolated client-side code when licence/provenance requirements are met.

Required for copied/substantially adapted code:

- immutable source commit;
- original path;
- destination path;
- copyright and MIT notice;
- modification record;
- test;
- row in `THIRD_PARTY_CODE_MAP.md`.

Not approved:

- server/database/auth/payment/advertising/premium/social code;
- importing another UI framework merely to reuse a component;
- videos/images without separate licence evidence.

## 3. Free Exercise DB

Use a pinned revision as the upstream source for exercise data and paired images. Maintain:

- source revision;
- source identifier;
- curation overrides;
- local optimized asset mapping;
- licence notice;
- generated seed version.

Public-domain status does not remove the need for traceability and quality review.

## 4. Proprietary products

Train Sweat Eat and other proprietary applications may be used only as behavioral inspiration.

Do not copy:

- application code;
- decompiled code;
- APK assets;
- videos;
- images;
- text;
- logo;
- brand;
- private API data;
- exact distinctive design.

## 5. New max&gym content

- UI copy is original.
- Exercise instruction edits are concise original summaries based on permitted source material/general knowledge.
- No unverified scraping.
- No remote hotlink required for core content.
- Every bundled non-code asset has source/licence metadata.

## 6. Automated checks

`audit:licenses` checks:

- RepQuest licence retained;
- MIT notice retained when donor map is non-empty;
- Free Exercise DB notice retained;
- donor map rows complete;
- no unapproved media-source domain;
- package licences reported;
- missing/unknown licence flagged;
- generated third-party notice page current.

## 7. Source pin file

Task 00 creates a machine-readable file such as:

```json
{
  "repquest": {"repository": "...", "commit": "...", "license": "GPL-3.0-or-later"},
  "workoutCool": {"repository": "...", "commit": "...", "license": "MIT"},
  "freeExerciseDb": {"repository": "...", "commit": "...", "license": "Unlicense"}
}
```

Do not use floating branches in provenance records.
