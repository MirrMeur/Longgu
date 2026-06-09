## 1. OpenSpec

- [x] 1.1 Create `use-context-pack-for-drafting` proposal, design, spec deltas, and tasks.

## 2. Context Builder

- [x] 2.0 Include base bible Markdown files as context-pack sources for V0.1-only workspaces.
- [x] 2.1 Include recent existing chapter Markdown as low-priority continuity context.
- [x] 2.2 Keep target chapter body out of its own context pack.

## 3. Drafting Implementation

- [x] 3.1 Make `writeChapter` build a context pack before rendering the prompt.
- [x] 3.2 Render drafting prompt from included context-pack sections.
- [x] 3.3 Persist run records with context-pack-derived input files.

## 4. Tests

- [x] 4.1 Add context builder coverage for previous chapter body inclusion.
- [x] 4.2 Add `writeChapter` coverage proving prompt input includes chapter card and previous chapter context.
- [x] 4.3 Keep no-planning fallback coverage passing.

## 5. Validation

- [x] 5.1 Run `openspec validate use-context-pack-for-drafting`.
- [x] 5.2 Run typecheck, tests, build, and full OpenSpec validation.
- [x] 5.3 Archive `use-context-pack-for-drafting`.
