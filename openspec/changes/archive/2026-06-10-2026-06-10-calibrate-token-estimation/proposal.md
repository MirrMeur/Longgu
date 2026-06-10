# Calibrate token estimation for mixed context

## Why

GitHub issue #12 reports that `estimateTokens(content.length / 2)` is too crude for Longgu context packs. Context content mixes Chinese prose, Markdown, and formatted JSON ledgers. Underestimated JSON/structured content can distort budget trimming decisions.

## What Changes

- Centralize token estimation in one helper used by context building and model cost routing.
- Use a mixed-content heuristic that counts CJK, ASCII text, structural JSON/Markdown punctuation, whitespace, and other characters separately.
- Add regression coverage for Chinese prose and formatted JSON.

## Impact

- Affects estimated token counts, context trimming decisions, and estimated model cost reporting.
- No CLI flags or schema changes.
- Fixes GitHub issue #12.
