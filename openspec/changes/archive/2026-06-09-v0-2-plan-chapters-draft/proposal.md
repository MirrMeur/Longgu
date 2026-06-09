## Why

V0.2 planning now supports book and volume drafts, but it still cannot split a volume into a reviewable chapter list. The next smallest useful slice is a deterministic `plan chapters` command that reads the existing volume draft and creates structured chapter card drafts without overwriting user edits.

## What Changes

- Add `longgu plan chapters --volume <id>` as the next V0.2 planning command.
- Define a structured chapters draft schema with per-chapter goal, conflict, payoff, information gain, ending hook, and source linkage.
- Write drafts to `outlines/chapters-<volume>.draft.json`.
- Preserve user edits by refusing to overwrite an existing chapters draft unless `--force` is passed.
- Require `outlines/volume-<volume>.draft.json` as the source volume planning artifact for this slice.
- Add tests for schema validity, output path, source linkage, missing volume draft handling, overwrite protection, and unsafe volume ids.

## Capabilities

### Modified Capabilities

- `book-planning`: Extends V0.2 planning from volume drafts to chapter list drafts.

## Impact

- Adds a new core planning function and CLI subcommand.
- Keeps planning deterministic and provider-independent.
- Does not implement chapter-plan review prompts, LLM generation, or draft promotion yet.
