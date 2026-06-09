## MODIFIED Requirements

### Requirement: Book planning CLI command
The system SHALL provide V0.2 planning commands that create structured draft artifacts from the current Longgu workspace inputs.

#### Scenario: Create a book draft
- **WHEN** a user runs `longgu plan book` in a valid workspace
- **THEN** the system reads `longgu.yaml` and existing `bible/*.md` files
- **THEN** the system writes `outlines/book.draft.json`
- **THEN** the draft records the title, genre, source files, and editable planning fields

#### Scenario: Refuse to overwrite an existing book draft
- **WHEN** `outlines/book.draft.json` already exists
- **AND** the user runs `longgu plan book` without `--force`
- **THEN** the system reports that the draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Force regenerate an existing book draft
- **WHEN** `outlines/book.draft.json` already exists
- **AND** the user runs `longgu plan book --force`
- **THEN** the system replaces `outlines/book.draft.json` with a newly generated draft

#### Scenario: Create a volume draft
- **WHEN** a user runs `longgu plan volume --id 001` in a valid workspace with `outlines/book.draft.json`
- **THEN** the system reads `outlines/book.draft.json`
- **THEN** the system writes `outlines/volume-001.draft.json`
- **THEN** the draft records the volume id, title, genre, upstream book source, and editable volume planning fields

#### Scenario: Refuse to overwrite an existing volume draft
- **WHEN** `outlines/volume-001.draft.json` already exists
- **AND** the user runs `longgu plan volume --id 001` without `--force`
- **THEN** the system reports that the volume draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Force regenerate an existing volume draft
- **WHEN** `outlines/volume-001.draft.json` already exists
- **AND** the user runs `longgu plan volume --id 001 --force`
- **THEN** the system replaces `outlines/volume-001.draft.json` with a newly generated draft

#### Scenario: Missing upstream book draft
- **WHEN** a user runs `longgu plan volume --id 001` before `outlines/book.draft.json` exists
- **THEN** the system reports that `longgu plan book` must be run first
- **THEN** no volume draft is written

### Requirement: Book draft schema
The system SHALL validate generated planning drafts against structured schemas before writing them.

#### Scenario: Draft contains V0.2 planning fields
- **WHEN** the system creates a book draft
- **THEN** the draft contains `schemaVersion`, `status`, `title`, `genre`, `premise`, `protagonist`, `coreHook`, `conflictLadder`, `powerSystem`, `readerPromises`, `retentionRisks`, and `sourceFiles`
- **THEN** `status` is `draft`

#### Scenario: Volume draft contains V0.2 planning fields
- **WHEN** the system creates a volume draft
- **THEN** the draft contains `schemaVersion`, `status`, `volumeId`, `title`, `genre`, `bookPlanSource`, `volumeGoal`, `primaryAntagonist`, `conflictEscalation`, `resourceChanges`, `keyPayoffs`, `endingHook`, `chapterSeedCount`, and `sourceFiles`
- **THEN** `status` is `draft`
