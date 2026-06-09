## Context

The V0.2 roadmap requires book, volume, and chapter planning. The current implementation covers only `longgu plan book`, producing `outlines/book.draft.json`. This change implements the next planning artifact: a volume draft created from the book draft.

## Goals / Non-Goals

**Goals:**

- Add a stable file contract for volume planning.
- Read the user-editable book draft as the upstream source.
- Produce a machine-readable `volume-<id>.draft.json`.
- Prevent accidental overwrite of user-edited volume drafts.
- Keep the command deterministic and testable without provider credentials.

**Non-Goals:**

- No `plan chapters` command yet.
- No LLM generation or prompt rendering yet.
- No chapter-plan review integration yet.
- No confirm/publish mechanism for draft-to-canonical promotion yet.

## Decisions

### Use the book draft as the required upstream artifact

`plan volume` requires `outlines/book.draft.json` so V0.2 planning becomes an ordered workflow. Later changes can support canonical `book.json` or Markdown projections; this slice uses the current draft artifact because it is the only structured book plan available.

### Keep generation deterministic

The command derives known fields from the book draft and leaves author-facing planning fields editable. It should not invent major story facts. This preserves reviewability and avoids provider-dependent tests.

### Use ID-normalized output paths

The command writes `outlines/volume-<id>.draft.json` where `<id>` is validated as a non-empty ID segment. This keeps the path predictable for later `plan chapters --volume <id>`.

## File Contract

- Required input: `outlines/book.draft.json`.
- Default output: `outlines/volume-<id>.draft.json`.
- Output type: validated `VolumePlanDraft`.
- CLI result: prints the output path and whether overwrite was forced.

## Risks / Trade-offs

- A deterministic volume draft is less complete than an LLM-generated volume outline, but it establishes the schema and file contract first.
- Requiring `book.draft.json` means users must run `plan book` before `plan volume`; this is acceptable for V0.2 because the roadmap expects book planning before volume planning.
