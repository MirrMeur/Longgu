## 1. OpenSpec

- [x] 1.1 Create V0.4 proposal, design, tasks, and chapter-audit spec.
- [x] 1.2 Validate the change before implementation.

## 2. Core Audit Implementation

- [x] 2.1 Add chapter audit schema and raw input schema.
- [x] 2.2 Add severity normalization from `P0/P1/P2` to `critical/warning/info`.
- [x] 2.3 Add audit context loading from chapter, planning drafts, config, and state ledgers.
- [x] 2.4 Add provider prompt, parser, and one retry for schema-invalid audit output.
- [x] 2.5 Add audit status, blocked flag, and revise queue derivation.
- [x] 2.6 Add JSON and Markdown audit artifact writing.

## 3. CLI

- [x] 3.1 Add `longgu audit chapter --id <id>`.
- [x] 3.2 Add optional `--input <path>` deterministic audit input.
- [x] 3.3 Report audit path, status, critical count, warning count, and blocked flag.

## 4. Tests And Docs

- [x] 4.1 Add core tests for schema normalization, issue mapping, artifact writing, and retry.
- [x] 4.2 Add CLI tests for `audit chapter`.
- [x] 4.3 Update README current status and command list.
- [x] 4.4 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 4.5 Run `openspec validate v0-4-chapter-audit-system` and `openspec validate --all`.
- [x] 4.6 Archive the completed change.
