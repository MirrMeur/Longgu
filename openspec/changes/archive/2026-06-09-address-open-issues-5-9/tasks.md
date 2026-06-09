## 1. OpenSpec

- [x] 1.1 Create proposal, design, specs, and tasks for issues #5-#9.

## 2. Provider Adapter

- [x] 2.1 Change `doctor` provider check to use minimal `chat/completions`.
- [x] 2.2 Detect reasoning-only empty responses and return an actionable max-token hint.
- [x] 2.3 Add adapter tests for chat health check and reasoning-only response.

## 3. Context Budget

- [x] 3.1 Add optional `context.maxTokens` config with 16000 default.
- [x] 3.2 Make context build use CLI override, then config, then default.
- [x] 3.3 Add config/context tests and README config docs.

## 4. Chapter Planning

- [x] 4.1 Fill deterministic chapter cards with non-empty editable seed values.
- [x] 4.2 Add tests that generated chapter card fields are non-empty and reflect volume plan inputs.

## 5. User Experience

- [x] 5.1 Add next-step hints after major artifact commands.
- [x] 5.2 Add lightweight chapter feedback command and context source.
- [x] 5.3 Add README quickstart and feature status table.
- [x] 5.4 Add CLI smoke tests for key hints and feedback.

## 6. Validation

- [x] 6.1 Run `openspec validate address-open-issues-5-9`.
- [x] 6.2 Run typecheck, tests, build, and full OpenSpec validation.
- [x] 6.3 Archive `address-open-issues-5-9`.
