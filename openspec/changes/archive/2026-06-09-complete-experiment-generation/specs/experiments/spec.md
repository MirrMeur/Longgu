## ADDED Requirements

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
