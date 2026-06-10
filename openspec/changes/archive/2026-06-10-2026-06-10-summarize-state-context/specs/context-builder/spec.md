## MODIFIED Requirements

### Requirement: Context sources
The system SHALL include available local context sources relevant to the target chapter.

#### Scenario: Source selection
- **WHEN** matching base bible files, chapter plan, volume plan, state ledgers, genre card, style constraints, chapter summaries, or previous chapter bodies exist
- **THEN** the context builder considers those sources for the context pack

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

### Requirement: Token budget trimming
The system SHALL trim context sections when estimated tokens exceed the requested budget.

#### Scenario: Budget exceeded
- **WHEN** estimated tokens exceed `--max-tokens`
- **THEN** the system excludes lower-priority sections first
- **THEN** the command still succeeds

#### Scenario: State summaries protected
- **WHEN** state ledgers are present
- **THEN** compact state summary sections remain included even when full state ledger sections are trimmed

#### Scenario: Mixed content token estimates
- **WHEN** context contains Chinese prose, Markdown, or formatted JSON
- **THEN** the system estimates tokens with a mixed-content heuristic instead of raw character length divided by two
- **AND** formatted JSON structure contributes to the estimate

#### Scenario: Same-priority retention scoring
- **WHEN** same-priority sections compete for a tight token budget
- **THEN** the system trims lower retention-score sections before higher retention-score sections
- **AND** section size is used only as a tie-breaker after retention score

#### Scenario: Critical context protected
- **WHEN** a critical state summary section or current chapter card is present
- **THEN** it remains included even when the pack exceeds the token budget
