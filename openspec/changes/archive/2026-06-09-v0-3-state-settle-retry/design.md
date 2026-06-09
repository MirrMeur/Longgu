# Design

## Retry Boundary

Only model-generated deltas retry. File-provided deltas are treated as explicit user/external-tool input and fail fast.

`settleChapterState` attempts model extraction up to two times:

1. Initial prompt.
2. Retry prompt with the previous invalid output and the concrete validation or conflict error.

If the second attempt still fails, no ledgers are modified and no success settlement record is written.

## Conflict Handling

Conflict checks happen before merge. For model source, conflict errors are retryable because a model can choose not to rewrite immutable facts or regress resolved hooks. For file source, the same conflicts are final errors.

## Settlement Artifacts

Successful model settlement records write:

- `prompt.md`: the final prompt that produced the accepted delta
- `model-output.txt`: the accepted model output
- `model-attempts.json`: all model attempts with prompt, output, and error for rejected attempts

Failed retries leave no settlement directory, preserving the V0.3 no-mutation-on-failure guarantee.
