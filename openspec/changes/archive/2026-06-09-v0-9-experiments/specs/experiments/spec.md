## ADDED Requirements

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
