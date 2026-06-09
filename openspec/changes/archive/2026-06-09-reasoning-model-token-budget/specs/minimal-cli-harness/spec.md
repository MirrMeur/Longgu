## MODIFIED Requirements

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate a chapter from the current Longgu workspace inputs and prompt template.

#### Scenario: Reasoning model receives reserved output budget
- **WHEN** the configured provider model name indicates a reasoning model
- **THEN** the OpenAI-compatible adapter sends a larger request `max_tokens` than the configured `provider.maxTokens`

#### Scenario: Reasoning model exhausts output budget
- **WHEN** the provider response contains reasoning content but no final message content
- **THEN** the system reports that the reasoning model may need a larger `provider.maxTokens`
- **THEN** the failed run record contains the actionable error message
