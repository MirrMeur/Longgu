## 1. OpenSpec

- [x] 1.1 Create V0.5 proposal, design, tasks, and chapter-revision spec.
- [x] 1.2 Validate the change before implementation.

## 2. Core Revision Implementation

- [x] 2.1 Add revision mode schema and metadata schema.
- [x] 2.2 Load chapter, audit, selected issues, and state constraints.
- [x] 2.3 Add mode selection and provider revision prompt.
- [x] 2.4 Add markdown diff generation.
- [x] 2.5 Add revision record writing and chapter replacement.
- [x] 2.6 Add optional post-audit critical-count comparison.

## 3. CLI

- [x] 3.1 Add `longgu revise chapter --id <id>`.
- [x] 3.2 Add `--mode`, `--input`, and `--post-audit` options.
- [x] 3.3 Report revision directory, mode, selected issue count, and diff path.

## 4. Tests And Docs

- [x] 4.1 Add core tests for default mode selection, diff, revision record, and post-audit failure.
- [x] 4.2 Add CLI tests for deterministic revised input.
- [x] 4.3 Update README current status and command list.
- [x] 4.4 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 4.5 Run `openspec validate v0-5-chapter-revision-loop` and `openspec validate --all`.
- [x] 4.6 Archive the completed change.
