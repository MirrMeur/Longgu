# genre-cards Specification

## Purpose
Defines the V0.6 Longgu genre card registry: built-in Chinese webnovel genre cards, alias resolution, genre inspection CLI commands, and genre-specific prompt injection for audit and revision workflows.
## Requirements
### Requirement: Genre card registry
The system SHALL provide a structured internal genre card registry for V0.6 Chinese webnovel genres.

#### Scenario: Built-in genre cards
- **WHEN** the registry is loaded
- **THEN** it contains cards for `xuanhuan`, `xianxia`, `urban`, `urban-system`, `historical`, `sci-fi`, `game-system`, and `supernatural-mystery`

#### Scenario: Genre card shape
- **WHEN** a genre card is loaded
- **THEN** it contains protagonist engine, payoff patterns, rhythm, progression, reader pitfalls, ending hooks, audit weights, opening 10 chapter focus, and prompt hints

### Requirement: Genre alias resolution
The system SHALL resolve common Chinese and English genre names to canonical genre cards.

#### Scenario: Chinese alias
- **WHEN** the workspace genre is `玄幻`
- **THEN** the system resolves the `xuanhuan` card

#### Scenario: Unknown genre fallback
- **WHEN** the workspace genre is unknown
- **THEN** the system uses a generic fallback card
- **THEN** the fallback is marked as generic

### Requirement: Genre CLI
The system SHALL provide CLI commands for inspecting genre cards.

#### Scenario: List genre cards
- **WHEN** a user runs `longgu genre list`
- **THEN** the output includes all built-in V0.6 genre card ids

#### Scenario: Show genre card
- **WHEN** a user runs `longgu genre show xuanhuan`
- **THEN** the output is JSON for the resolved genre card

### Requirement: Genre prompt injection
The system SHALL inject genre card rules into audit and revision prompts.

#### Scenario: Audit prompt uses genre card
- **WHEN** a user audits a chapter in a `玄幻` workspace
- **THEN** the audit prompt includes xuanhuan-specific audit priorities for realm, resource, faction pressure, and public status

#### Scenario: Mystery prompt uses mystery card
- **WHEN** a user audits a chapter in a `悬疑灵异` workspace
- **THEN** the audit prompt emphasizes clue fairness, information遮蔽, false hypotheses, and rule cost

#### Scenario: Revision prompt uses genre card
- **WHEN** a user revises a chapter
- **THEN** the revision prompt includes genre-specific prose and ending-hook guidance
