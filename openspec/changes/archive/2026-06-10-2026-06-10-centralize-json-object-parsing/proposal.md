## Why

Provider-backed flows parse model responses that should contain a JSON object. The current code repeats the same fenced-JSON and first/last-brace extraction logic across planning, audit, state settlement, and summary generation, so compatibility fixes must be made in multiple places.

## What Changes

- Add one shared JSON object parsing helper for provider responses.
- Replace duplicated local extraction helpers in planning, audit, story state, and summary generation.
- Add focused tests for fenced JSON, wrapped JSON, and missing-object errors.

## Impact

- Affected specs: `stable-harness`
- Affected code: `src/core/bookPlan.ts`, `src/core/audit.ts`, `src/core/state.ts`, `src/core/summary.ts`, shared parser tests
