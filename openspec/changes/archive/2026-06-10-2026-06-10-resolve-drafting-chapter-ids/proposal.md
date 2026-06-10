# Resolve drafting chapter ids

## Why

GitHub issue #14 reports that planned chapter ids include the volume prefix, such as `001-001`, while `longgu write chapter --id 001` accepts arbitrary strings. When the user passes the short id, drafting silently misses the chapter card and skips the plan-audit gate because no matching card is found.

## What Changes

- Resolve drafting chapter references before building context or prompts.
- Treat an exact planned id as canonical.
- Treat a short id as an alias only when it uniquely matches one planned chapter suffix.
- Reject ambiguous short ids.
- Require `--skip-plan-audit` for truly unplanned drafting, instead of silently continuing without a chapter card.

## Impact

- Affects provider drafting, host prompt export, and host draft import.
- May change artifact paths when a short id resolves to a planned id; e.g. `--id 001` with a unique `001-001` plan writes `chapters/001-001.md`.
- Fixes GitHub issue #14.
