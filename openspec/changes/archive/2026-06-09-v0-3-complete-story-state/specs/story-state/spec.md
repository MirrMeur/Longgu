## ADDED Requirements

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
The system SHALL provide `longgu settle chapter --id <id>` to extract validated state deltas from chapter prose and apply them to story state ledgers.

#### Scenario: Apply model-extracted chapter delta
- **WHEN** a user runs `longgu settle chapter --id 001`
- **AND** `chapters/001.md` exists
- **AND** the configured provider returns valid conflict-free state delta JSON
- **THEN** the system validates the returned delta
- **THEN** the system updates the relevant state ledgers by id-based upsert
- **THEN** the system reports the settlement record path

#### Scenario: Apply provided chapter delta
- **WHEN** a user runs `longgu settle chapter --id 001 --delta state/deltas/001.delta.json`
- **AND** `chapters/001.md` exists
- **AND** the provided delta is valid and conflict-free
- **THEN** the system updates the relevant state ledgers by id-based upsert
- **THEN** the system reports the settlement record path

#### Scenario: Missing chapter body
- **WHEN** a user settles chapter `001`
- **AND** `chapters/001.md` does not exist
- **THEN** the system reports the missing chapter
- **THEN** no state ledgers are modified

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
