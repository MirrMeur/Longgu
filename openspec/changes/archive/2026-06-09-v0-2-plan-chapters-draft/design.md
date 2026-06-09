## Context

The V0.2 roadmap requires book, volume, and chapter planning. Current implementation covers `longgu plan book` and `longgu plan volume --id <id>`. This change implements the final basic planning artifact for V0.2: a chapters draft created from a volume draft.

## Goals / Non-Goals

**Goals:**

- Add a stable file contract for chapter list planning.
- Read the user-editable volume draft as the upstream source.
- Produce a machine-readable `chapters-<volume>.draft.json`.
- Include the V0.2 acceptance fields per chapter: goal, conflict, payoff, information gain, and ending hook.
- Prevent accidental overwrite of user-edited chapter drafts.
- Keep the command deterministic and testable without provider credentials.

**Non-Goals:**

- No LLM generation or prompt rendering yet.
- No chapter-plan review integration yet.
- No confirm/publish mechanism for draft-to-canonical promotion yet.
- No automatic prose chapter generation from chapter cards yet.

## Decisions

### Use the volume draft as the required upstream artifact

`plan chapters` requires `outlines/volume-<id>.draft.json` so V0.2 planning remains an ordered workflow. Later changes can support canonical `volume-<id>.json` or Markdown projections; this slice uses the current draft artifact because it is the only structured volume plan available.

### Generate placeholder chapter cards deterministically

The command creates `chapterSeedCount` cards from the upstream volume draft and leaves author-facing fields editable. It should not invent major story facts. This preserves reviewability and keeps tests independent of model access.

### Use a separate chapters draft file

The command writes `outlines/chapters-<volume>.draft.json` instead of mutating the volume draft. This keeps each planning artifact independently reviewable and provides a stable input for later audit/review commands.

## File Contract

- Required input: `outlines/volume-<volume>.draft.json`.
- Default output: `outlines/chapters-<volume>.draft.json`.
- Output type: validated `ChaptersPlanDraft`.
- CLI result: prints the output path and whether overwrite was forced.

## Risks / Trade-offs

- Deterministic chapter cards are less complete than LLM-generated chapter lists, but they establish the schema, command, and overwrite behavior first.
- The generated card count depends on `chapterSeedCount`; invalid upstream data is rejected by the existing volume draft schema.
