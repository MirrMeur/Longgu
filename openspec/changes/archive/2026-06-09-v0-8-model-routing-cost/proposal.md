# Proposal

## Why

Longgu currently uses a single `provider` config for every model call. As the harness gains planning, drafting, audit, revision, settlement, and context workflows, a single model choice is too coarse: high-value chapters may need stronger models, routine tasks should be cheaper, and failed calls need an explicit fallback path. Run records also do not yet expose token or cost estimates, so users cannot see where long-form production money is spent.

## What Changes

- Add model profile and task route configuration while keeping the existing `provider` config backward compatible.
- Add a deterministic model router for task types such as `drafting`, `planning`, `audit`, `revise`, and `settle`.
- Add fallback support for routed model calls.
- Add cost estimation from prompt/output token estimates and configured per-1K-token prices.
- Add `longgu model list` and `longgu cost report`.
- Extend run metadata with task, selected model profile, fallback attempt count, token estimates, estimated cost, and duration.

## Impact

- Affects config schema, provider request shape, chapter generation, run metadata, CLI output, and tests.
- Existing single-provider workspaces remain valid and map to a default model profile.
- Cost values are estimates, not provider billing truth.
