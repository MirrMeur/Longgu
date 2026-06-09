## MODIFIED Requirements

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate or import chapter prose, and it SHALL require a passed chapter-plan audit when a matching chapter card exists unless explicitly skipped.

#### Scenario: Block drafting when chapter plan audit is missing
- **WHEN** a user runs `longgu write chapter --id 001-001`
- **AND** `outlines/chapters-001.draft.json` contains a card for chapter `001-001`
- **AND** `audits/chapters-001.plan-audit.json` does not exist
- **THEN** the system reports that chapter-plan audit is required
- **AND** no chapter file is written

#### Scenario: Allow drafting after passed chapter plan audit
- **WHEN** a user runs `longgu write chapter --id 001-001`
- **AND** a matching chapter card exists
- **AND** `audits/chapters-001.plan-audit.json` has status `passed`
- **THEN** drafting may proceed

#### Scenario: Explicitly skip chapter plan audit gate
- **WHEN** a user runs `longgu write chapter --id 001-001 --skip-plan-audit`
- **AND** a matching chapter card exists
- **THEN** the system bypasses the chapter-plan audit gate
