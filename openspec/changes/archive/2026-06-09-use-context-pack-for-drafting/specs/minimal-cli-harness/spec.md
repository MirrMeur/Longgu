## MODIFIED Requirements

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
