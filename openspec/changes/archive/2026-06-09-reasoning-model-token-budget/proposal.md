## Why

Issue #8 reports that reasoning models can consume a low `max_tokens` budget before producing final `content`, leaving only `reasoning_content` and an empty user-visible output.

The adapter already gives an actionable error for reasoning-only responses, but it should also reserve extra budget for common reasoning model names.

## What Changes

- Detect common reasoning model names from the configured provider model string.
- Send `max_tokens` as `provider.maxTokens * 1.5` for those models.
- Keep configured `provider.maxTokens` unchanged in config and cost metadata.
- Add adapter tests for the adjusted request budget.

## Capabilities

### Modified Capabilities

- `minimal-cli-harness`: improves generation behavior for reasoning model providers.

## Impact

- Only changes outbound OpenAI-compatible request payloads for likely reasoning models.
- Does not change non-reasoning model request budgets.
