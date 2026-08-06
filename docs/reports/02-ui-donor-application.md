# CP2 UI donor application

Date: 2026-08-06

## Decision

CP2 uses only donor classifications A and B: navigation density, card hierarchy,
empty-state hierarchy and responsive information architecture were independently
implemented with Material UI and max&gym tokens.

No Workout.cool source file, function, asset, Tailwind class, shadcn/Radix primitive,
server dependency or utility was copied or substantially adapted. Consequently,
THIRD_PARTY_CODE_MAP.md remains unchanged and no licence notice is required.

## Result

- Material UI remains the only production UI framework.
- The five primary destinations use max&gym information architecture rather than a
  donor clone.
- Deferred donor-derived concepts (program builders, set rows, filters and charts)
  remain owned by their later tasks.
