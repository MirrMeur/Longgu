## Why

V0.2 now has `longgu plan book`, but the planning workflow still cannot move from a book-level specification into a reviewable volume plan. The next smallest useful slice is a deterministic `plan volume` command that reads the existing book draft and creates a structured, editable volume draft without overwriting user edits.

## What Changes

- Add `longgu plan volume --id <id>` as the next V0.2 planning command.
- Define a structured volume draft schema with volume goal, antagonist pressure, resource changes, key payoffs, ending hook, chapter seed count, and source files.
- Write drafts to `outlines/volume-<id>.draft.json`.
- Preserve user edits by refusing to overwrite an existing volume draft unless `--force` is passed.
- Require `outlines/book.draft.json` as the source book planning artifact for this slice.
- Add tests for schema validity, output path, source linkage, missing book draft handling, and overwrite protection.

## Capabilities

### Modified Capabilities

- `book-planning`: Extends V0.2 planning from book drafts to volume drafts.

## Impact

- Adds a new core planning function and CLI subcommand.
- Keeps planning deterministic and provider-independent.
- Does not implement chapter splitting, macro review, chapter-plan review, or LLM prompt packs yet.
