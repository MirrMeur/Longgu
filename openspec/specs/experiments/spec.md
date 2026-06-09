# experiments Specification

## Purpose
TBD - created by archiving change v0-9-experiments. Update Purpose after archive.
## Requirements
### Requirement: Experiment creation
The system SHALL create reviewable experiment manifests under `experiments/<id>/`.

#### Scenario: Create experiment
- **WHEN** a user runs `longgu experiment create --id opening-ab --goal "测试开篇钩子"`
- **THEN** the system writes `experiments/opening-ab/manifest.json`
- **THEN** the manifest uses schema version `longgu.experiment.v0.9`

### Requirement: Variant registration
The system SHALL register local Markdown candidate outputs as experiment variants.

#### Scenario: Register variant
- **WHEN** a user runs `longgu experiment run --id opening-ab --variant hook-a --input drafts/hook-a.md`
- **THEN** the system writes `experiments/opening-ab/variants/hook-a/output.md`
- **THEN** the system writes `experiments/opening-ab/variants/hook-a/metadata.json`

### Requirement: Human score writeback
The system SHALL persist human scores for an experiment variant.

#### Scenario: Score variant
- **WHEN** a user runs `longgu experiment score --id opening-ab --variant hook-a --payoff 8 --hook 9 --ai-flavor 2`
- **THEN** the system writes `experiments/opening-ab/variants/hook-a/scores.json`

### Requirement: Experiment comparison
The system SHALL aggregate variant metadata, scores, audit data, and costs into comparison reports.

#### Scenario: Compare variants
- **WHEN** a user runs `longgu experiment compare --id opening-ab`
- **THEN** the system writes `experiments/opening-ab/compare.json`
- **THEN** the system writes `experiments/opening-ab/compare.md`

### Requirement: Comparison sorting
The system SHALL support deterministic sorting for experiment comparison reports.

#### Scenario: Sort by hook
- **WHEN** a user runs `longgu experiment compare --id opening-ab --sort hook`
- **THEN** variants with higher human hook scores appear first in the report

### Requirement: Model-backed experiment generation
The system SHALL generate experiment variants through the configured model route and register them as comparable variants.

#### Scenario: Generate experiment variant
- **WHEN** a user runs `longgu experiment generate --id opening-ab --variant hook-a --prompt prompts/hook-a.md`
- **THEN** the system uses the `experiment` model route
- **AND** the system writes a run record under `runs/`
- **AND** the system writes `experiments/opening-ab/variants/hook-a/output.md`
- **AND** the variant metadata links the run id and estimated cost

#### Scenario: Generated variants compare with manual variants
- **WHEN** a generated variant has scores or audit metadata
- **THEN** `longgu experiment compare` includes it in the same report as registered manual variants

