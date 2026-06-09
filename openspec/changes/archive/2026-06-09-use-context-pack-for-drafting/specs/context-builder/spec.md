## MODIFIED Requirements

### Requirement: Context sources
The system SHALL include available local context sources relevant to the target chapter.

#### Scenario: Source selection
- **WHEN** matching base bible files, chapter plan, volume plan, state ledgers, genre card, style constraints, chapter summaries, or previous chapter bodies exist
- **THEN** the context builder considers those sources for the context pack

#### Scenario: Previous chapter body selection
- **WHEN** `chapters/<previous-id>.md` exists before the target chapter id
- **THEN** the context pack may include the previous chapter body as low-priority continuity context
- **THEN** the target chapter body is not included in its own context pack
