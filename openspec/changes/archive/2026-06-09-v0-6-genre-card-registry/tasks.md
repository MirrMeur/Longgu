## 1. OpenSpec

- [x] 1.1 Create V0.6 proposal, design, tasks, and genre-cards spec.
- [x] 1.2 Validate the change before implementation.

## 2. Core Genre Card Implementation

- [x] 2.1 Add genre card schema and registry.
- [x] 2.2 Add alias-based genre resolution.
- [x] 2.3 Add prompt projection helper for audit/revision.
- [x] 2.4 Add eight V0.6 genre cards.

## 3. Integration

- [x] 3.1 Inject genre card into chapter audit prompt.
- [x] 3.2 Inject genre card into chapter revision prompt.
- [x] 3.3 Add `longgu genre list`.
- [x] 3.4 Add `longgu genre show <id>`.

## 4. Tests And Docs

- [x] 4.1 Add core tests for schema, aliases, fallback, and genre-specific weights.
- [x] 4.2 Add prompt integration tests proving different genres produce different prompt hints.
- [x] 4.3 Add CLI tests for `genre list` and `genre show`.
- [x] 4.4 Update README current status and command list.
- [x] 4.5 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 4.6 Run `openspec validate v0-6-genre-card-registry` and `openspec validate --all`.
- [x] 4.7 Archive the completed change.
