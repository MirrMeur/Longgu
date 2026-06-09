# 2026-06-10 Experiment Contract Ranking

## Why

Longgu experiments compare candidate openings and chapter variants by human payoff/hook scores, AI flavor, setting conflict, and cost. After the chapter audit gained a structured chapter contract, experiment comparison should use that evidence directly.

For male-channel webnovel production, a variant with a complete page-turning contract is usually a better candidate than one that only has isolated prose polish. The comparison report should expose whether each variant has a complete start hook, protagonist goal, obstacle, turn, payoff, and tail hook, and it should support sorting by that signal.

## What Changes

- Add `contract` as an experiment comparison sort key.
- Include audit-derived contract fields in each compare item:
  - `auditContractStatus`
  - `auditContractMissingCount`
  - `auditContractDiagnosis`
- Sort `--sort contract` so complete contracts rank before incomplete contracts, then by fewer missing fields, then by retention/hook/payoff tie-breakers.
- Render contract status and missing count in `compare.md`.

## Impact

- Capability affected: `experiments`.
- Code affected: experiment comparison schema, sort logic, Markdown report, CLI sort parsing, tests.
- Data compatibility: existing experiment variants without audit files still compare; they sort after variants with complete contract evidence when sorting by `contract`.
