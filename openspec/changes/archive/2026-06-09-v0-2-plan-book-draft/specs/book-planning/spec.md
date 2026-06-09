## ADDED Requirements

### Requirement: Book planning CLI command
The system SHALL provide `longgu plan book` to create a structured book specification draft from the current Longgu workspace inputs.

#### Scenario: Create a book draft
- **WHEN** a user runs `longgu plan book` in a valid workspace
- **THEN** the system reads `longgu.yaml` and existing `bible/*.md` files
- **THEN** the system writes `outlines/book.draft.json`
- **THEN** the draft records the title, genre, source files, and editable planning fields

#### Scenario: Refuse to overwrite an existing draft
- **WHEN** `outlines/book.draft.json` already exists
- **AND** the user runs `longgu plan book` without `--force`
- **THEN** the system reports that the draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Force regenerate an existing draft
- **WHEN** `outlines/book.draft.json` already exists
- **AND** the user runs `longgu plan book --force`
- **THEN** the system replaces `outlines/book.draft.json` with a newly generated draft

### Requirement: Book draft schema
The system SHALL validate the generated book draft against a structured schema before writing it.

#### Scenario: Draft contains V0.2 planning fields
- **WHEN** the system creates a book draft
- **THEN** the draft contains `schemaVersion`, `status`, `title`, `genre`, `premise`, `protagonist`, `coreHook`, `conflictLadder`, `powerSystem`, `readerPromises`, `retentionRisks`, and `sourceFiles`
- **THEN** `status` is `draft`

### Requirement: Planning artifact directory
The system SHALL provide an `outlines/` directory as the stable home for V0.2 planning artifacts.

#### Scenario: Initialize workspace with planning directory
- **WHEN** a user runs `longgu init` in a new target directory
- **THEN** the system creates `outlines/` alongside `bible/`, `chapters/`, and `runs/`

#### Scenario: Check planning workspace shape
- **WHEN** a user runs a command that requires a valid workspace
- **THEN** the workspace shape check includes `outlines/`
