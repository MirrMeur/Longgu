# context-builder Specification

## Purpose
TBD - created by archiving change v0-7-context-builder. Update Purpose after archive.
## Requirements
### Requirement: Context build command
The system SHALL build reviewable context artifacts for chapter drafting and review.

#### Scenario: Human-readable brief
- **WHEN** a user runs `longgu context build --chapter 005 --human-readable`
- **THEN** the system writes `context/005.brief.md`
- **AND** the brief contains chapter goal, previous summary, active hooks, due promises, style constraints, payoff recipes, market constraints, and tail-hook direction
- **AND** the brief omits token budget calculations.

#### Scenario: Payoff recipes in context
- **WHEN** `bible/payoff-recipes.md` exists
- **THEN** the system includes it as an explicit context section for drafting.

#### Scenario: Market constraints in context
- **WHEN** `longgu.yaml` contains market settings
- **THEN** the system includes platform and cadence constraints in context.

### Requirement: Context pack schema
The system SHALL validate context packs against a V0.7 schema.

#### Scenario: Context pack shape
- **WHEN** a context pack is written
- **THEN** it contains `schemaVersion`, `chapterId`, `tokenBudget`, `estimatedTokens`, `sections`, `includedSectionCount`, and `generatedAt`
- **THEN** `schemaVersion` is `longgu.context-pack.v0.7`

#### Scenario: Context section shape
- **WHEN** a context section is written
- **THEN** it contains `id`, `source`, `reason`, `priority`, `estimatedTokens`, `included`, and `content`

#### Scenario: Default context budget
- **WHEN** a context pack is built without an explicit `--max-tokens` override
- **THEN** the token budget defaults to the configured `context.maxTokens`
- **THEN** if no config value is present, the token budget defaults to 16000

#### Scenario: CLI context budget override
- **WHEN** a user runs `longgu context build --chapter 001 --max-tokens 200`
- **THEN** the context pack token budget is 200 regardless of `longgu.yaml` defaults

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
- **THEN** the context builder considers the latest five feedback files at or before the target chapter for the context pack
- **AND** it reads only those selected feedback JSON files

### Requirement: Explainable context
The system SHALL explain why each context section was selected.

#### Scenario: Section reasons
- **WHEN** a section is included or excluded
- **THEN** the section contains a human-readable `reason`

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

### Requirement: Context Markdown projection
The system SHALL create a readable Markdown projection of included context sections.

#### Scenario: Markdown context
- **WHEN** a context pack is built
- **THEN** `context/<chapter-id>.context.md` contains included section headings, source paths, reasons, and content

