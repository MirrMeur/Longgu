## MODIFIED Requirements

### Requirement: Experiment comparison
The system SHALL compare registered experiment variants with reviewable artifacts.

#### Scenario: Diagnose experiment variants
- **WHEN** a user runs `longgu experiment diagnose --id opening-ab`
- **THEN** the system analyzes registered variant outputs
- **AND** writes JSON and Markdown diagnostics for hook strength, dialogue density, payoff interval, tail-hook quality, readability, and emotional curve.
