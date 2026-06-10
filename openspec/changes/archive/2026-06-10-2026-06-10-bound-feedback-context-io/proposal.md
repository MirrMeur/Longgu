## Why

Context builds include recent human feedback, but `loadChapterFeedback` currently opens and parses every `feedback/*.feedback.json` file before slicing the latest five. In long projects this makes context builds pay linear JSON read/parse cost even though only a bounded number of feedback artifacts can be included.

## What Changes

- Select eligible feedback files by filename before reading file contents.
- Read at most the latest five feedback JSON files up to the target chapter.
- Preserve validation and chapter-id mismatch checks for the selected files.

## Impact

- Affected specs: `context-builder`
- Affected code: `src/core/feedback.ts`, feedback tests
