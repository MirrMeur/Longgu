## 1. OpenSpec

- [x] 1.1 Create `v0-3-state-init-ledgers` change.
- [x] 1.2 Write proposal, capability spec, and tasks.

## 2. State Ledger Implementation

- [x] 2.1 Add state ledger schemas and deterministic baseline initialization.
- [x] 2.2 Add `longgu state init` CLI with overwrite protection and `--force`.
- [x] 2.3 Add `state/` to workspace initialization, shape checks, and example workspace.

## 3. Tests

- [x] 3.1 Add unit tests for state ledger schema, output shape, overwrite behavior, and force regeneration.
- [x] 3.2 Add CLI smoke coverage for `state init`.

## 4. Validation

- [x] 4.1 Run `openspec validate v0-3-state-init-ledgers`.
- [x] 4.2 Run typecheck, tests, build, CLI smoke, and diff checks.
- [x] 4.3 Archive `v0-3-state-init-ledgers`.
