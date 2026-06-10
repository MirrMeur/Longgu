## MODIFIED Requirements

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
