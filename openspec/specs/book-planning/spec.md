# book-planning Specification

## Purpose
TBD - created by archiving change v0-2-plan-book-draft. Update Purpose after archive.
## Requirements
### Requirement: Book planning CLI command
The system SHALL provide V0.2 planning commands that create structured draft artifacts from the current Longgu workspace inputs.

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

### Requirement: Book draft schema
The system SHALL validate generated planning drafts against structured schemas before writing them.

#### Scenario: Chapters draft contains V0.2 planning fields
- **WHEN** the system creates a chapters draft
- **THEN** the draft contains `schemaVersion`, `status`, `volumeId`, `genre`, `volumePlanSource`, `chapterCount`, `chapters`, `sourceFiles`, and `generatedAt`
- **THEN** each chapter card contains `chapterId`, `title`, `goal`, `conflict`, `payoff`, `informationGain`, and `endingHook`
- **THEN** each chapter card field is non-empty
- **THEN** `status` is `draft`

#### Scenario: Draft contains V0.2 planning fields
- **WHEN** the system creates a book draft
- **THEN** the draft contains `schemaVersion`, `status`, `title`, `genre`, `premise`, `protagonist`, `coreHook`, `conflictLadder`, `powerSystem`, `readerPromises`, `retentionRisks`, and `sourceFiles`
- **THEN** `status` is `draft`

#### Scenario: Volume draft contains V0.2 planning fields
- **WHEN** the system creates a volume draft
- **THEN** the draft contains `schemaVersion`, `status`, `volumeId`, `title`, `genre`, `bookPlanSource`, `volumeGoal`, `primaryAntagonist`, `conflictEscalation`, `resourceChanges`, `keyPayoffs`, `endingHook`, `chapterSeedCount`, and `sourceFiles`
- **THEN** `status` is `draft`

### Requirement: Planning artifact directory
The system SHALL provide an `outlines/` directory as the stable home for V0.2 planning artifacts.

#### Scenario: Initialize workspace with planning directory
- **WHEN** a user runs `longgu init` in a new target directory
- **THEN** the system creates `outlines/` alongside `bible/`, `chapters/`, and `runs/`

#### Scenario: Check planning workspace shape
- **WHEN** a user runs a command that requires a valid workspace
- **THEN** the workspace shape check includes `outlines/`
