# chapter-audit Specification

## Purpose
Defines the V0.4 Longgu chapter audit system: structured chapter quality reports, severity normalization, prose metrics, gate status, revise queue derivation, Markdown projection, and provider audit retry behavior.
## Requirements
### Requirement: Chapter audit command
The system SHALL provide `longgu audit chapter --id <id>` to create structured chapter audit artifacts and leave model run evidence when provider generation is used.

#### Scenario: Audit chapter with provider
- **WHEN** a user runs `longgu audit chapter --id 001`
- **AND** `chapters/001.md` exists
- **AND** provider credentials are available
- **THEN** the system asks the provider for structured chapter audit JSON
- **THEN** the system writes `audits/001.audit.json`
- **THEN** the system writes `audits/001.audit.md`

#### Scenario: Audit chapter with provided input
- **WHEN** a user runs `longgu audit chapter --id 001 --input audits/001.raw-audit.json`
- **AND** the input is valid
- **THEN** the system validates and normalizes the input without making a provider request
- **THEN** the system writes `audits/001.audit.json` and `audits/001.audit.md`

#### Scenario: Missing chapter
- **WHEN** a user audits chapter `001`
- **AND** `chapters/001.md` does not exist
- **THEN** the system reports the missing chapter
- **THEN** no final audit artifacts are written

#### Scenario: Model-backed audit writes run evidence
- **WHEN** a user runs `longgu audit chapter --id 001` without `--input`
- **THEN** the system uses the `audit` model route
- **AND** the system writes a run record under `runs/`
- **AND** the run metadata records task `audit`, selected model profile, attempts, fallback count, token estimates, and estimated cost

#### Scenario: Provided audit input remains provider-free
- **WHEN** a user runs `longgu audit chapter --id 001 --input audits/raw.json`
- **THEN** the system does not create a model run record for audit generation

#### Scenario: Audit command reports contract status
- **WHEN** a user runs `longgu audit chapter --id 001`
- **AND** audit generation succeeds
- **THEN** the CLI output includes the normalized chapter contract status

### Requirement: Chapter audit schema
The system SHALL validate every final chapter audit against a structured V0.4 schema, including a chapter contract section that exposes reader-retention mechanics.

#### Scenario: Final audit shape
- **WHEN** an audit succeeds
- **THEN** `audits/<id>.audit.json` contains `schemaVersion`, `chapterId`, `genre`, `status`, `summary`, `scores`, `issues`, `contract`, `reviseQueue`, `blocked`, `sourceFiles`, and `generatedAt`
- **THEN** `schemaVersion` is `longgu.chapter-audit.v0.4`

#### Scenario: Issue shape
- **WHEN** an audit issue is written
- **THEN** it contains `id`, `severity`, `source`, `dimension`, `location`, `reason`, and `fix`
- **THEN** `severity` is one of `critical`, `warning`, or `info`

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

### Requirement: Checker severity normalization
The system SHALL normalize checker-style priorities into Longgu audit severities.

#### Scenario: Priority mapping
- **WHEN** an audit issue has checker priority `P0`
- **THEN** the final issue severity is `critical`
- **WHEN** an audit issue has checker priority `P1`
- **THEN** the final issue severity is `warning`
- **WHEN** an audit issue has checker priority `P2`
- **THEN** the final issue severity is `info`

### Requirement: Chapter audit dimensions
The system SHALL support the first V0.4 audit dimensions from the roadmap.

#### Scenario: Supported dimensions
- **WHEN** a final audit is produced
- **THEN** issues may use dimensions for role OOC, timeline conflict, setting conflict, power or resource collapse, hook omission, weak payoff, weak chapter ending hook, summary-like prose, AI explanatory tone, cliche density, information overreach, and chapter goal drift

### Requirement: Prose audit metrics
The system SHALL include prose quality metrics derived from the prose checker domain.

#### Scenario: Prose metric shape
- **WHEN** a final audit is produced
- **THEN** `scores` contains `aiFlavor`, `scenePressure`, `characterVoice`, and `readability`
- **THEN** each score is a number from 0 to 10

### Requirement: Audit gating
The system SHALL derive gate status from issue severity.

#### Scenario: Critical issues block advancement
- **WHEN** an audit contains one or more `critical` issues
- **THEN** `blocked` is `true`
- **THEN** `status` is `blocked`

#### Scenario: Warning issues enter revise queue
- **WHEN** an audit contains `warning` issues and no `critical` issues
- **THEN** `status` is `needs-revision`
- **THEN** `reviseQueue` contains warning issue ids

#### Scenario: No blocking or warning issues pass
- **WHEN** an audit contains no `critical` or `warning` issues
- **THEN** `blocked` is `false`
- **THEN** `status` is `passed`

### Requirement: Audit Markdown projection
The system SHALL create a human-readable Markdown projection for every successful final audit.

#### Scenario: Markdown report
- **WHEN** an audit succeeds
- **THEN** `audits/<id>.audit.md` includes the chapter id, status, blocked flag, score summary, and issue list
- **THEN** the JSON audit remains the source of truth

#### Scenario: Markdown report includes chapter contract
- **WHEN** an audit succeeds
- **THEN** `audits/<id>.audit.md` includes chapter contract status, missing fields, start hook, protagonist goal, obstacle, turn, payoff, tail hook, and diagnosis
- **THEN** the JSON audit remains the source of truth

### Requirement: Provider audit retry
The system SHALL retry provider audit extraction once when the first provider output is not valid audit JSON.

#### Scenario: Retry invalid provider audit
- **WHEN** the first provider audit output fails JSON parsing or schema validation
- **THEN** the system asks the provider to output the audit again with the validation error included
- **THEN** no final audit artifacts are written until a valid audit is produced

#### Scenario: Retry exhausted
- **WHEN** both provider audit attempts fail validation
- **THEN** the system reports the final error
- **THEN** no final audit JSON or Markdown is written
