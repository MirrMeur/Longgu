## MODIFIED Requirements

### Requirement: Chapter revision command
The system SHALL provide `longgu revise chapter --id <id>` to revise a chapter using its audit result and leave revision artifacts plus model run evidence when provider generation is used.

#### Scenario: Model-backed revision writes run evidence
- **WHEN** a user runs `longgu revise chapter --id 001` without `--input`
- **THEN** the system uses the `revise` model route
- **AND** the system writes a run record under `runs/`
- **AND** the run metadata records task `revise`, selected model profile, attempts, fallback count, token estimates, and estimated cost

#### Scenario: Provided revision input remains provider-free
- **WHEN** a user runs `longgu revise chapter --id 001 --input revisions/001.candidate.md`
- **THEN** the system does not create a model run record for revision generation
