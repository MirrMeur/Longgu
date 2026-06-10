# stable-harness Specification

## Purpose
TBD - created by archiving change v1-0-stable-harness. Update Purpose after archive.
## Requirements
### Requirement: Stable release version
The system SHALL expose V1.0 release metadata.

#### Scenario: CLI version
- **WHEN** a user runs `longgu --version`
- **THEN** the command reports `1.0.0`

### Requirement: Release verification command
The system SHALL provide a single local verification command for the V1.0 harness.

#### Scenario: Verify release
- **WHEN** a developer runs `npm run verify`
- **THEN** typecheck, build, tests, and OpenSpec validation run successfully

### Requirement: Stable command discovery
The system SHALL expose stable command groups through CLI help.

#### Scenario: Top-level help
- **WHEN** a user runs `longgu --help`
- **THEN** the help output lists the stable command groups for planning, state, audit, revision, genre cards, context, models, costs, feedback, experiments, and runs

### Requirement: V1.0 example project
The system SHALL include a representative example project with V1.0 artifacts.

#### Scenario: Inspect example
- **WHEN** a user opens `examples/xuanhuan-demo`
- **THEN** the project includes example planning, state, context, and experiment artifacts

### Requirement: V1.0 usage documentation
The system SHALL document the V1.0 workflow.

#### Scenario: Read usage guide
- **WHEN** a user reads the project README
- **THEN** they can find a concise step-by-step quickstart covering init, configuration, planning, context, writing, auditing, revising, and settling
- **THEN** they can find which major capabilities are usable, partial, or planned

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

### Requirement: Shared provider JSON parsing
The system SHALL parse JSON object responses from provider text through one shared helper.

#### Scenario: Fenced JSON object
- **WHEN** a provider response contains a JSON object inside a Markdown JSON fence
- **THEN** the shared parser returns the object for schema validation

#### Scenario: Wrapped JSON object
- **WHEN** a provider response contains explanatory text around a JSON object
- **THEN** the shared parser extracts the first complete object span from the first `{` through the last `}`

#### Scenario: Missing JSON object
- **WHEN** a provider response does not contain a JSON object
- **THEN** the caller receives a domain-specific error message

