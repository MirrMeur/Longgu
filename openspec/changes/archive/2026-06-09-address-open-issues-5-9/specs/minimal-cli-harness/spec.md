## MODIFIED Requirements

### Requirement: Doctor checks workspace and provider readiness
The system SHALL provide `longgu doctor` to check workspace structure, configuration validity, API key availability, and model connectivity.

#### Scenario: Workspace is ready
- **WHEN** a user runs `longgu doctor` in a valid configured workspace with reachable provider settings
- **THEN** the system checks provider connectivity through a minimal chat completion request
- **THEN** the system reports that file structure, configuration, API key, and provider connectivity checks pass

#### Scenario: Provider is not ready
- **WHEN** a user runs `longgu doctor` with a missing API key or unreachable provider
- **THEN** the system reports the exact failed check and exits with a non-zero status

#### Scenario: Provider model listing is unavailable
- **WHEN** a provider supports `POST /chat/completions` but does not support `GET /models`
- **THEN** `longgu doctor` succeeds if the minimal chat completion check succeeds

### Requirement: Novel configuration schema
The system SHALL validate `longgu.yaml` against a schema that supports provider and workflow defaults.

#### Scenario: Context budget configuration
- **WHEN** `longgu.yaml` contains `context.maxTokens`
- **THEN** the configuration validates successfully
- **THEN** context building can use that value when no CLI override is supplied

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate a chapter from the current Longgu workspace inputs and prompt template.

#### Scenario: Reasoning model exhausts output budget
- **WHEN** the provider response contains reasoning content but no final message content
- **THEN** the system reports that the reasoning model may need a larger `provider.maxTokens`
- **THEN** the failed run record contains the actionable error message
