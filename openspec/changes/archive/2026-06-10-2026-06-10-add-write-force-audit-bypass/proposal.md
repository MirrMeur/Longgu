## Why

`longgu write chapter` already supports `--skip-plan-audit`, but users hitting a blocked or missing chapter-plan audit need a more obvious prototype-stage escape hatch. The failure message should point to a short command option that clearly means "proceed anyway".

## What Changes

- Add `--force` to `longgu write chapter` as an alias for bypassing the chapter-plan audit gate.
- Pass the force bypass through provider drafting, host prompt export, and host draft import.
- Update gate error messages to mention `--force`.
- Add CLI coverage for the force bypass.

## Impact

- Affected specs: `minimal-cli-harness`, `book-planning`
- Affected code: `src/cli/index.ts`, `src/core/generation.ts`, CLI tests
