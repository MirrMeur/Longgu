# Restore Complete Spec Scenarios

## Why
The archived completion changes correctly updated behavior, but the `MODIFIED` requirement text replaced some older scenarios in the merged specs. The implementation still preserves those behaviors, so the specs should explicitly retain both the historical acceptance scenarios and the new completion scenarios.

## What Changes
- Restore deterministic planning, overwrite, and upstream-missing scenarios while keeping model-backed planning scenarios.
- Restore provider/manual/missing scenarios for audit and revision while keeping run-evidence scenarios.
- Restore drafting and important-route scenarios while keeping all-task routing and cost scenarios.

## Impact
- Specs only: `book-planning`, `chapter-audit`, `chapter-revision`, `model-routing-cost`.
- No implementation changes.
