# Design

## Stabilization Scope

V1.0 stabilizes the current single-package CLI implementation rather than moving files into a monorepo. This keeps the release low-risk while preserving the documented future package plan:

- `@longgu/core`
- `@longgu/cli`
- `@longgu/genre-cards`

## Verification Command

Add `npm run verify`, which runs:

```text
npm run typecheck
npm run build
npm test
openspec validate --all
```

## CLI Discovery

Add tests for top-level help and key command groups:

- `plan`
- `state`
- `audit`
- `revise`
- `genre`
- `context`
- `model`
- `cost`
- `experiment`

## Example Project

`examples/xuanhuan-demo/` should include representative local artifacts that can be inspected without calling a model:

- `outlines/book.draft.json`
- `outlines/volume-001.draft.json`
- `outlines/chapters-001.draft.json`
- `state/truth.json`
- `context/001.context.md`
- `experiments/opening-ab/manifest.json`

These artifacts are examples, not canonical outputs for tests.
