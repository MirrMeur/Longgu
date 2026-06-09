## MODIFIED Requirements

### Requirement: Book planning CLI command
The system SHALL provide planning commands that create structured draft artifacts from the current Longgu workspace inputs, either deterministically or through the configured planning model.

#### Scenario: Create a chapters draft
- **WHEN** a user runs `longgu plan chapters --volume 001` in a valid workspace with `outlines/volume-001.draft.json`
- **THEN** the system reads `outlines/volume-001.draft.json`
- **THEN** the system writes `outlines/chapters-001.draft.json`
- **THEN** the draft records the volume id, genre, upstream volume source, and editable chapter cards

#### Scenario: Create a book draft
- **WHEN** a user runs `longgu plan book` in a valid workspace
- **THEN** the system reads `longgu.yaml` and existing `bible/*.md` files
- **THEN** the system writes `outlines/book.draft.json`
- **THEN** the draft records the title, genre, source files, and editable planning fields

#### Scenario: Create a volume draft
- **WHEN** a user runs `longgu plan volume --id 001` in a valid workspace with `outlines/book.draft.json`
- **THEN** the system reads `outlines/book.draft.json`
- **THEN** the system writes `outlines/volume-001.draft.json`
- **THEN** the draft records the volume id, title, genre, upstream book source, and editable volume planning fields

#### Scenario: Force regenerate an existing book draft
- **WHEN** `outlines/book.draft.json` already exists
- **AND** the user runs `longgu plan book --force`
- **THEN** the system replaces `outlines/book.draft.json` with a newly generated draft

#### Scenario: Refuse to overwrite an existing chapters draft
- **WHEN** `outlines/chapters-001.draft.json` already exists
- **AND** the user runs `longgu plan chapters --volume 001` without `--force`
- **THEN** the system reports that the chapters draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Refuse to overwrite an existing book draft
- **WHEN** `outlines/book.draft.json` already exists
- **AND** the user runs `longgu plan book` without `--force`
- **THEN** the system reports that the draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Refuse to overwrite an existing volume draft
- **WHEN** `outlines/volume-001.draft.json` already exists
- **AND** the user runs `longgu plan volume --id 001` without `--force`
- **THEN** the system reports that the volume draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Force regenerate an existing chapters draft
- **WHEN** `outlines/chapters-001.draft.json` already exists
- **AND** the user runs `longgu plan chapters --volume 001 --force`
- **THEN** the system replaces `outlines/chapters-001.draft.json` with a newly generated draft

#### Scenario: Force regenerate an existing volume draft
- **WHEN** `outlines/volume-001.draft.json` already exists
- **AND** the user runs `longgu plan volume --id 001 --force`
- **THEN** the system replaces `outlines/volume-001.draft.json` with a newly generated draft

#### Scenario: Missing upstream book draft
- **WHEN** a user runs `longgu plan volume --id 001` before `outlines/book.draft.json` exists
- **THEN** the system reports that `longgu plan book` must be run first
- **THEN** no volume draft is written

#### Scenario: Missing upstream volume draft
- **WHEN** a user runs `longgu plan chapters --volume 001` before `outlines/volume-001.draft.json` exists
- **THEN** the system reports that `longgu plan volume --id 001` must be run first
- **THEN** no chapters draft is written

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
