# 2026-06-10 Reader Promise Debt Check

## Why

Longgu already stores `reader-promises.json`, but `longgu state check` only detects dangling references. For a serialized male-channel webnovel, reader promises are not decorative notes: revenge, resource hunger, identity reversal, system rewards, mystery clues, and public humiliation must be paid off at a readable cadence. If active promises linger too long, the story starts to feel like it is opening debts without paying them.

Recent long-form story generation research such as WebNovelBench and Narrative Knowledge Weaver emphasizes multi-dimensional narrative quality, causality, character goals, and consequence tracking. Longgu should turn that into an operational state gate: active reader promises should be checked against the current chapter and flagged when they become overdue.

## What Changes

- Add reader promise debt checks to `longgu state check`.
- Allow callers to pass current chapter id and active-promise age threshold.
- Flag active reader promises whose `sourceChapterId` is too far behind the current chapter.
- Include overdue promise issues in JSON and Markdown reports.
- Keep old behavior unchanged when no current chapter is provided.

## Impact

- Capability affected: `story-state`.
- Code affected: state check API, CLI `state check`, tests, OpenSpec.
- Data compatibility: ledger schema stays unchanged.
