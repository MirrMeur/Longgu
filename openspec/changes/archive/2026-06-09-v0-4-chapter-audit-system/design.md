# Design

## CLI Shape

```text
longgu audit chapter --id 001 [dir]
longgu audit chapter --id 001 --input audits/001.raw-audit.json [dir]
```

Without `--input`, the CLI reads chapter text, chapter plan draft if present, state ledgers if present, and provider config. It asks the model to emit structured audit JSON.

With `--input`, Longgu validates and normalizes a provided raw audit JSON without a provider call. This keeps tests and offline review deterministic.

## Audit Schema

The normalized audit artifact uses `schemaVersion: longgu.chapter-audit.v0.4`.

Required top-level fields:

- `chapterId`
- `genre`
- `status`: `passed`, `needs-revision`, or `blocked`
- `summary`
- `scores`: `retention`, `readability`, `aiFlavor`, `scenePressure`, `characterVoice`
- `issues`
- `reviseQueue`
- `blocked`
- `sourceFiles`
- `generatedAt`

Each issue includes:

- `id`
- `severity`: `critical`, `warning`, `info`
- `source`: `chapter-plan`, `prose`, `state`, or `rule`
- `dimension`
- `location`
- `reason`
- `fix`
- optional `checkerPriority`: `P0`, `P1`, or `P2`

## Checker Mapping

Longgu does not call Codex skills at runtime. Instead, V0.4 productizes the checker rules as schema and prompt constraints:

- `novel-chapter-checker` style pacing findings map `P0/P1/P2` to `critical/warning/info`.
- `novel-prose-checker` style prose findings feed prose metrics and prose-sourced issues.

## Inputs

The audit prompt includes:

- `longgu.yaml` genre/title/config metadata
- `chapters/<id>.md`
- `outlines/chapters-*.draft.json` matching the chapter id when available
- state ledgers when initialized

## Artifacts

Successful audits write:

```text
audits/001.audit.json
audits/001.audit.md
audits/001.audit-attempts.json   # provider path only
```

`audit.md` is a readable projection of the JSON report, not the source of truth.

## Failure Behavior

Provider audit output is retried once if JSON parsing or schema validation fails. If both attempts fail, no final audit JSON/Markdown is written. Provided `--input` fails fast without retry.
