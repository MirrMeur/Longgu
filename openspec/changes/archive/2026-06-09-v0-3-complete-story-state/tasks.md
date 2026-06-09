## 1. OpenSpec

- [x] 1.1 Create `v0-3-complete-story-state` proposal, design, tasks, and story-state spec delta.
- [x] 1.2 Validate the change before implementation.

## 2. Core State Implementation

- [x] 2.1 Add state delta schemas and loader.
- [x] 2.2 Add state inspection summary.
- [x] 2.3 Add model state-delta extraction prompt and parser.
- [x] 2.4 Add conflict detection for blocking state changes.
- [x] 2.5 Add id-based delta merge and ledger writes.
- [x] 2.6 Add settlement record writing with before, after, diff, delta, and metadata.

## 3. CLI

- [x] 3.1 Add `longgu state inspect`.
- [x] 3.2 Add `longgu settle chapter --id <id>` with optional `--delta <path>`.
- [x] 3.3 Surface schema and conflict errors clearly.

## 4. Tests And Docs

- [x] 4.1 Add core tests for inspect, merge, diff, and conflict rejection.
- [x] 4.2 Add CLI tests for inspect and settle.
- [x] 4.3 Update README current status and command list.
- [x] 4.4 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 4.5 Run `openspec validate v0-3-complete-story-state` and `openspec validate --all`.
- [x] 4.6 Archive the completed OpenSpec change.
