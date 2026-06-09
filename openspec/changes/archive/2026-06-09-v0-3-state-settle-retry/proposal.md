# Add State Settlement Model Retry

## Why

The V0.3 roadmap requires invalid state updates to be rejected and for model-generated settlement to ask the model to output again. Current state settlement rejects invalid or conflicting deltas, but the model path does not retry before failing.

## What Changes

- Add one model retry for `longgu settle chapter --id <id>` when provider extraction returns invalid JSON, schema-invalid delta, chapter mismatch, duplicate ids, or blocking state conflicts.
- Include the validation/conflict error in the retry prompt.
- Keep `--delta <path>` deterministic: provided delta files still fail immediately and do not retry.
- Persist model attempts in successful settlement records.

## Impact

- Capability: `story-state`
- Core logic: settlement extraction loop for model source
- CLI behavior: no new flags
- Tests: add core coverage for retry success and retry failure without state mutation
