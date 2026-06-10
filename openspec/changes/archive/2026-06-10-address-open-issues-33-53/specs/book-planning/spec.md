## MODIFIED Requirements

### Requirement: Book planning CLI command
The system SHALL create deterministic planning drafts that are useful without a provider.

#### Scenario: Scaffold book draft from bible
- **WHEN** a user runs `longgu plan book --scaffold`
- **THEN** the system extracts concrete fields from `bible/*.md`
- **AND** fills core hook, reader promises, conflict ladder, power system, and retention risks with non-empty scaffold values where source text exists.

#### Scenario: Scaffold volume draft from bible and book plan
- **WHEN** a user runs `longgu plan volume --id 001 --scaffold`
- **THEN** the system derives volume goal, antagonist pressure, key payoffs, resource changes, and ending hook from available planning and bible text.

#### Scenario: Scaffold chapter cards
- **WHEN** a user runs `longgu plan chapters --volume 001 --scaffold`
- **THEN** each generated chapter card has concrete goal, conflict, payoff, information gain, ending hook, and target words.
