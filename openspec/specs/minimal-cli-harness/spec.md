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
The system SHALL validate `longgu.yaml` against a schema that supports host-only workflows, provider-backed workflows, and workflow defaults.

#### Scenario: Host-only configuration
- **WHEN** `longgu.yaml` contains title, genre, language, and context defaults but no `provider`
- **THEN** the configuration validates successfully
- **THEN** host-LLM commands that do not call a provider can still run

#### Scenario: Provider-backed command requires provider configuration
- **WHEN** a provider-backed command is run in a workspace with no `provider`
- **THEN** the system reports that provider configuration is required
- **THEN** the system exits with a non-zero status

#### Scenario: Default drafting target
- **WHEN** `longgu.yaml` omits `drafting.targetWords`
- **THEN** chapter drafting uses the default target word count

### Requirement: Doctor checks workspace and provider readiness
The system SHALL provide `longgu doctor` to check workspace structure, configuration validity, API key availability, and model connectivity.

#### Scenario: Workspace is ready
- **WHEN** a user runs `longgu doctor` in a valid configured workspace with reachable provider settings
- **THEN** the system checks provider connectivity through a minimal chat completion request
- **THEN** the system reports that file structure, configuration, API key, and provider connectivity checks pass

#### Scenario: Provider is not ready
- **WHEN** a user runs `longgu doctor` with a missing API key or unreachable provider
- **THEN** the system reports the exact failed check and exits with a non-zero status

#### Scenario: Provider model listing is unavailable
- **WHEN** a provider supports `POST /chat/completions` but does not support `GET /models`
- **THEN** `longgu doctor` succeeds if the minimal chat completion check succeeds

### Requirement: Chapter generation from base inputs
The system SHALL support host-LLM prompt export and draft import without requiring provider credentials.

#### Scenario: Batch host prompt export
- **WHEN** a user runs `longgu write batch --from 001 --to 010 --host-prompt`
- **THEN** the system writes one combined batch prompt file
- **AND** the file separates each chapter prompt with Markdown `---`.

#### Scenario: Batch host draft import
- **WHEN** a user runs `longgu write batch --from 001 --to 010 --input-dir drafts`
- **THEN** the system imports matching Markdown files by chapter id basename
- **AND** writes one chapter file and one run record per imported chapter.

#### Scenario: Imported draft word-count feedback
- **WHEN** a user imports a host-generated chapter
- **THEN** the system reports actual words, target words, and fit status
- **AND** deviations over 20 percent are warnings
- **AND** deviations over 40 percent are errors in the returned result.

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

### Requirement: Pacing CLI
The system SHALL provide a rule-based `longgu pacing` command.

#### Scenario: Analyze chapter range
- **WHEN** a user runs `longgu pacing --from 001 --to 010`
- **THEN** the system writes JSON and Markdown pacing reports
- **AND** reports cliffhanger density, emotional curve, payoff interval, fatigue risk, and CP screentime.

