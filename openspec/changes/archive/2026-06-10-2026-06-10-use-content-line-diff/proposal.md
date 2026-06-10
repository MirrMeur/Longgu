# Use content-aware line diffs

## Why

GitHub issue #17 reports that revision diffs compare lines by index. Insertions or deletions near the start make every following line appear changed, which makes revision records noisy and hard to review.

## What Changes

- Replace index-based line comparison with a content-aware line diff.
- Preserve readable Markdown diff output with `-` removed lines and `+` added lines.
- Add regression coverage for insertion/deletion alignment.

## Impact

- Affects `revisions/<chapter-id>/<timestamp>/diff.md` content.
- Adds the `diff` package as a runtime dependency for standard line diffing.
- Fixes GitHub issue #17.
