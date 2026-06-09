## MODIFIED Requirements

### Requirement: Novel configuration schema
The system SHALL validate `longgu.yaml` against a schema that supports host-only workflows, provider-backed workflows, and workflow defaults.

#### Scenario: Host-only configuration
- **WHEN** `longgu.yaml` contains title, genre, language, and context defaults but no `provider`
- **THEN** the configuration validates successfully
- **THEN** host-LLM commands that do not call an external provider can run

#### Scenario: Provider-backed command requires provider configuration
- **WHEN** a provider-backed command is run in a workspace with no `provider`
- **THEN** the system reports that provider configuration is required
- **THEN** the system exits with a non-zero status

### Requirement: Chapter generation from base inputs
The system SHALL provide `longgu write chapter --id <id>` to generate or import a chapter from the current Longgu workspace inputs and prompt template.

#### Scenario: Export host LLM drafting prompt
- **WHEN** a user runs `longgu write chapter --id 001 --host-prompt` in a valid host-only workspace
- **THEN** the system builds a context pack for chapter `001`
- **THEN** the system renders the drafting prompt from included context-pack sections
- **THEN** the system writes the prompt to `host-prompts/001.prompt.md`
- **THEN** the system does not require provider credentials

#### Scenario: Import host LLM chapter draft
- **WHEN** a user runs `longgu write chapter --id 001 --input drafts/001.md` in a valid host-only workspace
- **THEN** the system writes the imported Markdown chapter to `chapters/001.md`
- **THEN** the system creates a run record under `runs/`
- **THEN** the run metadata marks provider, model, and model profile as host LLM values
- **THEN** the run metadata records zero estimated cost

#### Scenario: Generate first chapter
- **WHEN** a user runs `longgu write chapter --id 001` in a valid provider-backed workspace
- **THEN** the system builds a context pack for chapter `001`
- **THEN** the system renders the drafting prompt from included context-pack sections
- **THEN** the system writes the generated chapter to `chapters/001.md`
- **THEN** the system creates a run record under `runs/`
