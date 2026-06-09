## Why

`longgu write chapter` still renders its drafting prompt from `bible/*.md` only. This means consecutive chapter writes do not automatically include the current chapter card, volume plan, state ledgers, prior summaries, or previous chapter content, even though `longgu context build` already knows how to assemble those sources.

The result is weak continuity: chapter N+1 can repeat chapter N's opening setup instead of continuing from recent events.

## What Changes

- Make `writeChapter` build a context pack for the target chapter before rendering the drafting prompt.
- Render the drafting prompt from included context-pack sections instead of raw bible files.
- Include base `bible/*.md` files in context packs so V0.1-only workspaces keep their original drafting inputs.
- Include recent existing chapter Markdown as low-priority continuity context in context packs.
- Persist run records with the context pack sources used for drafting.
- Keep context-pack JSON/Markdown artifacts reviewable under `context/`.
- Add tests that `writeChapter` prompts include current chapter cards and previous chapter continuity context.

## Capabilities

### Modified Capabilities

- `minimal-cli-harness`: `write chapter` uses the context-pack pipeline for drafting input.
- `context-builder`: Context packs can include recent existing chapter bodies for continuity.

## Impact

- Drafting prompts become richer when planning, state, summaries, or prior chapter files exist.
- `write chapter` may create or update `context/<chapter-id>.context.json` and `.md`.
- Existing workspaces without planning artifacts still work because context sections fall back to available sources.
- Does not implement host-LLM integration or multi-chapter batch generation.
