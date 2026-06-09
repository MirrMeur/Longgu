# minimal-cli-harness Specification

## Purpose
Defines the V0.1 Longgu CLI harness: workspace initialization, configuration validation, provider readiness checks, first-chapter generation, persisted run records, and run inspection.
## Requirements
### Requirement: CLI package exposes V0.1 commands
The system SHALL provide a `longgu` CLI with the commands `init`, `doctor`, `write chapter --id <id>`, and `run show`.

#### Scenario: User lists CLI commands
- **WHEN** a user runs the CLI help command
- **THEN** the output lists `init`, `doctor`, `write chapter`, and `run show` as available V0.1 commands

### Requirement: Novel workspace initialization
The system SHALL initialize a Longgu novel workspace with the minimum file and directory structure required for V0.1 writing, V0.2 planning, and V0.3 state ledgers.

#### Scenario: Initialize a new novel workspace
- **WHEN** a user runs `longgu init` in an empty target directory
- **THEN** the system creates `longgu.yaml`, `bible/`, `outlines/`, `state/`, `chapters/`, and `runs/`
- **THEN** the system creates starter files for premise, characters, world, and style inputs

#### Scenario: Avoid overwriting existing workspace content
- **WHEN** a user runs `longgu init` in a directory that already contains workspace files
- **THEN** the system reports the existing files and does not silently overwrite user-authored content

#### Scenario: Initialize workspace with state directory
- **WHEN** a user runs `longgu init`
- **THEN** the workspace contains a `state/` directory

#### Scenario: Check state workspace shape
- **WHEN** a user runs a Longgu command that checks workspace shape
- **THEN** missing `state/` is reported as a missing workspace path

### Requirement: Novel configuration schema
The system SHALL validate `longgu.yaml` against a V0.1 schema that supports one OpenAI-compatible provider.

#### Scenario: Valid provider configuration
- **WHEN** `longgu.yaml` contains provider base URL, model name, API key environment variable name, and generation defaults
- **THEN** the configuration validates successfully

#### Scenario: Invalid provider configuration
- **WHEN** `longgu.yaml` is missing a required provider field
- **THEN** the system reports the missing field with a clear error message

### Requirement: Doctor checks workspace and provider readiness
The system SHALL provide `longgu doctor` to check workspace structure, configuration validity, API key availability, and model connectivity.

#### Scenario: Workspace is ready
- **WHEN** a user runs `longgu doctor` in a valid configured workspace with reachable provider settings
- **THEN** the system reports that file structure, configuration, API key, and model connectivity checks pass

#### Scenario: Provider is not ready
- **WHEN** a user runs `longgu doctor` with a missing API key or unreachable provider
- **THEN** the system reports the exact failed check and exits with a non-zero status

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate a chapter from the V0.1 base novel inputs and prompt template.

#### Scenario: Generate first chapter
- **WHEN** a user runs `longgu write chapter --id 001` in a valid workspace
- **THEN** the system builds a context pack for chapter `001`
- **THEN** the system renders the drafting prompt from included context-pack sections
- **THEN** the system writes the generated chapter to `chapters/001.md`
- **THEN** the system creates a run record under `runs/`

#### Scenario: Include recent context for consecutive chapter drafting
- **WHEN** a user runs `longgu write chapter --id 001-002` after `chapters/001-001.md` already exists
- **THEN** the drafting prompt includes available previous chapter continuity context through the context pack
- **THEN** the run record input files include the context sources used for drafting

#### Scenario: Do not hide LLM failure
- **WHEN** the provider returns an error during chapter generation
- **THEN** the system reports a clear error message
- **THEN** the system records the failed run details under `runs/`
- **THEN** the system exits with a non-zero status

### Requirement: Persisted generation run records
The system SHALL persist enough information for each generation run to be reviewed and reproduced.

#### Scenario: Successful run record
- **WHEN** a chapter generation succeeds
- **THEN** the run record contains provider name, model name, started time, finished time, input context, rendered prompt, generated output, and target chapter ID

#### Scenario: Failed run record
- **WHEN** a chapter generation fails after a provider request is attempted
- **THEN** the run record contains provider name, model name, started time, error message, input context, and rendered prompt

### Requirement: Run inspection command
The system SHALL provide `longgu run show` to display the latest generation run's input, output, model, and timing summary.

#### Scenario: Show latest run
- **WHEN** a user runs `longgu run show` after at least one generation attempt
- **THEN** the system displays the latest run's provider, model, timing, input files, prompt path or rendered prompt, output path, and status

#### Scenario: No runs exist
- **WHEN** a user runs `longgu run show` before any generation attempt
- **THEN** the system reports that no run records exist

### Requirement: V0.1 three-command user journey
The system SHALL allow a new user to initialize, check, and generate a first chapter with three commands after provider credentials are available.

#### Scenario: Three command happy path
- **WHEN** a user runs `longgu init`, configures provider credentials, runs `longgu doctor`, and runs `longgu write chapter --id 001`
- **THEN** the workspace contains a generated `chapters/001.md`
- **THEN** the workspace contains a reproducible run record under `runs/`

### Requirement: Example project
The system SHALL include an `examples/xuanhuan-demo/` workspace that demonstrates the V0.1 structure and can be used for CLI smoke tests.

#### Scenario: Example project is inspectable
- **WHEN** a developer opens `examples/xuanhuan-demo/`
- **THEN** it contains `longgu.yaml`, base `bible/` files, `chapters/`, and `runs/` placeholders compatible with V0.1 commands
