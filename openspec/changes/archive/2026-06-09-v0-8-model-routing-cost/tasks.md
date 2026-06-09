## 1. OpenSpec

- [x] 1.1 Create V0.8 proposal, design, tasks, and model-routing-cost spec.
- [x] 1.2 Validate the change before implementation.

## 2. Core Model Routing And Cost

- [x] 2.1 Extend config schema with `models`, `routes`, and per-1K cost fields while preserving legacy `provider`.
- [x] 2.2 Add model router for task routes, important-model upgrade, and fallback profile resolution.
- [x] 2.3 Add token and estimated cost helpers.
- [x] 2.4 Extend run metadata and run finish records with task, model profile, fallback attempts, token estimates, estimated cost, and duration.
- [x] 2.5 Add cost report aggregation over existing run metadata.

## 3. Generation And CLI

- [x] 3.1 Route `longgu write chapter` through the drafting route.
- [x] 3.2 Add fallback execution when the primary generation model fails.
- [x] 3.3 Add `--important` for chapter generation.
- [x] 3.4 Add `longgu model list`.
- [x] 3.5 Add `longgu cost report`.

## 4. Tests And Docs

- [x] 4.1 Add config/router/cost tests.
- [x] 4.2 Add generation fallback and run metadata tests.
- [x] 4.3 Add CLI tests for model listing and cost report.
- [x] 4.4 Update README current status and command list.
- [x] 4.5 Run `npm run typecheck`, `npm run build`, and `npm test`.
- [x] 4.6 Run `openspec validate v0-8-model-routing-cost` and `openspec validate --all`.
- [x] 4.7 Archive the completed change.
