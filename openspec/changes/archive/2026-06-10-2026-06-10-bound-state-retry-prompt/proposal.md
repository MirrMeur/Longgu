# Bound state settlement retry prompt

## Why

GitHub issue #16 reports that state settlement retry prompts append the full previous provider output and full error message to the original prompt. Large invalid outputs can make the retry prompt balloon without adding useful corrective signal.

## What Changes

- Limit the rejected output and error detail embedded in retry prompts.
- Add explicit JSON-only correction guidance and a minimal schema skeleton.
- Add regression coverage proving long rejected output is truncated before retry.

## Impact

- Affects provider-backed `longgu settle chapter` retry prompts only.
- Does not change settlement schemas, retry count, or run record formats.
- Fixes GitHub issue #16.
