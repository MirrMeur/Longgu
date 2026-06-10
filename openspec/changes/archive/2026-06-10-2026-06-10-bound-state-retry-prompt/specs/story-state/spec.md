## MODIFIED Requirements

### Requirement: Model state settlement retry
The system SHALL retry model-generated state delta extraction once when the first model output is invalid or conflict-blocked.

#### Scenario: Retry invalid model delta
- **WHEN** a user runs `longgu settle chapter --id 001`
- **AND** the first provider output is invalid JSON or does not match the state delta schema
- **THEN** the system asks the provider to output the delta again with the validation error included
- **THEN** the retry prompt includes only a bounded excerpt of the rejected output
- **THEN** no state ledgers are modified until a valid conflict-free delta is produced

#### Scenario: Retry conflict-blocked model delta
- **WHEN** a model-generated delta attempts a blocking state conflict
- **THEN** the system asks the provider to output a corrected delta with the conflict reason included
- **THEN** the retry prompt includes only a bounded excerpt of the rejected output
- **THEN** no state ledgers are modified until a valid conflict-free delta is produced

#### Scenario: Retry success record
- **WHEN** a retry produces a valid conflict-free delta
- **THEN** the system applies that delta
- **THEN** the settlement directory contains `model-attempts.json` with rejected and accepted attempts

#### Scenario: Retry exhausted
- **WHEN** both model attempts fail validation or conflict checks
- **THEN** the system reports the final error
- **THEN** no state ledgers are modified
- **THEN** no success settlement record is written
