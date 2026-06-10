# Summarize state context

## Why

GitHub issue #10 reports that every state ledger is marked `critical` in context packs. Full JSON ledgers therefore remain included even under very small token budgets, which does not scale for long novels.

## What Changes

- Emit compact critical summaries for state ledgers.
- Emit full state ledger JSON as high-priority context that can be trimmed under tight budgets.
- Preserve active hooks/promises and recent timeline signals in compact summaries.
- Add regression coverage proving full ledgers can be trimmed while summaries remain.

## Impact

- Affects context pack state sections and trimming behavior.
- Does not change state ledger files or schemas.
- Fixes GitHub issue #10.
