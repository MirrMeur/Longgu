# 2026-06-10 Require Plan Audit Before Drafting

## Why

Longgu now has a deterministic chapter-plan readiness audit, but the drafting entry points can still bypass it. A production harness should not let weak chapter cards enter prose generation by accident. For male-channel webnovel work, this is where many failures begin: if the chapter card does not have concrete pressure, payoff, information gain, and tail hook, the draft usually becomes bland even if later prose audit catches symptoms.

## What Changes

- Require a passed chapter-plan audit before drafting when a chapter card exists.
- Apply the gate to:
  - provider-backed `longgu write chapter`
  - host prompt export `longgu write chapter --host-prompt`
  - host draft import `longgu write chapter --input`
- Add explicit `--skip-plan-audit` escape hatch for manual emergency drafting.
- Tell users to run `longgu audit chapter-plan --volume <id>` when the gate blocks drafting.

## Impact

- Capabilities affected: `minimal-cli-harness`, `book-planning`.
- Code affected: generation preparation, CLI write command, tests, OpenSpec.
- Data compatibility: no schema changes.
