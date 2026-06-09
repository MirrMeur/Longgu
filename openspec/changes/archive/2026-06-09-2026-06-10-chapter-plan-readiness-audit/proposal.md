# 2026-06-10 Chapter Plan Readiness Audit

## Why

Longgu can draft chapter cards, but a weak chapter plan can still flow directly into context building and drafting. That is backwards for a production harness: the cheapest place to catch a bad chapter is before prose generation.

For male-channel webnovel production, each chapter card needs a concrete goal, opposing pressure, visible payoff, information gain, and tail hook. If the plan is vague or repetitive, the generated prose will usually become summary-like, low-pressure, or unretainable even if the later prose audit works.

## What Changes

- Add a deterministic `longgu audit chapter-plan --volume <id>` command.
- Read `outlines/chapters-<volume>.draft.json`.
- Validate chapter-card readiness with concrete checks:
  - chapter count mismatch
  - missing or placeholder goal/conflict/payoff/informationGain/endingHook
  - repeated adjacent goals, payoffs, or ending hooks
- Write `audits/chapters-<volume>.plan-audit.json`.
- Write `audits/chapters-<volume>.plan-audit.md`.
- Derive `status` and `blocked` from critical/warning issue severity.

## Impact

- Capability affected: `book-planning`.
- Code affected: chapter planning core module, CLI audit command, tests, OpenSpec.
- Data compatibility: chapter plan draft schema is unchanged.
