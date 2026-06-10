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

### Requirement: State inspection command
The system SHALL provide `longgu state inspect` to summarize the current story state ledgers without mutating them.

#### Scenario: Inspect initialized ledgers
- **WHEN** a user runs `longgu state inspect` in a workspace with valid state ledgers
- **THEN** the system displays each ledger name and item count
- **THEN** the system displays each ledger's `updatedAt`

#### Scenario: Reject invalid ledger during inspection
- **WHEN** a state ledger file does not match its schema
- **THEN** the system reports the invalid ledger instead of silently ignoring it

### Requirement: State delta schema
The system SHALL validate chapter settlement inputs against a V0.3 state delta schema before applying any state changes.

#### Scenario: Valid chapter state delta
- **WHEN** a delta file contains `schemaVersion`, `chapterId`, and valid upsert arrays for state ledgers
- **THEN** the system accepts the delta for settlement

#### Scenario: Delta chapter mismatch
- **WHEN** a user runs `longgu settle chapter --id 001 --delta <file>`
- **AND** the delta file contains `chapterId` `002`
- **THEN** the system rejects the delta
- **THEN** no state ledgers are modified

#### Scenario: Duplicate ids in delta
- **WHEN** a delta file contains duplicate ids in the same update array
- **THEN** the system rejects the delta
- **THEN** no state ledgers are modified

### Requirement: Chapter settlement command
The system SHALL apply chapter state deltas in chapter order.

#### Scenario: Batch settle by range
- **WHEN** a user runs state settlement with `--from 001 --to 010`
- **THEN** the system settles chapters in ascending chapter id order
- **AND** each chapter observes ledgers updated by previous settled chapters.

#### Scenario: Batch settle by volume
- **WHEN** a user runs state settlement with `--volume 001`
- **THEN** the system settles existing `chapters/001-*.md` files in ascending chapter id order.

### Requirement: State delta merge safety
The system SHALL merge state deltas by item id and SHALL NOT let a delta replace whole ledger files directly.

#### Scenario: Upsert new state items
- **WHEN** a valid delta contains ids not present in the current ledgers
- **THEN** the system appends those items to the matching ledgers

#### Scenario: Update existing state items
- **WHEN** a valid delta contains an id already present in a mutable ledger
- **THEN** the system replaces that item with the validated incoming item
- **THEN** unrelated items in the same ledger remain unchanged

### Requirement: State conflict detection
The system SHALL reject blocking state conflicts before mutating any state ledger.

#### Scenario: Reject immutable fact rewrite
- **WHEN** a delta attempts to change the text of an existing fact id
- **THEN** the system reports a blocking conflict
- **THEN** no state ledgers are modified

#### Scenario: Reject invalid hook regression
- **WHEN** an existing hook status is `resolved`
- **AND** a delta attempts to set the same hook to `opened`, `mentioned`, or `delayed`
- **THEN** the system reports a blocking conflict
- **THEN** no state ledgers are modified

#### Scenario: Reject invalid reader promise regression
- **WHEN** an existing reader promise status is `paid-off` or `broken`
- **AND** a delta attempts to set the same promise to `active`
- **THEN** the system reports a blocking conflict
- **THEN** no state ledgers are modified

#### Scenario: Reject timeline chapter reassignment
- **WHEN** an existing timeline event id belongs to chapter `001`
- **AND** a delta attempts to assign the same event id to chapter `002`
- **THEN** the system reports a blocking conflict
- **THEN** no state ledgers are modified

### Requirement: State settlement records
The system SHALL persist reviewable settlement records for every successful chapter settlement.

#### Scenario: Successful settlement record
- **WHEN** a chapter settlement succeeds
- **THEN** the system writes a settlement directory under `state/settlements/`
- **THEN** the directory contains `delta.json`, `before.json`, `after.json`, `diff.json`, and `metadata.json`
- **THEN** `diff.json` lists added, updated, unchanged, and affected ids per ledger

#### Scenario: Model-generated settlement record
- **WHEN** a chapter settlement uses provider extraction
- **THEN** the settlement directory contains `prompt.md` and `model-output.txt`
- **THEN** `metadata.json` records that the delta source was `model`

#### Scenario: Failed settlement leaves no record
- **WHEN** a settlement fails validation or conflict checks
- **THEN** the system does not write a success settlement record
- **THEN** no state ledgers are modified

### Requirement: Model state settlement retry
The system SHALL retry model-generated state delta extraction once when the first model output is invalid or conflict-blocked.

#### Scenario: Retry invalid model delta
- **WHEN** a user runs `longgu settle chapter --id 001`
- **AND** the first provider output is invalid JSON or does not match the state delta schema
- **THEN** the system asks the provider to output the delta again with the validation error included
- **THEN** the retry prompt includes only a bounded excerpt of the rejected output
- **THEN** no state ledgers are modified until a valid conflict-free delta is produced

#### Scenario: Retry conflict-blocked model delta
- **WHEN** a model-generated delta attempts a blocking state conflict
- **THEN** the system asks the provider to output a corrected delta with the conflict reason included
- **THEN** the retry prompt includes only a bounded excerpt of the rejected output
- **THEN** no state ledgers are modified until a valid conflict-free delta is produced

#### Scenario: Retry success record
- **WHEN** a retry produces a valid conflict-free delta
- **THEN** the system applies that delta
- **THEN** the settlement directory contains `model-attempts.json` with rejected and accepted attempts

#### Scenario: Retry exhausted
- **WHEN** both model attempts fail validation or conflict checks
- **THEN** the system reports the final error
- **THEN** no state ledgers are modified
- **THEN** no success settlement record is written

### Requirement: State consistency check command
The system SHALL check state ledgers for cross-ledger consistency and reader promise debt.

#### Scenario: Cross-volume reader promise age
- **WHEN** a reader promise was opened in chapter `001-010`
- **AND** the current chapter is `002-001`
- **THEN** the system treats `002-001` as later than `001-010`
- **AND** overdue promise checks use a positive cross-volume age.

#### Scenario: Timeline tie-break uses chapter ordering
- **WHEN** timeline events have equal `order` values
- **THEN** the system sorts them by natural chapter id order
- **AND** chapter `9` is ordered before chapter `10`.

