# Design: Volume Plan Readiness Audit

## Scope

This change adds deterministic structural checks only. It does not attempt full creative judgment or genre-specific LLM review. The goal is to catch volume plans that are not ready to become chapter cards because they lack a concrete promise, pressure ladder, payoff rhythm, or next-volume hook.

## Audit Model

The volume plan audit report stores:

- `schemaVersion`: `longgu.volume-plan-audit.v0.2`
- `volumeId`
- `status`: `passed`, `needs-revision`, or `blocked`
- `blocked`: true when critical issues exist
- `summary`
- `issues`
- `sourceFiles`
- `generatedAt`

Issues include:

- `id`
- `severity`: `critical`, `warning`, or `info`
- `field`
- optional `step`
- `reason`
- `fix`

## Deterministic Checks

Critical:

- missing source volume draft,
- `chapterSeedCount` is not positive,
- fewer than three conflict escalation steps.

Warning:

- placeholder-like or overly generic `volumeGoal`,
- placeholder-like or overly generic `primaryAntagonist`,
- weak escalation `step`, `pressure`, or `expectedPayoff`,
- repeated adjacent escalation pressure or payoff,
- no `keyPayoffs`,
- weak `endingHook`.

The wording is intentionally oriented toward readable next actions instead of hidden scoring.

## Later Work

A later change can make `longgu plan chapters` require a passed volume-plan audit unless explicitly skipped, mirroring the existing chapter-plan gate before drafting.
