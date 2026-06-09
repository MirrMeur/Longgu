## ADDED Requirements

### Requirement: State consistency check command
The system SHALL provide `longgu state check` to validate story state ledgers and write reviewable consistency reports.

#### Scenario: Write state check report
- **WHEN** a user runs `longgu state check` in a workspace with valid state ledgers
- **THEN** the system writes `state/checks/<timestamp>.json`
- **AND** the system writes `state/checks/<timestamp>.md`
- **AND** the JSON report contains schema version, status, issue list, checked ledger files, and generated time

#### Scenario: Detect dangling state references
- **WHEN** resources or relationships reference missing character ids
- **THEN** the report status is `needs-review`
- **AND** the issue list identifies the ledger, item id, severity, and reason

#### Scenario: Pass clean state
- **WHEN** all ledgers validate and no consistency issue is found
- **THEN** the report status is `passed`
