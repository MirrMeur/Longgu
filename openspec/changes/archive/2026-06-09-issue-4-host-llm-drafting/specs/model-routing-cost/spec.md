## MODIFIED Requirements

### Requirement: Cost estimates in run metadata
The system SHALL write token and cost estimates to run metadata for every model-backed or host-imported task that creates a run record.

#### Scenario: Host LLM import cost
- **WHEN** a host-generated chapter draft is imported through `write chapter --input`
- **THEN** metadata contains task, model profile, inputTokens, outputTokens, estimatedCost, and durationMs
- **THEN** model profile is `host`
- **THEN** estimated cost is `0`
