# book-planning Specification

## Purpose
TBD - created by archiving change v0-2-plan-book-draft. Update Purpose after archive.
## Requirements
### Requirement: Book planning CLI command
The system SHALL provide planning commands that create structured draft artifacts from the current Longgu workspace inputs, either deterministically or through the configured planning model.

#### Scenario: Create a chapters draft
- **WHEN** a user runs `longgu plan chapters --volume 001` in a valid workspace with `outlines/volume-001.draft.json`
- **AND** `audits/volume-001.plan-audit.json` exists with status `passed`
- **THEN** the system reads `outlines/volume-001.draft.json`
- **THEN** the system writes `outlines/chapters-001.draft.json`
- **THEN** the draft records the volume id, genre, upstream volume source, and editable chapter cards

#### Scenario: Missing upstream volume audit blocks chapter planning
- **WHEN** a user runs `longgu plan chapters --volume 001` in a valid workspace with `outlines/volume-001.draft.json`
- **AND** `audits/volume-001.plan-audit.json` does not exist
- **THEN** the system reports that volume-plan audit is required
- **AND** no chapters draft is written

#### Scenario: Failed upstream volume audit blocks chapter planning
- **WHEN** `audits/volume-001.plan-audit.json` has status `needs-revision` or `blocked`
- **AND** a user runs `longgu plan chapters --volume 001`
- **THEN** the system reports the failed volume-plan audit
- **AND** no chapters draft is written

#### Scenario: Explicitly skip volume audit gate for chapter planning
- **WHEN** a user runs `longgu plan chapters --volume 001 --skip-volume-audit`
- **AND** `outlines/volume-001.draft.json` exists
- **THEN** the system bypasses the volume-plan audit gate
- **AND** the system writes `outlines/chapters-001.draft.json`

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
- **AND** `audits/volume-001.plan-audit.json` exists with status `passed`
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
- **AND** `audits/volume-001.plan-audit.json` exists with status `passed`
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
- **AND** `audits/volume-001.plan-audit.json` exists with status `passed`
- **THEN** the system routes generation through the `planning` model route
- **THEN** the system validates the provider JSON against the chapters draft schema
- **THEN** the system writes `outlines/chapters-001.draft.json`
- **AND** the system writes a planning run record under `runs/`

#### Scenario: Deterministic planning remains default
- **WHEN** a user runs a planning command without `--model`
- **THEN** the system creates the same editable deterministic draft behavior as before

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
- **THEN** the drafting command reports the failed plan audit
- **AND** no chapter file is written

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
