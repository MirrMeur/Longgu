## MODIFIED Requirements

### Requirement: Token budget trimming
The system SHALL trim context sections when estimated tokens exceed the requested budget.

#### Scenario: Budget exceeded
- **WHEN** estimated tokens exceed `--max-tokens`
- **THEN** the system excludes lower-priority sections first
- **THEN** the command still succeeds

#### Scenario: Mixed content token estimates
- **WHEN** context contains Chinese prose, Markdown, or formatted JSON
- **THEN** the system estimates tokens with a mixed-content heuristic instead of raw character length divided by two
- **AND** formatted JSON structure contributes to the estimate

#### Scenario: Same-priority retention scoring
- **WHEN** same-priority sections compete for a tight token budget
- **THEN** the system trims lower retention-score sections before higher retention-score sections
- **AND** section size is used only as a tie-breaker after retention score

#### Scenario: Critical context protected
- **WHEN** a critical state section or current chapter card is present
- **THEN** it remains included even when the pack exceeds the token budget
