# story-state Specification

## Purpose
Defines the V0.3 Longgu story state ledger foundation: baseline state files, schema validation, and safe initialization behavior for future state inspection, chapter settlement, delta merge, and consistency checks.
## Requirements
### Requirement: State ledger initialization command
The system SHALL provide a V0.3 command that initializes machine-checkable story state ledgers in a Longgu workspace.

#### Scenario: Create baseline state ledgers
- **WHEN** a user runs `longgu state init` in a valid workspace
- **THEN** the system creates `state/truth.json`
- **THEN** the system creates `state/characters.json`
- **THEN** the system creates `state/timeline.json`
- **THEN** the system creates `state/hooks.json`
- **THEN** the system creates `state/reader-promises.json`
- **THEN** the system creates `state/resources.json`
- **THEN** each ledger contains a schema version, ledger type, empty entries, and `updatedAt`

#### Scenario: Refuse to overwrite existing state ledgers
- **WHEN** one or more state ledger files already exist
- **AND** the user runs `longgu state init` without `--force`
- **THEN** the system reports that state ledgers already exist
- **THEN** existing ledger files remain unchanged

#### Scenario: Force regenerate existing state ledgers
- **WHEN** one or more state ledger files already exist
- **AND** the user runs `longgu state init --force`
- **THEN** the system replaces the baseline state ledgers with newly initialized ledgers

### Requirement: State ledger schemas
The system SHALL validate initialized story state ledgers against structured schemas before writing them.

#### Scenario: Baseline ledger shape
- **WHEN** the system initializes state ledgers
- **THEN** `truth.json` contains `schemaVersion`, `ledger`, `facts`, and `updatedAt`
- **THEN** `characters.json` contains `schemaVersion`, `ledger`, `characters`, and `updatedAt`
- **THEN** `timeline.json` contains `schemaVersion`, `ledger`, `events`, and `updatedAt`
- **THEN** `hooks.json` contains `schemaVersion`, `ledger`, `hooks`, and `updatedAt`
- **THEN** `reader-promises.json` contains `schemaVersion`, `ledger`, `promises`, and `updatedAt`
- **THEN** `resources.json` contains `schemaVersion`, `ledger`, `resources`, and `updatedAt`
