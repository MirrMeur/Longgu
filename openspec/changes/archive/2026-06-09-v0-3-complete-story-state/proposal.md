# Complete V0.3 Story State

## Why

The archived V0.3 slice created baseline story state ledgers, but the roadmap's remaining V0.3 behavior is still missing: inspecting state, settling chapter changes, applying deltas instead of rewriting whole ledgers, recording diffs, and rejecting unsafe state updates.

Longgu needs these behaviors before chapter audit and revision can depend on explicit story state.

## What Changes

- Add `longgu state inspect` to summarize all story state ledgers.
- Add `longgu settle chapter --id <id>` to extract and apply a schema-validated state delta for a chapter.
- Allow `--delta <path>` as a deterministic manual/external-tool input for review, tests, and offline workflows.
- Define a V0.3 state delta schema for facts, characters, timeline events, hooks, reader promises, and resources.
- Merge deltas into ledgers by item id instead of replacing entire ledger files.
- Write a settlement record with input delta, before/after snapshots, per-ledger diff summary, and conflict diagnostics.
- Reject invalid deltas and deltas with blocking conflicts before mutating state.

## Impact

- Capability: `story-state`
- CLI: adds `state inspect` and `settle chapter`
- Filesystem artifacts: adds `state/deltas/` and `state/settlements/`
- Core logic: extends state schemas with delta validation, merge, diff, and conflict detection
- LLM extraction is in scope only as a producer of the same state delta schema; merge safety stays deterministic and schema-first.
