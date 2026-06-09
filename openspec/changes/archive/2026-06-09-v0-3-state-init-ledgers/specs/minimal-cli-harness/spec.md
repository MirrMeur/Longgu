## MODIFIED Requirements

### Requirement: Novel workspace initialization
The system SHALL initialize a Longgu novel workspace with the minimum file and directory structure required for V0.1 writing, V0.2 planning, and V0.3 state ledgers.

#### Scenario: Initialize workspace with state directory
- **WHEN** a user runs `longgu init`
- **THEN** the workspace contains a `state/` directory

#### Scenario: Check state workspace shape
- **WHEN** a user runs a Longgu command that checks workspace shape
- **THEN** missing `state/` is reported as a missing workspace path
