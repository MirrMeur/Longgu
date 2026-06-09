## MODIFIED Requirements

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate a chapter from the V0.1 base novel inputs and prompt template.

#### Scenario: Generate first chapter
- **WHEN** a user runs `longgu write chapter --id 001` in a valid workspace
- **THEN** the system reads the configured base inputs and prompt template
- **THEN** the system writes the generated chapter to `chapters/001.md`
- **THEN** the system creates a run record under `runs/`

#### Scenario: Use planned chapter title when a chapter card exists
- **WHEN** a user runs `longgu write chapter --id 001` in a workspace with a matching chapter card in `outlines/chapters-*.draft.json`
- **THEN** the system writes `chapters/001.md`
- **THEN** the chapter Markdown starts with `# 第001章 <title>` using the title from the matching chapter card
- **THEN** any leading provider-generated H1 is replaced by the planned heading

#### Scenario: Preserve full compound chapter id in heading
- **WHEN** a user runs `longgu write chapter --id 001-002` in a workspace with a matching chapter card
- **THEN** the generated chapter Markdown starts with `# 第001-002章 <title>`
- **THEN** the heading does not collapse the id to only `001`

#### Scenario: Do not hide LLM failure
- **WHEN** the provider returns an error during chapter generation
- **THEN** the system reports a clear error message
- **THEN** the system records the failed run details under `runs/`
- **THEN** the system exits with a non-zero status
