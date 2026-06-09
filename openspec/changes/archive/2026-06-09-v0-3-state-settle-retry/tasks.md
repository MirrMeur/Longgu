## 1. OpenSpec

- [x] 1.1 Create proposal, design, tasks, and spec delta.
- [x] 1.2 Validate the change before implementation.

## 2. Implementation

- [x] 2.1 Add retryable model extraction loop.
- [x] 2.2 Re-run conflict checks before retry and before merge.
- [x] 2.3 Persist `model-attempts.json` for successful model settlements.
- [x] 2.4 Keep file-provided deltas fail-fast.

## 3. Tests And Validation

- [x] 3.1 Add tests for retry success after invalid model output.
- [x] 3.2 Add tests for retry failure without ledger mutation.
- [x] 3.3 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 3.4 Run `openspec validate v0-3-state-settle-retry` and `openspec validate --all`.
- [x] 3.5 Archive the completed change.
