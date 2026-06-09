## MODIFIED Requirements

### Requirement: Chapter audit schema
The system SHALL validate every final chapter audit against a structured V0.4 schema, including a chapter contract section that exposes reader-retention mechanics.

#### Scenario: Final audit shape
- **WHEN** an audit succeeds
- **THEN** `audits/<id>.audit.json` contains `schemaVersion`, `chapterId`, `genre`, `status`, `summary`, `scores`, `issues`, `contract`, `reviseQueue`, `blocked`, `sourceFiles`, and `generatedAt`
- **THEN** `schemaVersion` is `longgu.chapter-audit.v0.4`

#### Scenario: Chapter contract shape
- **WHEN** an audit succeeds
- **THEN** `contract` contains `status`, `missing`, `startHook`, `protagonistGoal`, `obstacle`, `turn`, `payoff`, `tailHook`, and `diagnosis`
- **THEN** `status` is either `complete` or `incomplete`
- **THEN** `missing` contains only missing contract field ids

#### Scenario: Legacy raw audit input without contract
- **WHEN** a user provides valid raw audit input that does not include `contract`
- **THEN** the system still writes a final audit
- **AND** the final audit has `contract.status` set to `incomplete`
- **AND** the final audit lists all required contract fields in `contract.missing`

### Requirement: Chapter audit command
The system SHALL provide `longgu audit chapter --id <id>` to create structured chapter audit artifacts and leave model run evidence when provider generation is used.

#### Scenario: Audit command reports contract status
- **WHEN** a user runs `longgu audit chapter --id 001`
- **AND** audit generation succeeds
- **THEN** the CLI output includes the normalized chapter contract status

### Requirement: Audit Markdown projection
The system SHALL create a human-readable Markdown projection for every successful final audit.

#### Scenario: Markdown report includes chapter contract
- **WHEN** an audit succeeds
- **THEN** `audits/<id>.audit.md` includes chapter contract status, missing fields, start hook, protagonist goal, obstacle, turn, payoff, tail hook, and diagnosis
- **THEN** the JSON audit remains the source of truth
