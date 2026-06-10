## MODIFIED Requirements

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

### Requirement: Chapter settlement command
The system SHALL apply chapter state deltas in chapter order.

#### Scenario: Batch settle by range
- **WHEN** a user runs state settlement with `--from 001 --to 010`
- **THEN** the system settles chapters in ascending chapter id order
- **AND** each chapter observes ledgers updated by previous settled chapters.

#### Scenario: Batch settle by volume
- **WHEN** a user runs state settlement with `--volume 001`
- **THEN** the system settles existing `chapters/001-*.md` files in ascending chapter id order.
