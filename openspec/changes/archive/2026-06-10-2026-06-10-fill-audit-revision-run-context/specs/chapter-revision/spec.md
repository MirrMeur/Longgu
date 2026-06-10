## MODIFIED Requirements

### Requirement: Chapter revision command
The system SHALL provide `longgu revise chapter --id <id>` to revise a chapter using its V0.4 audit result and leave model run evidence when provider generation is used.

#### Scenario: Revise audited chapter
- **WHEN** a user runs `longgu revise chapter --id 001`
- **AND** `chapters/001.md` exists
- **AND** `audits/001.audit.json` exists
- **AND** provider credentials are available
- **THEN** the system asks the provider for revised chapter Markdown
- **THEN** the system writes a revision record
- **THEN** the system replaces `chapters/001.md` with the revised chapter

#### Scenario: Revise chapter with provided input
- **WHEN** a user runs `longgu revise chapter --id 001 --input revisions/001.candidate.md`
- **AND** `chapters/001.md` exists
- **AND** `audits/001.audit.json` exists
- **THEN** the system reads the revised Markdown from the input path without making a provider request
- **THEN** the system writes a revision record
- **THEN** the system replaces `chapters/001.md` with the revised chapter

#### Scenario: Missing audit
- **WHEN** a user revises chapter `001`
- **AND** `audits/001.audit.json` does not exist
- **THEN** the system reports the missing audit
- **THEN** the chapter is not modified

#### Scenario: Model-backed revision writes run evidence
- **WHEN** a user runs `longgu revise chapter --id 001` without `--input`
- **THEN** the system uses the `revise` model route
- **THEN** the system writes a run record under `runs/`
- **AND** the run metadata records task `revise`, selected model profile, attempts, fallback count, token estimates, and estimated cost
- **AND** the run record context includes the non-empty original chapter body used for revision generation

#### Scenario: Provided revision input remains provider-free
- **WHEN** a user runs `longgu revise chapter --id 001 --input revisions/001.candidate.md`
- **THEN** the system does not create a model run record for revision generation
