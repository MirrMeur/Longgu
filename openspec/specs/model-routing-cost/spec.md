# model-routing-cost Specification

## Purpose
TBD - created by archiving change v0-8-model-routing-cost. Update Purpose after archive.
## Requirements
### Requirement: Model profiles
The system SHALL support multiple named model profiles while preserving the legacy single-provider configuration.

#### Scenario: Legacy provider remains valid
- **WHEN** a workspace only has `provider`
- **THEN** the router exposes a `default` model profile based on that provider

#### Scenario: Named models are configured
- **WHEN** a workspace has `models`
- **THEN** each named model profile validates provider settings and optional cost settings

### Requirement: Task model routing
The system SHALL resolve a model profile for task routes.

#### Scenario: Drafting route
- **WHEN** chapter generation runs
- **THEN** it uses the `drafting` route when configured

#### Scenario: Important chapter upgrade
- **WHEN** chapter generation runs with `--important`
- **THEN** it uses the route `importantModel` when configured

### Requirement: Fallback model execution
The system SHALL retry with a fallback model when the routed primary generation model fails.

#### Scenario: Primary model failure
- **WHEN** the primary drafting model fails and a fallback is configured
- **THEN** chapter generation retries with the fallback model
- **THEN** the run metadata records the fallback attempt count

### Requirement: Cost estimates in run metadata
The system SHALL write token and cost estimates to run metadata.

#### Scenario: Successful run cost
- **WHEN** a routed generation run succeeds
- **THEN** metadata contains task, model profile, inputTokens, outputTokens, estimatedCost, durationMs, and fallbackAttempts

### Requirement: Model list command
The system SHALL provide `longgu model list` to inspect configured models and task routes.

#### Scenario: List models
- **WHEN** a user runs `longgu model list`
- **THEN** the command prints configured model profile ids, provider names, model names, and route mapping

### Requirement: Cost report command
The system SHALL provide `longgu cost report` to aggregate run cost estimates.

#### Scenario: Report costs
- **WHEN** run metadata files contain token and cost estimates
- **THEN** the command prints total runs, input tokens, output tokens, estimated cost, and task/model breakdowns

