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
The system SHALL resolve a model profile for every model-backed task route.

#### Scenario: Drafting route
- **WHEN** chapter generation runs
- **THEN** it uses the `drafting` route when configured

#### Scenario: Important chapter upgrade
- **WHEN** chapter generation runs with `--important`
- **THEN** it uses the route `importantModel` when configured

#### Scenario: Non-drafting route
- **WHEN** planning, audit, revision, settlement, or experiment generation runs through a provider
- **THEN** it uses the matching task route when configured
- **AND** it falls back to `default` when no matching route is configured

#### Scenario: Summary route
- **WHEN** chapter summary generation runs
- **THEN** the system resolves the `summarize` model task route

### Requirement: Fallback model execution
The system SHALL retry transient generation failures before moving to a fallback model, and SHALL retry with a fallback model when the routed primary generation model fails.

#### Scenario: Transient primary retry
- **WHEN** the primary generation model fails with a transient provider error
- **THEN** the system retries that primary model before using a fallback model
- **AND** the run metadata records the failed and successful attempts

#### Scenario: Primary model failure
- **WHEN** the primary drafting model fails after retryable attempts are exhausted and a fallback is configured
- **THEN** chapter generation retries with the fallback model
- **THEN** the run metadata records the fallback attempt count

#### Scenario: Hard primary failure
- **WHEN** the primary generation model fails with a non-retryable provider error
- **THEN** the system does not retry that same profile
- **AND** it may move directly to a configured fallback model

#### Scenario: Generation call timeout
- **WHEN** a provider generation call exceeds the per-call timeout
- **THEN** the system aborts that call and treats it as a transient failure

### Requirement: Cost estimates in run metadata
The system SHALL write token and cost estimates to run metadata for every model-backed or host-imported task that creates a run record.

#### Scenario: Host LLM import cost
- **WHEN** a host-generated chapter draft is imported through `write chapter --input`
- **THEN** metadata contains task, model profile, inputTokens, outputTokens, estimatedCost, and durationMs
- **THEN** model profile is `host`
- **THEN** estimated cost is `0`

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

