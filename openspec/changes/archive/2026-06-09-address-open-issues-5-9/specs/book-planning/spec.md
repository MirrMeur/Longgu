## MODIFIED Requirements

### Requirement: Book draft schema
The system SHALL validate generated planning drafts against structured schemas before writing them.

#### Scenario: Chapters draft contains V0.2 planning fields
- **WHEN** the system creates a chapters draft
- **THEN** the draft contains `schemaVersion`, `status`, `volumeId`, `genre`, `volumePlanSource`, `chapterCount`, `chapters`, `sourceFiles`, and `generatedAt`
- **THEN** each chapter card contains `chapterId`, `title`, `goal`, `conflict`, `payoff`, `informationGain`, and `endingHook`
- **THEN** each chapter card field is non-empty
- **THEN** `status` is `draft`
