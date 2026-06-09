# Proposal: Volume Plan Readiness Audit

## Why

Longgu now blocks drafting on weak chapter plans, but chapter plans are seeded from volume plans. If a volume plan only says "become stronger" or has generic escalation, the chapter cards can satisfy field presence while still lacking the commercial pressure ladder that keeps male-channel readers turning pages.

External writing guidance and long-form generation research point to the same failure mode: pacing collapses when important events are underdeveloped, minor setup expands, or payoff rhythm lacks visible movement. Longgu needs a deterministic upstream audit that catches weak volume promises before they are split into chapters.

## What Changes

- Add a deterministic `longgu audit volume-plan --id <id>` command.
- Validate `outlines/volume-<id>.draft.json` for:
  - concrete volume promise and antagonist pressure,
  - at least three conflict escalation steps,
  - concrete pressure and payoff in each step,
  - at least one key payoff,
  - a concrete ending hook,
  - a positive chapter seed count.
- Persist JSON and Markdown audit reports under `audits/`.
- Keep this change audit-only; chapter planning gates can be added in a later change.

## Impact

- Adds a new volume-plan audit schema in the book planning module.
- Adds CLI output for volume-plan readiness.
- Adds focused tests for ready, warning, blocking, and missing-plan cases.
