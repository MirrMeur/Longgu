## Why

V0.1 can initialize a workspace and generate a chapter from loose `bible/` inputs, but V0.2 needs the workflow to start moving toward structured planning. The smallest useful next slice is a deterministic `plan book` command that turns the existing workspace inputs into a reviewable book specification draft without overwriting user-authored canonical files.

## What Changes

- Add `longgu plan book` as the first V0.2 planning command.
- Create `outlines/` during workspace initialization and require it for the planning workspace shape.
- Define a structured book specification draft schema with genre, premise, protagonist engine, core hook, conflict ladder, power system, reader promises, risks, and source files.
- Write drafts to `outlines/book.draft.json` by default.
- Preserve user edits by refusing to overwrite an existing draft unless `--force` is passed.
- Add tests for draft generation, overwrite protection, schema validity, and workspace initialization.

## Capabilities

### New Capabilities

- `book-planning`: Covers V0.2 book specification draft generation and reviewable planning artifacts.

### Modified Capabilities

- `minimal-cli-harness`: Workspace initialization and shape checks include `outlines/` so V0.2 planning artifacts have a stable home.

## Impact

- Adds a new core planning module and CLI subcommand.
- Adds `outlines/` to initialized and example workspaces.
- Does not call an LLM yet; this slice produces a deterministic editable draft from current inputs.
- Keeps generated planning artifacts file-first and reviewable.
