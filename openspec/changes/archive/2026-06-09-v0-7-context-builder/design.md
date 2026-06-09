# Design

## CLI Shape

```text
longgu context build --chapter 001 [dir]
longgu context build --chapter 001 --max-tokens 4000 [dir]
```

`--max-tokens` defaults to `4000`. Token count is estimated by character length divided by 2 for Chinese-heavy text.

## Context Pack

`context/<chapter-id>.context.json` uses `schemaVersion: longgu.context-pack.v0.7`.

Each section has:

- `id`
- `source`
- `reason`
- `priority`: `critical`, `high`, `medium`, or `low`
- `estimatedTokens`
- `included`
- `content`

`context.md` is a readable projection of included sections.

## Sources

The builder attempts to load:

- matching chapter card from `outlines/chapters-*.draft.json`
- matching volume plan from `outlines/volume-*.draft.json`
- chapter summaries from `summaries/*.summary.json`
- state ledgers from `state/*.json`
- genre card prompt projection
- `bible/style.md`

Missing optional sources are skipped.

## Relevance And Budget

Relevance score is deterministic:

- critical state ledgers and current chapter card are protected.
- exact chapter id and volume id matches score highest.
- genre card and style constraints are high priority.
- summaries are sorted by recency and capped by budget.

If estimated tokens exceed budget, low then medium sections are excluded until the pack fits. Critical sections are never excluded.
