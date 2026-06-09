## MODIFIED Requirements

### Requirement: Book planning CLI command
The system SHALL provide planning commands that create structured draft artifacts from the current Longgu workspace inputs, either deterministically or through the configured planning model.

#### Scenario: Create a model-backed book draft
- **WHEN** a user runs `longgu plan book --model` in a valid workspace
- **THEN** the system routes generation through the `planning` model route
- **THEN** the system validates the provider JSON against the book draft schema
- **THEN** the system writes `outlines/book.draft.json`
- **AND** the system writes a planning run record under `runs/`

#### Scenario: Create a model-backed volume draft
- **WHEN** a user runs `longgu plan volume --id 001 --model` with `outlines/book.draft.json`
- **THEN** the system routes generation through the `planning` model route
- **THEN** the system validates the provider JSON against the volume draft schema
- **THEN** the system writes `outlines/volume-001.draft.json`
- **AND** the system writes a planning run record under `runs/`

#### Scenario: Create model-backed chapter cards
- **WHEN** a user runs `longgu plan chapters --volume 001 --model` with `outlines/volume-001.draft.json`
- **THEN** the system routes generation through the `planning` model route
- **THEN** the system validates the provider JSON against the chapters draft schema
- **THEN** the system writes `outlines/chapters-001.draft.json`
- **AND** the system writes a planning run record under `runs/`

#### Scenario: Deterministic planning remains default
- **WHEN** a user runs a planning command without `--model`
- **THEN** the system creates the same editable deterministic draft behavior as before
