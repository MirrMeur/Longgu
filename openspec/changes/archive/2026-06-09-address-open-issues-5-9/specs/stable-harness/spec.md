## MODIFIED Requirements

### Requirement: Stable command discovery
The system SHALL expose stable command groups through CLI help.

#### Scenario: Top-level help
- **WHEN** a user runs `longgu --help`
- **THEN** the help output lists the stable command groups for planning, state, audit, revision, genre cards, context, models, costs, feedback, experiments, and runs

### Requirement: V1.0 usage documentation
The system SHALL document the V1.0 workflow.

#### Scenario: Read usage guide
- **WHEN** a user reads the project README
- **THEN** they can find a concise step-by-step quickstart covering init, configuration, planning, context, writing, auditing, revising, and settling
- **THEN** they can find which major capabilities are usable, partial, or planned

## ADDED Requirements

### Requirement: CLI guidance
The system SHALL provide concise next-step guidance after artifact-producing commands.

#### Scenario: Planning command guidance
- **WHEN** a planning command creates an artifact
- **THEN** the command output includes the next review or follow-up command

#### Scenario: Write command guidance
- **WHEN** `longgu write chapter` creates a chapter
- **THEN** the command output recommends auditing or editing the generated chapter

### Requirement: Human feedback capture
The system SHALL provide a file-first way to record human feedback for generated chapters.

#### Scenario: Record chapter feedback
- **WHEN** a user runs `longgu feedback chapter --id 001 --score 6 --comment "情节推进太慢"`
- **THEN** the system writes feedback to `feedback/001.feedback.json`
- **THEN** later context packs may include that feedback as generation guidance
