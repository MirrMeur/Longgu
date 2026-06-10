## MODIFIED Requirements

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
