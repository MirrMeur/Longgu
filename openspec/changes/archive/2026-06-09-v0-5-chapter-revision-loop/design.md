# Design

## CLI Shape

```text
longgu revise chapter --id 001 [dir]
longgu revise chapter --id 001 --input revisions/001.candidate.md [dir]
longgu revise chapter --id 001 --mode polish [dir]
longgu revise chapter --id 001 --post-audit audits/001.post-audit.json [dir]
```

`--mode` defaults to `spot-fix` when the audit has warning issues and no critical issues. Critical issues default to `rewrite-scene` unless the user explicitly chooses a mode.

## Provider Contract

The provider receives:

- current chapter Markdown
- `audits/<id>.audit.json`
- selected issues
- mode-specific instructions
- current state ledgers as constraints

The provider must return the full revised chapter Markdown. V0.5 does not ask the model to emit JSON patches because the chapter body is still plain Markdown.

When `--input` is provided, Longgu reads the revised Markdown from that path and skips the provider call. This supports deterministic tests, human edits, and external revision tools while still writing the same revision record and diff.

## Diff

Longgu writes a simple line diff in `diff.md`:

- unchanged lines are omitted
- removed lines are prefixed with `- `
- added lines are prefixed with `+ `

This is intentionally simple and reviewable; a richer patch format can come later.

## Revision Record

Successful revisions write:

```text
revisions/001/<timestamp>/
  before.md
  after.md
  diff.md
  metadata.json
  prompt.md
  model-output.md
```

`metadata.json` records mode, audit source, selected issue ids, pre/post critical counts when available, and whether critical count decreased.

## Safety

- Missing chapter or missing audit fails before provider call.
- Empty revised output fails.
- Identical revised output fails.
- State ledgers are read as constraints but never mutated by revision.
- If `--post-audit` is provided, critical count must decrease for a revision that started with critical issues; otherwise the revision is marked failed and the chapter is not replaced.
