## Context

The V0.2 roadmap upgrades Longgu from direct chapter generation to book, volume, and chapter planning. This change implements only the first planning slice: `longgu plan book`.

## Goals / Non-Goals

**Goals:**

- Add a stable location for planning artifacts under `outlines/`.
- Produce a machine-readable `book.draft.json` that users can inspect and edit.
- Keep draft generation deterministic and testable without provider credentials.
- Prevent accidental overwrite of user-edited draft files.

**Non-Goals:**

- No `plan volume` or `plan chapters` command yet.
- No LLM generation or prompt pack migration yet.
- No macro audit integration yet.
- No canonical confirm/publish flow yet; this change only creates a draft.

## Decisions

### Use JSON for the first book draft

`outlines/book.draft.json` is the first structured book specification artifact. JSON is easy to validate with zod, diff in git, and consume in later planning commands.

### Keep source extraction simple

The command reads `longgu.yaml` and all current `bible/*.md` files. It records those source files in the draft and fills unknown fields with empty strings or empty arrays, rather than inventing story facts.

### Refuse overwrite by default

`plan book` fails if `outlines/book.draft.json` already exists. `--force` allows regeneration when the user explicitly wants to replace the draft.

## File Contract

- Default output: `outlines/book.draft.json`.
- Output type: validated `BookPlanDraft`.
- Required source files: `longgu.yaml` plus readable `bible/*.md` context.
- CLI result: prints the output path and whether overwrite was forced.

## Risks / Trade-offs

- Deterministic scaffolding is less capable than an LLM-generated plan, but it creates the file contract first and avoids provider-dependent tests.
- JSON is less pleasant for long prose than Markdown, but later changes can add Markdown projections while keeping JSON as the structured source.
