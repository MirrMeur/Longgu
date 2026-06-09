## ADDED Requirements

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
- **THEN** the help output lists the stable command groups for planning, state, audit, revision, genre cards, context, models, costs, experiments, and runs

### Requirement: V1.0 example project
The system SHALL include a representative example project with V1.0 artifacts.

#### Scenario: Inspect example
- **WHEN** a user opens `examples/xuanhuan-demo`
- **THEN** the project includes example planning, state, context, and experiment artifacts

### Requirement: V1.0 usage documentation
The system SHALL document the V1.0 workflow.

#### Scenario: Read usage guide
- **WHEN** a user reads the project README
- **THEN** they can find a concise command sequence covering init, plan, state, write, audit, revise, context, model/cost, and experiment workflows
