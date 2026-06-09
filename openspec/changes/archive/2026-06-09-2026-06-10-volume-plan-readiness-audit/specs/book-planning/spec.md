## ADDED Requirements

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
