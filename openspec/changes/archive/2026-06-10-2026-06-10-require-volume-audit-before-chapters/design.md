# Design: Volume Audit Gate for Chapter Planning

## Gate Position

The gate belongs at the start of `createChaptersPlanDraft`, after the source volume draft is confirmed to exist and before overwrite checks or model calls. This prevents both deterministic and provider-backed chapter planning from writing chapter cards from a failed upstream plan.

## Audit Contract

The gate reads:

`audits/volume-<id>.plan-audit.json`

It validates the file with `VolumePlanAuditSchema` and requires:

- `status === "passed"`
- `blocked === false`

Missing audit files produce an actionable error:

`Run longgu audit volume-plan --id <id>, or pass --skip-volume-audit.`

Failed audit files produce an actionable error that points at the Markdown report and tells the user to fix the volume plan, rerun the audit, or explicitly skip.

## Bypass

`--skip-volume-audit` maps to `skipVolumeAudit` in core. The bypass exists for migration, experiments, and deliberate author override. It should be explicit in command history and not implied by `--force`.

## Non-Goals

- This change does not auto-run the audit.
- This change does not gate `plan volume`.
- This change does not replace chapter-plan readiness audit before drafting.
