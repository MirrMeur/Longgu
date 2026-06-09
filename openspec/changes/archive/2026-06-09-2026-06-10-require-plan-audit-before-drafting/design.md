# Design

## Gate Scope

The gate runs only when Longgu can find a chapter card for the target chapter. If no chapter card exists, legacy minimal drafting remains possible because early users may write from only bible files.

When a chapter card exists, Longgu derives the volume id from the source file `outlines/chapters-<volume>.draft.json` and expects:

`audits/chapters-<volume>.plan-audit.json`

The audit must have `status = "passed"` and `blocked = false`.

## Skip Flag

`--skip-plan-audit` bypasses the gate for `longgu write chapter`. The flag applies to provider generation, host prompt export, and host import because all three use the same preparation path.

The skip is explicit in CLI only. Core APIs receive `skipPlanAudit?: boolean` so tests and future automation can choose the behavior deliberately.

## Failure Messages

If no audit exists, the error points to:

`longgu audit chapter-plan --volume <id>`

If the audit is blocked or needs revision, the error points to the Markdown report and tells the user to fix the chapter plan or rerun the audit.
