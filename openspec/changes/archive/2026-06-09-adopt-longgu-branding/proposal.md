## Why

The project now has a chosen product identity: 龙骨 Longgu. The existing V0.1 implementation still exposes generic `novel` naming, which weakens the brand and makes future package naming inconsistent.

## What Changes

- Adopt `龙骨 Longgu` as the project name.
- Use `longgu` as the CLI command name.
- Rename the V0.1 configuration file from `novel.yaml` to `longgu.yaml`.
- Rename the current npm package to `@longgu/cli`.
- Document future package names: `@longgu/core`, `@longgu/cli`, and `@longgu/genre-cards`.
- Update project instructions, OpenSpec project context, and planning docs to use the new brand where appropriate.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-cli-harness`: Update the V0.1 CLI and workspace configuration contract from generic `novel` naming to `longgu`/`longgu.yaml`.

## Impact

- Affects CLI help text, package metadata, starter workspace files, examples, tests, and active OpenSpec specs.
- Existing V0.1 workspaces using `novel.yaml` are not migrated in this change because the project has not yet shipped a stable release.
