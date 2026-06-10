## MODIFIED Requirements

### Requirement: Book draft schema
The system SHALL validate generated planning drafts against structured schemas before writing them.

#### Scenario: Chapters draft contains V0.2 planning fields
- **WHEN** the system creates a chapters draft
- **THEN** the draft contains `schemaVersion`, `status`, `volumeId`, `genre`, `volumePlanSource`, `chapterCount`, `chapters`, `sourceFiles`, and `generatedAt`
- **THEN** each chapter card contains `chapterId`, `title`, `goal`, `conflict`, `payoff`, `informationGain`, `endingHook`, and optional `targetWords`
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
