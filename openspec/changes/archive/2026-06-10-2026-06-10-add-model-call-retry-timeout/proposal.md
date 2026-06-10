## Why

Model-backed tasks currently only move from primary profile to fallback profile when generation fails. Temporary network errors, 5xx responses, rate limits, or hung requests fail a profile immediately, which makes long drafting and audit workflows fragile.

## What Changes

- Add per-call timeout handling around provider generation.
- Retry transient provider failures once with exponential backoff before switching profiles.
- Do not retry hard failures such as auth, missing API key, bad request, or invalid output.
- Preserve run attempt metadata so retries and fallback attempts remain inspectable.

## Impact

- Affected specs: `model-routing-cost`
- Affected code: `src/core/modelExecution.ts`, `src/adapters/openaiCompatible.ts`, run metadata tests
