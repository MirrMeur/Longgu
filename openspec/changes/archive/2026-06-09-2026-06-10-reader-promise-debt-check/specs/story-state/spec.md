## MODIFIED Requirements

### Requirement: State consistency check command
The system SHALL provide `longgu state check` to validate story state ledgers, detect reader promise debt when chapter context is provided, and write reviewable consistency reports.

#### Scenario: Detect overdue active reader promise
- **WHEN** a user runs `longgu state check --chapter 008 --promise-max-age 5`
- **AND** `state/reader-promises.json` contains an active promise opened in chapter `001`
- **THEN** the report status is `needs-review`
- **AND** the issue list contains a warning for that reader promise
- **AND** the Markdown report includes the overdue promise reason

#### Scenario: Omit promise debt check without current chapter
- **WHEN** a user runs `longgu state check` without `--chapter`
- **AND** `state/reader-promises.json` contains active promises
- **THEN** the system does not flag promise age solely from missing chapter context
