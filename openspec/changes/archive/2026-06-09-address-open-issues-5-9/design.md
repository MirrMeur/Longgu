## Provider Checks

Use the same OpenAI-compatible `chat/completions` endpoint as generation for `doctor`, with a minimal prompt and `max_tokens: 1`. This aligns health checks with the path users actually need.

Reasoning models may spend the whole small budget on hidden or explicit reasoning. For generation calls, if `content` is empty and a `reasoning_content` field exists, return an actionable error that tells users to increase `provider.maxTokens`.

## Context Budget

Add `context.maxTokens` to `longgu.yaml` and default it to 16000. `context build --max-tokens` remains the explicit command-line override. `write chapter` uses the same default/configured budget via `buildChapterContext`, so drafting benefits automatically.

## Chapter Planning

The current `plan chapters` command is deterministic and provider-independent, so it cannot produce model-quality plot cards. But it should not emit empty fields. The smallest useful fix is to derive non-empty editable seed values from the volume plan:

- title: `第NNN章 <volume title short label>`
- goal: advance the volume goal in staged steps
- conflict: derive from conflict escalation and antagonist
- payoff: derive from expected payoff/key payoffs
- informationGain: point at resource/setting/antagonist changes
- endingHook: use volume ending hook for the final chapter and escalating hooks for earlier chapters

This gives `write chapter` usable structure without pretending to solve creative planning fully.

## User Guidance

Add next-step hints after artifact-producing commands so the CLI tells users when to inspect, edit, audit, revise, or settle. Keep hints short and plain because the CLI is still file-first.

README gets a real quickstart and a status table. It should remain public-facing and not expose internal SDD process.

## Feedback Loop

Add a small file-first feedback command before building any richer review product:

- `longgu feedback chapter --id <id> --score <0-10> --comment <text>`
- write `feedback/<id>.feedback.json`
- append feedback entries without overwriting previous comments
- context packs include recent feedback as medium-priority guidance

This gives users a way to tell the system why a chapter failed without requiring a database or an interactive UI.
