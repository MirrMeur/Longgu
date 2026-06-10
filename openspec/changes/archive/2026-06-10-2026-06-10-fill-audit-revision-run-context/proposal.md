# Fill audit and revision run context

## Why

GitHub issue #19 reports that provider-backed chapter audit and revision create run records whose `context.json` entries have empty `content` fields. That makes the run evidence weak: reviewers can see file names but cannot inspect the actual chapter or state inputs used for the model call.

## What Changes

- Include real audit context source content in provider-backed audit run records.
- Include the original chapter body in provider-backed revision run records.
- Add regression tests that inspect `runs/<id>/context.json`.

## Impact

- Affects model run evidence for audit and revision only.
- No CLI flags or schema versions change.
- Fixes GitHub issue #19.
