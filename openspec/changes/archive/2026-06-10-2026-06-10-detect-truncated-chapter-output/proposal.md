## Why

Provider output can stop in the middle of a sentence when the model reaches its output budget. Longgu currently normalizes and saves the text immediately, which can persist incomplete chapters.

## What Changes

- Detect likely truncated provider chapter output before writing `chapters/<id>.md`.
- Retry full chapter generation once with explicit completion guidance.
- Fail without writing the chapter if the retry is also likely truncated.

## Impact

- Affected specs: `minimal-cli-harness`
- Affected code: `src/core/generation.ts`, generation tests
