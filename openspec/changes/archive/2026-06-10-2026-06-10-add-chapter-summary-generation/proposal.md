# Add chapter summary generation

## Why

GitHub issue #11 reports that context packs consume `summaries/*.summary.json`, but Longgu has no command or core function that produces those files. Summary context is therefore dead code unless users create summary files manually.

## What Changes

- Add provider-backed chapter summary generation.
- Add `longgu summarize chapter --id <id>`.
- Write `summaries/<id>.summary.json` using the existing summary schema consumed by context packs.
- Record model run evidence for summary generation.

## Impact

- Adds a new model task route: `summarize`.
- Adds a new CLI command group: `summarize`.
- Does not change context pack schema.
- Fixes GitHub issue #11.
