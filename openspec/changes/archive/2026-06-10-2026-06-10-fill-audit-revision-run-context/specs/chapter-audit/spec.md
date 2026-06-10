## MODIFIED Requirements

### Requirement: Chapter audit command
The system SHALL provide `longgu audit chapter --id <id>` to create structured chapter audit artifacts and leave model run evidence when provider generation is used.

#### Scenario: Audit chapter with provider
- **WHEN** a user runs `longgu audit chapter --id 001`
- **AND** `chapters/001.md` exists
- **AND** provider credentials are available
- **THEN** the system asks the provider for structured chapter audit JSON
- **THEN** the system writes `audits/001.audit.json`
- **THEN** the system writes `audits/001.audit.md`

#### Scenario: Audit chapter with provided input
- **WHEN** a user runs `longgu audit chapter --id 001 --input audits/001.raw-audit.json`
- **AND** the input is valid
- **THEN** the system validates and normalizes the input without making a provider request
- **THEN** the system writes `audits/001.audit.json` and `audits/001.audit.md`

#### Scenario: Missing chapter
- **WHEN** a user audits chapter `001`
- **AND** `chapters/001.md` does not exist
- **THEN** the system reports the missing chapter
- **THEN** no final audit artifacts are written

#### Scenario: Model-backed audit writes run evidence
- **WHEN** a user runs `longgu audit chapter --id 001` without `--input`
- **THEN** the system uses the `audit` model route
- **THEN** the system writes a run record under `runs/`
- **AND** the run metadata records task `audit`, selected model profile, attempts, fallback count, token estimates, and estimated cost
- **AND** the run record context includes non-empty source content used for audit generation

#### Scenario: Provided audit input remains provider-free
- **WHEN** a user runs `longgu audit chapter --id 001 --input audits/raw.json`
- **THEN** the system does not create a model run record for audit generation

#### Scenario: Audit command reports contract status
- **WHEN** a user runs `longgu audit chapter --id 001`
- **AND** audit generation succeeds
- **THEN** the CLI output includes the normalized chapter contract status
