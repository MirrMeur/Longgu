# Complete Audit And Revision Runs

## Why
Audit and revision already write structured artifacts, but the README correctly marks them partial because provider calls are not represented as first-class routed runs with cost metadata. This leaves cost reporting and route inspection incomplete for the write-audit-revise loop.

## What Changes
- Route chapter audit through the `audit` model route.
- Route chapter revision through the `revise` model route.
- Persist run records for model-backed audit and revision.
- Keep `--input` manual paths unchanged and provider-free.

## Impact
- Capability: `chapter-audit`, `chapter-revision`, `model-routing-cost`
- Cost reporting includes audit and revision provider calls.
