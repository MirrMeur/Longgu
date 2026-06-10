# Allow non-critical unchanged revisions

## Why

GitHub issue #18 reports that `reviseChapter` treats identical provider output as a hard failure. That is too strict for non-critical revision flows: a model may reasonably decide no changes are needed, or return the same text during spot-fix/polish attempts.

## What Changes

- Allow unchanged provider output when the selected revision issues are not critical.
- Continue rejecting unchanged output when critical issues are selected, so blocking problems are not silently ignored.
- Preserve revision history for allowed unchanged revisions.

## Impact

- Changes chapter revision behavior for non-critical no-op outputs.
- Does not change CLI flags or revision artifact schema.
- Fixes GitHub issue #18.
