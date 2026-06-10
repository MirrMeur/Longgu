## MODIFIED Requirements

### Requirement: Chapter audit dimensions
The system SHALL audit chapters against consistency, prose, contract, and payoff-engineering dimensions.

#### Scenario: Payoff-engineering dimensions are accepted
- **WHEN** a raw audit issue uses dimension `weak-opening-hook`, `flat-emotional-curve`, `missing-breath-scene`, `dialogue-desert`, `insufficient-cp-chemistry`, or `weak-meme-hook`
- **THEN** the system accepts and normalizes the issue.

#### Scenario: Payoff and market constraints guide audit
- **WHEN** payoff recipes or market config exist
- **THEN** the audit prompt includes those constraints as review criteria.
