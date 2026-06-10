# Proposal: Require Volume Audit Before Chapter Planning

## Why

Longgu can now audit volume plans, but `longgu plan chapters` still accepts any syntactically valid volume draft. That leaves a gap: a weak volume promise can be split into chapter cards before the author has fixed the upstream pressure ladder.

For male-channel webnovels, weak volume planning is not a cosmetic issue. If the volume has no concrete promise, antagonist pressure, visible payoff rhythm, or ending hook, the generated chapter list tends to produce filler chapters, repeated payoffs, and vague cliffhangers. Detailed-outline story generation research also treats outline control as a prerequisite for more coherent long-form output, so the harness should enforce that discipline before decomposition.

## What Changes

- Make `longgu plan chapters --volume <id>` require a passed `audits/volume-<id>.plan-audit.json` by default.
- Add `--skip-volume-audit` for explicit manual bypasses.
- Apply the same gate to deterministic and model-backed chapter planning.
- Keep missing or failed audits as hard errors before any chapter draft is written.

## Impact

- Adds a chapter planning gate in `createChaptersPlanDraft`.
- Adds CLI option wiring and user-facing error messages.
- Updates book-planning specs and tests.
