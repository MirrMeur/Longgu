# Score context trimming within priorities

## Why

GitHub issue #13 reports that context trimming removes the largest same-priority section first. Size alone is a poor proxy for value: a large recent chapter body may be more useful than a tiny old summary.

## What Changes

- Keep the existing priority order: low before medium before high, and critical protected.
- Add a same-priority retention score so lower-value sections are trimmed before higher-value sections.
- Use size only as a tie-breaker after retention score.
- Add regression coverage that preserves a recent previous chapter over a lower-value small summary.

## Impact

- Affects context pack inclusion decisions under tight token budgets.
- No schema or CLI changes.
- Fixes GitHub issue #13.
