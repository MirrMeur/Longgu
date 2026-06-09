## MODIFIED Requirements

### Requirement: Context pack schema
The system SHALL validate context packs against a V0.7 schema.

#### Scenario: Context pack shape
- **WHEN** a context pack is written
- **THEN** it contains `schemaVersion`, `chapterId`, `tokenBudget`, `estimatedTokens`, `sections`, `includedSectionCount`, and `generatedAt`
- **THEN** `schemaVersion` is `longgu.context-pack.v0.7`

#### Scenario: Default context budget
- **WHEN** a context pack is built without an explicit `--max-tokens` override
- **THEN** the token budget defaults to the configured `context.maxTokens`
- **THEN** if no config value is present, the token budget defaults to 16000

#### Scenario: CLI context budget override
- **WHEN** a user runs `longgu context build --chapter 001 --max-tokens 200`
- **THEN** the context pack token budget is 200 regardless of `longgu.yaml` defaults

### Requirement: Context sources
The system SHALL include available local context sources relevant to the target chapter.

#### Scenario: Human feedback source selection
- **WHEN** chapter feedback files exist under `feedback/`
- **THEN** the context builder considers the feedback for the context pack
