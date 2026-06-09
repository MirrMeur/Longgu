# Design

## Deterministic First

This change intentionally starts with deterministic checks instead of a model-backed reviewer. The goal is to catch structural readiness problems that do not require creative judgment:

- required fields are empty
- fields contain known placeholder language
- adjacent cards repeat the same function
- declared chapter count differs from actual cards

Model-backed chapter-plan review can be added later as a richer layer.

## Report Shape

The chapter plan audit report stores:

- `schemaVersion`: `longgu.chapter-plan-audit.v0.2`
- `volumeId`
- `status`: `passed`, `needs-revision`, or `blocked`
- `blocked`
- `summary`
- `issues`
- `sourceFiles`
- `generatedAt`

Issues contain `id`, `severity`, `chapterId`, `field`, `reason`, and `fix`.

## Gating

- Any critical issue makes the report `blocked`.
- Warning issues make the report `needs-revision`.
- No critical or warning issues pass.

Chapter count mismatch is critical. Missing or placeholder contract fields are warnings. Adjacent repetition is warning.
