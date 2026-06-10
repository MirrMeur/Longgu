## MODIFIED Requirements

### Requirement: Task model routing
The system SHALL resolve a model profile for every model-backed task route.

#### Scenario: Drafting route
- **WHEN** chapter generation runs
- **THEN** it uses the `drafting` route when configured

#### Scenario: Important chapter upgrade
- **WHEN** chapter generation runs with `--important`
- **THEN** it uses the route `importantModel` when configured

#### Scenario: Non-drafting route
- **WHEN** planning, audit, revision, settlement, or experiment generation runs through a provider
- **THEN** it uses the matching task route when configured
- **AND** it falls back to `default` when no matching route is configured

#### Scenario: Summary route
- **WHEN** chapter summary generation runs
- **THEN** the system resolves the `summarize` model task route
