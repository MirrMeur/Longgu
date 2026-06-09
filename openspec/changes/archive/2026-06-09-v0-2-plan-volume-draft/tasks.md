## 1. OpenSpec

- [x] 1.1 Create `v0-2-plan-volume-draft` change.
- [x] 1.2 Write proposal, capability spec, design, and tasks.

## 2. Volume Planning Implementation

- [x] 2.1 Add `VolumePlanDraft` schema and deterministic draft creation from `outlines/book.draft.json`.
- [x] 2.2 Add `longgu plan volume --id <id>` CLI with overwrite protection and `--force`.

## 3. Tests

- [x] 3.1 Add unit tests for volume draft schema, output shape, missing book draft, and overwrite behavior.
- [x] 3.2 Add CLI smoke coverage for `plan volume`.

## 4. Validation

- [x] 4.1 Run `openspec validate v0-2-plan-volume-draft`.
- [x] 4.2 Run typecheck, tests, build, CLI smoke, and diff checks.
- [x] 4.3 Archive `v0-2-plan-volume-draft`.
