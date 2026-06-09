## Why

V0.2 can create book, volume, and chapter planning drafts, but Longgu still has no explicit story state home. The next smallest V0.3 slice is a deterministic `state init` command that creates the baseline ledgers required for long-form consistency work before adding LLM extraction or delta merge behavior.

## What Changes

- Add `longgu state init` as the first V0.3 state command.
- Create a stable `state/` directory with six schema-validated JSON ledgers: `truth.json`, `characters.json`, `timeline.json`, `hooks.json`, `reader-promises.json`, and `resources.json`.
- Preserve user edits by refusing to overwrite existing state ledgers unless `--force` is passed.
- Extend workspace initialization and structure checks to include `state/`.
- Add tests for ledger schema validity, output paths, overwrite protection, `--force`, workspace shape, and CLI smoke behavior.

## Capabilities

### Added Capabilities

- `story-state`: Introduces the V0.3 state ledger foundation for future inspect, settle, delta, and merge commands.

### Modified Capabilities

- `minimal-cli-harness`: Extends initialized Longgu workspaces with a `state/` directory.

## Impact

- Adds a new core state module and CLI command group.
- Updates workspace initialization expectations and example workspace placeholders.
- Does not implement `state inspect`, `settle chapter`, LLM extraction, delta merge, or conflict detection yet.
