# Design

## Compare Item Fields

Each experiment compare item may include audit-derived contract metadata:

- `auditContractStatus`: `complete` or `incomplete`.
- `auditContractMissingCount`: number of missing contract fields.
- `auditContractDiagnosis`: the audit diagnosis sentence.

These are optional because manual variants may not have linked audit files.

## Contract Sort

`--sort contract` ranks variants by:

1. Complete contract before incomplete or missing audit contract.
2. Fewer missing contract fields before more missing fields.
3. Higher audit retention score.
4. Higher human hook score.
5. Higher human payoff score.
6. Variant id as deterministic final tie-breaker.

Missing contract evidence is treated as incomplete with an infinite missing count for sorting purposes. This makes the report prefer audited complete variants without making unaudited variants invalid.

## Markdown Projection

The compare Markdown table adds `Contract` and `Missing` columns. This keeps the report usable in code review and author review without opening the JSON.
