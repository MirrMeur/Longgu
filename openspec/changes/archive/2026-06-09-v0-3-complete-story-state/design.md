# Design

## Scope

This change completes the V0.3 state layer. `settle chapter` can ask the configured provider to infer a state delta from chapter prose, then applies that machine-checkable delta through schema validation and conflict checks. It also accepts a JSON delta file for deterministic manual/external-tool workflows.

## CLI Shape

```text
longgu state inspect [dir]
longgu settle chapter --id 001 [dir]
longgu settle chapter --id 001 --delta state/deltas/001.delta.json [dir]
```

When `--delta` is omitted, the CLI reads `chapters/<id>.md`, current state ledgers, provider config, and the configured API key, then asks the model to emit only `longgu.state-delta.v0.3` JSON. When `--delta` is present, no model call is made.

## Delta Shape

The delta file uses `schemaVersion: longgu.state-delta.v0.3` and `chapterId`. Each ledger update is represented as upsert arrays:

- `facts`
- `characters`
- `timelineEvents`
- `hooks`
- `readerPromises`
- `resources`

Every item has a stable `id`. Merge semantics are id-based upserts. Existing items with matching ids are replaced by the incoming item after validation; new ids are appended.

## Conflict Checks

The first deterministic conflict checks are deliberately conservative:

- delta `chapterId` must match CLI `--id`.
- duplicate ids inside the same delta array are rejected.
- timeline event ids cannot change their chapter id once recorded.
- hook status cannot move from `resolved` back to `opened`, `mentioned`, or `delayed`.
- reader promise status cannot move from `paid-off` or `broken` back to `active`.
- facts with the same id cannot change text once recorded.

Blocking conflicts abort the settlement before any state file is written.

## Settlement Artifacts

Each successful settlement writes:

```text
state/settlements/<chapter-id>-<timestamp>/
  delta.json
  before.json
  after.json
  diff.json
  metadata.json
```

Model-generated settlements also write `prompt.md` and `model-output.txt`. `diff.json` contains per-ledger added/updated/unchanged counts and the affected ids. This makes state changes reviewable without reading every ledger file.

## Error Handling

Invalid JSON, schema failures, missing state ledgers, missing chapter files, and conflict checks produce explicit CLI errors and non-zero exits. Conflict failures do not write settlement records and do not mutate ledgers.
