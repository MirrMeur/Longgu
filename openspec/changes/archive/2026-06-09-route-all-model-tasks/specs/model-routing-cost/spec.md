## MODIFIED Requirements

### Requirement: Task model routing
The system SHALL resolve a model profile for every model-backed task route.

#### Scenario: Non-drafting route
- **WHEN** planning, audit, revision, settlement, or experiment generation runs through a provider
- **THEN** it uses the matching task route when configured
- **AND** it falls back to `default` when no matching route is configured

### Requirement: Cost estimates in run metadata
The system SHALL write token and cost estimates to run metadata for every model-backed task that creates a run record.

#### Scenario: Non-drafting run cost
- **WHEN** a model-backed planning, audit, revision, settlement, or experiment run succeeds
- **THEN** metadata contains task, model profile, inputTokens, outputTokens, estimatedCost, durationMs, and fallbackAttempts
