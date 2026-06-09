## MODIFIED Requirements

### Requirement: Chapter plan readiness audit
The system SHALL provide a deterministic chapter plan readiness audit before chapter drafting, and drafting commands SHALL use its result as a gate when a matching chapter card exists.

#### Scenario: Failed chapter plan audit blocks drafting
- **WHEN** `audits/chapters-001.plan-audit.json` has status `needs-revision` or `blocked`
- **AND** a user drafts a chapter whose card belongs to `outlines/chapters-001.draft.json`
- **THEN** the drafting command reports the failed plan audit
- **AND** no chapter file is written
