## 1. Documentation Structure

- [x] 1.1 Choose the documentation location for the full Claude Code-first usage guide: `openspec/changes/add-claude-code-usage-docs/usage-guide.md`.
- [ ] 1.2 Add a README quick-start entry that points users to the full guide. Blocked: `README.md` is currently deleted in the working tree, so this change does not restore or overwrite it without explicit author approval.

## 2. User-Facing Guide

- [x] 2.1 Write the Chinese user-view usage section covering `longgu init`, opening the project in Claude Code, reading `当前步骤.md`, editing files, and invoking Longgu skills.
- [x] 2.2 Document that Longgu is Claude Code-first and does not require generic LLM provider configuration for the main path.
- [x] 2.3 Document the common next-step phrases users can say in Claude Code.

## 3. CLI Command List

- [x] 3.1 Document main path commands including `longgu init`, `longgu --version`, and build/link commands for local development.
- [x] 3.2 Document development and verification commands including `npm ci`, `npm run build`, `npm run dev:cli -- ...`, `npm run typecheck`, `npm test`, and `openspec validate --all`.
- [x] 3.3 Document provider-backed commands as advanced or legacy paths and note that they may require provider configuration.

## 4. Claude Code Skills Documentation

- [x] 4.1 Document the `.claude/skills/` tree for `longgu-start`, `longgu-plan`, `longgu-write`, `longgu-review`, `longgu-state`, and `longgu-help`.
- [x] 4.2 Document each skill's responsibility and provide at least one Chinese invocation phrase.

## 5. Initialized File Tree Example

- [x] 5.1 Add an initialized project tree example showing `.claude/skills/`, root files, and `01_立项设定/` through `08_AI审稿/`.
- [x] 5.2 Mark which files are author-editable novel assets and which files are Claude Code skill files.

## 6. Verification

- [x] 6.1 Verify the documentation contains all four requested sections: user usage, CLI commands, Claude Code skills tree, initialized file tree.
- [x] 6.2 Run OpenSpec validation for the change: `openspec validate add-claude-code-usage-docs --strict`.
