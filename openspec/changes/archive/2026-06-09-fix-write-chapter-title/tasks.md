## 1. OpenSpec

- [x] 1.1 Create `fix-write-chapter-title` change with proposal, spec delta, and tasks.

## 2. Implementation

- [x] 2.1 Read the matching chapter card title from chapters draft files during `writeChapter`.
- [x] 2.2 Normalize the generated Markdown H1 to `# 第<chapterId>章 <title>` when a matching chapter card exists.
- [x] 2.3 Preserve existing fallback behavior when no matching chapter card exists.

## 3. Tests

- [x] 3.1 Add unit coverage for planned title replacement.
- [x] 3.2 Add unit coverage for full compound chapter id headings.
- [x] 3.3 Add unit coverage for no-plan fallback behavior.

## 4. Validation

- [x] 4.1 Run `openspec validate fix-write-chapter-title`.
- [x] 4.2 Run typecheck, tests, and build.
- [x] 4.3 Archive `fix-write-chapter-title`.
