## 1. OpenSpec

- [x] 1.1 Create V0.7 proposal, design, tasks, and context-builder spec.
- [x] 1.2 Validate the change before implementation.

## 2. Core Context Implementation

- [x] 2.1 Add context pack and chapter summary schemas.
- [x] 2.2 Load chapter card, volume plan, summaries, state ledgers, genre card, and style constraints.
- [x] 2.3 Add deterministic relevance scoring and priorities.
- [x] 2.4 Add token budget trimming with critical section protection.
- [x] 2.5 Write JSON and Markdown context artifacts.

## 3. CLI

- [x] 3.1 Add `longgu context build --chapter <id>`.
- [x] 3.2 Add `--max-tokens`.
- [x] 3.3 Report output paths, included section count, and estimated tokens.

## 4. Tests And Docs

- [x] 4.1 Add core tests for source loading, budget trimming, and critical protection.
- [x] 4.2 Add CLI tests for context build.
- [x] 4.3 Update README current status and command list.
- [x] 4.4 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 4.5 Run `openspec validate v0-7-context-builder` and `openspec validate --all`.
- [x] 4.6 Archive the completed change.
