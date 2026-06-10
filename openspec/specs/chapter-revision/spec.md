# chapter-revision Specification

## Purpose
Defines the V0.5 Longgu chapter revision loop: audit-driven revision commands, revision modes, revision history records, line diffs, state-safe rewriting, and deterministic post-audit critical-count checks.
## Requirements
### Requirement: Chapter revision command
The system SHALL provide `longgu revise chapter --id <id>` to revise a chapter using its V0.4 audit result and leave model run evidence when provider generation is used.

#### Scenario: Revise audited chapter
- **WHEN** a user runs `longgu revise chapter --id 001`
- **AND** `chapters/001.md` exists
- **AND** `audits/001.audit.json` exists
- **AND** provider credentials are available
- **THEN** the system asks the provider for revised chapter Markdown
- **THEN** the system writes a revision record
- **THEN** the system replaces `chapters/001.md` with the revised chapter

#### Scenario: Revise chapter with provided input
- **WHEN** a user runs `longgu revise chapter --id 001 --input revisions/001.candidate.md`
- **AND** `chapters/001.md` exists
- **AND** `audits/001.audit.json` exists
- **THEN** the system reads the revised Markdown from the input path without making a provider request
- **THEN** the system writes a revision record
- **THEN** the system replaces `chapters/001.md` with the revised chapter

#### Scenario: Missing audit
- **WHEN** a user revises chapter `001`
- **AND** `audits/001.audit.json` does not exist
- **THEN** the system reports the missing audit
- **THEN** the chapter is not modified

#### Scenario: Model-backed revision writes run evidence
- **WHEN** a user runs `longgu revise chapter --id 001` without `--input`
- **THEN** the system uses the `revise` model route
- **THEN** the system writes a run record under `runs/`
- **AND** the run metadata records task `revise`, selected model profile, attempts, fallback count, token estimates, and estimated cost
- **AND** the run record context includes the non-empty original chapter body used for revision generation

#### Scenario: Provided revision input remains provider-free
- **WHEN** a user runs `longgu revise chapter --id 001 --input revisions/001.candidate.md`
- **THEN** the system does not create a model run record for revision generation

### Requirement: Revision modes
The system SHALL support `spot-fix`, `polish`, `rewrite-scene`, and `rewrite-chapter` revision modes.

#### Scenario: Default warning mode
- **WHEN** an audit contains warning issues and no critical issues
- **AND** the user does not specify `--mode`
- **THEN** the selected mode is `spot-fix`

#### Scenario: Default critical mode
- **WHEN** an audit contains critical issues
- **AND** the user does not specify `--mode`
- **THEN** the selected mode is `rewrite-scene`

#### Scenario: Explicit mode
- **WHEN** the user supplies `--mode polish`
- **THEN** the selected mode is `polish`

### Requirement: Revision records
The system SHALL persist reviewable revision history for every successful chapter revision.

#### Scenario: Successful revision record
- **WHEN** a chapter revision succeeds
- **THEN** the system writes a directory under `revisions/<chapter-id>/`
- **THEN** the directory contains `before.md`, `after.md`, `diff.md`, `metadata.json`, `prompt.md`, and `model-output.md`
- **THEN** `metadata.json` records mode, audit source, selected issue ids, and timestamps

### Requirement: Revision diff
The system SHALL preserve a readable diff between the original and revised chapter.

#### Scenario: Diff contains changes
- **WHEN** a revision changes chapter text
- **THEN** `diff.md` contains removed and added lines

#### Scenario: Identical output rejected
- **WHEN** provider output is identical to the existing chapter
- **THEN** the revision fails
- **THEN** the chapter is not modified

### Requirement: State safety during revision
The system SHALL NOT mutate story state ledgers during chapter revision.

#### Scenario: Revision uses state as constraint only
- **WHEN** a chapter revision succeeds
- **THEN** files under `state/` are not modified by the revision command

### Requirement: Critical reduction check
The system SHALL support deterministic post-audit comparison for critical issue reduction.

#### Scenario: Post-audit critical count decreases
- **WHEN** a revision starts with critical issues
- **AND** `--post-audit <path>` is provided
- **AND** the post-audit has fewer critical issues than the pre-audit
- **THEN** metadata records `criticalCountDecreased` as `true`

#### Scenario: Post-audit critical count does not decrease
- **WHEN** a revision starts with critical issues
- **AND** `--post-audit <path>` is provided
- **AND** the post-audit has the same or more critical issues
- **THEN** the revision fails
- **THEN** the chapter is not modified

