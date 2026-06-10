## Why

Single-chapter audits can miss continuity failures that only appear across settled chapter state: character role drift, repeated scene beats, timeline order problems, and "first meeting" wording after a related event already happened.

## What Changes

- Extend `longgu state check` with deterministic cross-chapter drift checks over state ledgers.
- Detect conflicting role terms associated with the same character.
- Detect timeline chapter order regressions.
- Detect highly similar timeline event summaries across different chapters.
- Detect later "first-time" timeline events that resemble earlier events.

## Impact

- Affected specs: `story-state`
- Affected code: `src/core/state.ts`, state tests
