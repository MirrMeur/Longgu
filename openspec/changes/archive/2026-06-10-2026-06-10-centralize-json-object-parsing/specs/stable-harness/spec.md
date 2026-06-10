## ADDED Requirements

### Requirement: Shared provider JSON parsing
The system SHALL parse JSON object responses from provider text through one shared helper.

#### Scenario: Fenced JSON object
- **WHEN** a provider response contains a JSON object inside a Markdown JSON fence
- **THEN** the shared parser returns the object for schema validation

#### Scenario: Wrapped JSON object
- **WHEN** a provider response contains explanatory text around a JSON object
- **THEN** the shared parser extracts the first complete object span from the first `{` through the last `}`

#### Scenario: Missing JSON object
- **WHEN** a provider response does not contain a JSON object
- **THEN** the caller receives a domain-specific error message
