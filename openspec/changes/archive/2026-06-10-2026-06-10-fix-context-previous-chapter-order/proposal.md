# Fix context previous chapter ordering

## Why

GitHub issue #25 reports that context packs can omit earlier cross-volume chapter bodies when volume identifiers have different digit widths, such as `v9-005` before `v10-001`. The current implementation compares chapter ids lexicographically, which does not match numeric volume order for those ids.

## What Changes

- Replace lexicographic previous-chapter selection with natural chapter id ordering.
- Keep the existing limit of the two nearest previous chapter bodies.
- Add a regression test covering `v9-005` before `v10-001`.

## Impact

- Affects context pack source selection only.
- No CLI flags, file formats, or schema versions change.
- Fixes GitHub issue #25.
