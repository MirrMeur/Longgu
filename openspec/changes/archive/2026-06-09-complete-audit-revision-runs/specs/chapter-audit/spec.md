## MODIFIED Requirements

### Requirement: Chapter audit command
The system SHALL provide `longgu audit chapter --id <id>` to audit chapter prose and leave structured audit artifacts plus model run evidence when provider generation is used.

#### Scenario: Model-backed audit writes run evidence
- **WHEN** a user runs `longgu audit chapter --id 001` without `--input`
- **THEN** the system uses the `audit` model route
- **AND** the system writes a run record under `runs/`
- **AND** the run metadata records task `audit`, selected model profile, attempts, fallback count, token estimates, and estimated cost

#### Scenario: Provided audit input remains provider-free
- **WHEN** a user runs `longgu audit chapter --id 001 --input audits/raw.json`
- **THEN** the system does not create a model run record for audit generation
