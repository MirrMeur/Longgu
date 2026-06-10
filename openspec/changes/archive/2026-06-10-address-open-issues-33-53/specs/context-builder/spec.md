## MODIFIED Requirements

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
