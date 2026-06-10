## Why

Chapter drafting prompts do not include target length guidance, so model output length is controlled only by provider `maxTokens`. That makes chapters drift long and increases the risk of hard truncation.

## What Changes

- Add `drafting.targetWords` config with a default target length.
- Allow chapter plan cards to specify `targetWords` for per-chapter pacing.
- Render target word count guidance in every chapter drafting prompt.
- Prefer chapter-card `targetWords` over global config.

## Impact

- Affected specs: `minimal-cli-harness`, `book-planning`
- Affected code: config schema, chapter plan schema, prompt rendering, generation prompt wiring, tests
