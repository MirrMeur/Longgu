## MODIFIED Requirements

### Requirement: Context sources
The system SHALL include available local context sources relevant to the target chapter.

#### Scenario: Source selection
- **WHEN** matching base bible files, chapter plan, volume plan, state ledgers, genre card, style constraints, chapter summaries, or previous chapter bodies exist
- **THEN** the context builder considers those sources for the context pack

#### Scenario: Chapter summary generation
- **WHEN** a user runs `longgu summarize chapter --id 001`
- **AND** `chapters/001.md` exists
- **AND** provider credentials are available
- **THEN** the system asks the provider for structured chapter summary JSON
- **AND** the system writes `summaries/001.summary.json`
- **AND** the summary can be consumed by later context builds

#### Scenario: State ledger summary source selection
- **WHEN** state ledgers exist
- **THEN** the context builder creates compact critical state summary sections
- **AND** the context builder creates full state ledger sections that may be trimmed under tight token budgets

#### Scenario: Previous chapter body selection
- **WHEN** `chapters/<previous-id>.md` exists before the target chapter id
- **THEN** the context pack may include the previous chapter body as low-priority continuity context
- **THEN** the target chapter body is not included in its own context pack

#### Scenario: Cross-volume previous chapter body selection
- **WHEN** the target chapter id is `v10-001`
- **AND** `chapters/v9-005.md` exists
- **THEN** the context builder treats `v9-005` as before `v10-001`
- **AND** the context pack may include `chapters/v9-005.md` as low-priority continuity context

#### Scenario: Human feedback source selection
- **WHEN** chapter feedback files exist under `feedback/`
- **THEN** the context builder considers the feedback for the context pack
