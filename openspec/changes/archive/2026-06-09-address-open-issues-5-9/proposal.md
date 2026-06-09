## Why

The remaining open issues report concrete friction from real workflow use:

- `doctor` depends on `GET /models`, which fails for providers whose generation endpoint works.
- reasoning models can return only `reasoning_content` when `max_tokens` is too small, producing an unhelpful empty-content error.
- context packs default to a small 4000-token budget and cannot be configured from `longgu.yaml`.
- deterministic chapter planning produces empty chapter card fields, leaving `write chapter` without useful structure.
- the README and CLI outputs do not provide enough step-by-step guidance or next-action prompts.

## What Changes

- Change provider health checks to use a minimal `POST /chat/completions` request.
- Detect reasoning-only empty responses and report an actionable max-token hint.
- Add `context.maxTokens` config with a 16000 default and preserve `--max-tokens` as an override.
- Generate non-empty deterministic chapter card fields from the volume plan.
- Add concise next-step hints after major write commands.
- Add a lightweight `feedback chapter` command that records human scores/comments and feeds them into later context packs.
- Add a README quickstart with a concrete review loop and feature status notes.

## Capabilities

### Modified Capabilities

- `minimal-cli-harness`: provider doctor behavior, config schema, CLI guidance.
- `context-builder`: default/configured token budget.
- `book-planning`: chapter cards must contain usable non-empty planning fields.
- `stable-harness`: public documentation explains current workflow and module status.

## Impact

- No new provider dependency.
- `doctor` now consumes a tiny chat completion request instead of relying on provider model listing.
- Existing `longgu.yaml` files remain valid; `context.maxTokens` is optional.
- Chapter planning remains provider-independent in this slice.
- Larger product direction items from issue #9, such as Claude Code plugin mode and richer review products, remain outside this change.
