## MODIFIED Requirements

### Requirement: State consistency check command
The system SHALL provide `longgu state check` to validate story state ledgers, detect reader promise debt when chapter context is provided, and write reviewable consistency reports.

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

#### Scenario: Detect overdue active reader promise
- **WHEN** a user runs `longgu state check --chapter 008 --promise-max-age 5`
- **AND** `state/reader-promises.json` contains an active promise opened in chapter `001`
- **THEN** the report status is `needs-review`
- **AND** the issue list contains a warning for that reader promise
- **AND** the Markdown report includes the overdue promise reason

#### Scenario: Detect overdue active reader promise with generated chapter ids
- **WHEN** a user runs `longgu state check --chapter v1-050 --promise-max-age 5`
- **AND** `state/reader-promises.json` contains an active promise opened in chapter `v1-001`
- **THEN** the report status is `needs-review`
- **AND** the issue list contains a warning for that reader promise

#### Scenario: Omit promise debt check without current chapter
- **WHEN** a user runs `longgu state check` without `--chapter`
- **AND** `state/reader-promises.json` contains active promises
- **THEN** the system does not flag promise age solely from missing chapter context
