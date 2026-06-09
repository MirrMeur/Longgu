# Add V0.7 Context Builder

## Why

Longgu can plan, write, settle state, audit, revise, and apply genre cards, but chapter generation still reads broad bible files directly. V0.7 needs an explicit context package that explains which sources were selected, why they matter, and how token budget degradation works.

## What Changes

- Add `longgu context build --chapter <id>`.
- Build `context/<chapter-id>.context.json` and `context/<chapter-id>.context.md`.
- Include current chapter card, volume plan, recent chapter summaries, state ledgers, genre card rules, and style constraints when available.
- Add deterministic relevance scoring and token budget trimming.
- Ensure critical state sections are protected from trimming.
- Add a chapter summary schema so future runs can feed context building.

## Impact

- Capability: `context-builder`
- CLI: new `context build` command
- Filesystem artifacts: `context/`
- Core logic: context source loading, scoring, token budget manager, context pack schema
- Out of scope: SQLite FTS and embeddings; V0.7 uses deterministic local scoring so the interface is stable before adding storage engines.
