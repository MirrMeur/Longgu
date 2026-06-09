# Design

## Promise Age

Promise age is computed from numeric chapter ids:

`age = currentChapterNumber - sourceChapterNumber`

The first implementation accepts simple numeric chapter ids such as `001`, `12`, or `100`. If either id cannot be parsed as an integer, the promise is skipped instead of producing a false warning.

## Threshold

`longgu state check` accepts:

- `--chapter <id>`: current chapter id used as the reference point.
- `--promise-max-age <number>`: maximum active promise age before the state check reports a warning.

The core default is `5` chapters. That is intentionally conservative: it catches promises that are likely becoming stale while allowing short setup chains.

## Issue Shape

Existing `StateCheckIssueSchema` already has enough fields: severity, ledger, itemId, reason. Overdue promises are warnings with ledger `reader-promises`.

## Backward Compatibility

If `--chapter` is omitted, `state check` behaves as before and does not run promise age checks. Existing callers and tests remain valid.
