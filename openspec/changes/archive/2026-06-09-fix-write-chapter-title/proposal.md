## Why

`longgu write chapter` currently writes the provider output verbatim. When the model invents or mutates the Markdown H1, generated chapters can ignore the title defined in `outlines/chapters-<volume>.draft.json` and can show inconsistent chapter ids such as `第001章` for `001-002`.

This breaks the planning-to-drafting contract and makes multi-volume chapter files harder to review.

## What Changes

- Normalize generated chapter Markdown so the first H1 is `# 第<chapterId>章 <title>` when a matching chapter card exists.
- Read `title` from the matching chapter card in `outlines/chapters-*.draft.json`.
- Use the full requested `chapterId` in the heading, including compound ids such as `001-002`.
- Keep provider body content after removing any provider-generated leading H1.
- Fall back to the existing generated content when no matching chapter card exists.
- Add tests for planned titles, compound ids, and fallback behavior.

## Capabilities

### Modified Capabilities

- `minimal-cli-harness`: Tightens `write chapter` output behavior so chapter files align with planning artifacts when present.

## Impact

- Affects `writeChapter` output only.
- Does not change prompt rendering, provider routing, context building, or run metadata shape.
- Does not address multi-chapter continuity or host-LLM integration.
