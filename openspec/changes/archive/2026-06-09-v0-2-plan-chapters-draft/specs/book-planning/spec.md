## MODIFIED Requirements

### Requirement: Book planning CLI command
The system SHALL provide V0.2 planning commands that create structured draft artifacts from the current Longgu workspace inputs.

#### Scenario: Create a chapters draft
- **WHEN** a user runs `longgu plan chapters --volume 001` in a valid workspace with `outlines/volume-001.draft.json`
- **THEN** the system reads `outlines/volume-001.draft.json`
- **THEN** the system writes `outlines/chapters-001.draft.json`
- **THEN** the draft records the volume id, genre, upstream volume source, and editable chapter cards

#### Scenario: Refuse to overwrite an existing chapters draft
- **WHEN** `outlines/chapters-001.draft.json` already exists
- **AND** the user runs `longgu plan chapters --volume 001` without `--force`
- **THEN** the system reports that the chapters draft already exists
- **THEN** the existing draft remains unchanged

#### Scenario: Force regenerate an existing chapters draft
- **WHEN** `outlines/chapters-001.draft.json` already exists
- **AND** the user runs `longgu plan chapters --volume 001 --force`
- **THEN** the system replaces `outlines/chapters-001.draft.json` with a newly generated draft

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
- **THEN** `status` is `draft`
