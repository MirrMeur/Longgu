# book-planning Specification

## Purpose
TBD - created by archiving change v0-2-plan-book-draft. Update Purpose after archive.
## Requirements
### Requirement: Book planning CLI command
The system SHALL create deterministic planning drafts that are useful without a provider.

#### Scenario: Scaffold book draft from bible
- **WHEN** a user runs `longgu plan book --scaffold`
- **THEN** the system extracts concrete fields from `bible/*.md`
- **AND** fills core hook, reader promises, conflict ladder, power system, and retention risks with non-empty scaffold values where source text exists.

#### Scenario: Scaffold volume draft from bible and book plan
- **WHEN** a user runs `longgu plan volume --id 001 --scaffold`
- **THEN** the system derives volume goal, antagonist pressure, key payoffs, resource changes, and ending hook from available planning and bible text.

#### Scenario: Scaffold chapter cards
- **WHEN** a user runs `longgu plan chapters --volume 001 --scaffold`
- **THEN** each generated chapter card has concrete goal, conflict, payoff, information gain, ending hook, and target words.

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

### Requirement: Planning artifact directory
The system SHALL provide an `outlines/` directory as the stable home for V0.2 planning artifacts.

#### Scenario: Initialize workspace with planning directory
- **WHEN** a user runs `longgu init` in a new target directory
- **THEN** the system creates `outlines/` alongside `bible/`, `chapters/`, and `runs/`

#### Scenario: Check planning workspace shape
- **WHEN** a user runs a command that requires a valid workspace
- **THEN** the workspace shape check includes `outlines/`

### Requirement: Chapter plan readiness audit
The system SHALL provide a deterministic chapter plan readiness audit before chapter drafting, and drafting commands SHALL use its result as a gate when a matching chapter card exists.

#### Scenario: Audit chapter plan
- **WHEN** a user runs `longgu audit chapter-plan --volume 001`
- **AND** `outlines/chapters-001.draft.json` exists
- **THEN** the system validates the chapter cards for planning readiness
- **AND** the system writes `audits/chapters-001.plan-audit.json`
- **AND** the system writes `audits/chapters-001.plan-audit.md`

#### Scenario: Detect weak chapter cards
- **WHEN** a chapter card has missing or placeholder goal, conflict, payoff, information gain, or ending hook
- **THEN** the chapter plan audit records a warning issue for that card
- **AND** the audit status is `needs-revision`

#### Scenario: Detect blocking chapter count mismatch
- **WHEN** the chapter plan declares a chapter count that does not match the number of chapter cards
- **THEN** the chapter plan audit records a critical issue
- **AND** the audit status is `blocked`

#### Scenario: Missing chapter plan draft
- **WHEN** a user runs `longgu audit chapter-plan --volume 001`
- **AND** `outlines/chapters-001.draft.json` does not exist
- **THEN** the system reports the missing chapter plan
- **AND** no final audit artifacts are written
#### Scenario: Failed chapter plan audit blocks drafting
- **WHEN** `audits/chapters-001.plan-audit.json` has status `needs-revision` or `blocked`
- **AND** a user drafts a chapter whose card belongs to `outlines/chapters-001.draft.json`
- **THEN** the drafting command reports the failed plan audit and mentions the force bypass
- **AND** no chapter file is written

#### Scenario: Force bypass failed chapter plan audit
- **WHEN** `audits/chapters-001.plan-audit.json` has status `needs-revision` or `blocked`
- **AND** a user drafts a matching planned chapter with `--force`
- **THEN** the drafting command bypasses the failed chapter-plan audit gate

### Requirement: Volume plan readiness audit
The system SHALL provide a deterministic volume plan readiness audit before chapter planning.

#### Scenario: Audit volume plan
- **WHEN** a user runs `longgu audit volume-plan --id 001`
- **AND** `outlines/volume-001.draft.json` exists
- **THEN** the system validates the volume promise, antagonist pressure, conflict escalation, payoff rhythm, chapter seed count, and ending hook for planning readiness
- **AND** the system writes `audits/volume-001.plan-audit.json`
- **AND** the system writes `audits/volume-001.plan-audit.md`

#### Scenario: Detect weak volume promise
- **WHEN** a volume plan has missing or placeholder volume goal, primary antagonist, key payoff, ending hook, or escalation pressure/payoff
- **THEN** the volume plan audit records warning issues
- **AND** the audit status is `needs-revision`

#### Scenario: Detect blocking volume structure
- **WHEN** a volume plan has fewer than three conflict escalation steps or a non-positive chapter seed count
- **THEN** the volume plan audit records a critical issue
- **AND** the audit status is `blocked`

#### Scenario: Missing volume plan draft
- **WHEN** a user runs `longgu audit volume-plan --id 001`
- **AND** `outlines/volume-001.draft.json` does not exist
- **THEN** the system reports the missing volume plan
- **AND** no final audit artifacts are written
