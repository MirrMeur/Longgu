# Project Overview

龙骨 Longgu is a Chinese webnovel creation engineering harness. It should organize the full production workflow from premise, book spec, volume planning, chapter planning, drafting, auditing, revising, state settlement, and retrospective evaluation into repeatable and verifiable steps.

## Brand

- Project name: 龙骨 Longgu.
- One-liner: 中文网文创作工程化 Harness.
- CLI: `longgu`.
- Package naming: `@longgu/core`, `@longgu/cli`, `@longgu/genre-cards`.
- Naming rationale: 龙骨 means skeleton, main beam, and support structure. It maps directly to the project's job: holding together long-form outline, foreshadowing, state ledgers, chapter rhythm, and prose audits.

## Goals

- Build a CLI-first, file-first Longgu production harness.
- Keep all intermediate artifacts readable, reviewable, and versionable.
- Support Chinese male-oriented webnovel workflows first.
- Keep model providers replaceable through OpenAI-compatible or local adapters.
- Treat generation as one step in a larger audit and revision loop.
- Maintain long-form consistency through explicit story state ledgers.

## Non-Goals

- Do not start with a large SaaS product.
- Do not start with a complex rich-text editor.
- Do not promise fully automated publish-ready novels.
- Do not support plagiarism-style author imitation.
- Do not hide quality work behind a single "remove AI flavor" button.

## Initial Technical Direction

- Language: TypeScript.
- Runtime: Node.js.
- CLI: commander or oclif.
- Validation: zod.
- Storage: Markdown, JSON, and later SQLite where justified.
- Tests: Vitest.
- LLM integration: provider adapters, starting with OpenAI-compatible APIs.

## Key References

- `docs/网文写作Harness工程整体规划.md`
- `code_analysis/AI写网文开源项目对比分析.md`

## OpenSpec Usage

Use OpenSpec for all meaningful product and engineering changes. New work should begin in `openspec/changes/<change-id>/` and only be implemented after the proposal, specs, design when needed, and tasks are clear enough to validate.
