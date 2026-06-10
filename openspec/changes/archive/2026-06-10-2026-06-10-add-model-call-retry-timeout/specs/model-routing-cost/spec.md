## MODIFIED Requirements

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
