## Context

The current `writeChapter` path loads only `bible/*.md` via `loadBibleContext`. A separate `buildChapterContext` path already gathers chapter cards, volume plans, state ledgers, genre hints, style constraints, and summaries, but drafting does not use it.

Issue #2 is a continuity failure caused by the drafting prompt lacking nearby chapter history.

## Decision

Use the context-pack pipeline as the drafting input source:

- `writeChapter` calls `buildChapterContext({ workspaceDir, chapterId })` before prompt rendering.
- The prompt context becomes included context-pack sections projected to `{ file, content }`.
- Run metadata `inputFiles` continues to be derived from the prompt context so users can audit which sources were used.
- `context/<chapter-id>.context.json` and `.md` become normal side effects of `write chapter`, matching the file-first harness model.

## Previous Chapter Content

Summaries are useful but may not exist before state/audit settlement. To support immediate consecutive drafting, context building should also consider existing `chapters/*.md` files other than the target chapter:

- Select recent chapter files by chapter id ordering before the target when possible.
- Keep them low priority so budget trimming can remove them before critical state and current chapter card sections.
- Limit the number of chapter-body sections to avoid runaway prompts.

## Tradeoffs

- This does not guarantee perfect continuity; it makes the relevant context available to the model and keeps it reviewable.
- `write chapter` now writes context artifacts in addition to chapter and run artifacts. This is acceptable because all generation inputs should be traceable.
- The context builder remains the single source of context selection behavior instead of adding separate drafting-only logic.
