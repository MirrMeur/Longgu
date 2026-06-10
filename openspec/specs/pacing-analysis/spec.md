# pacing-analysis Specification

## Purpose
TBD - created by archiving change address-open-issues-33-53. Update Purpose after archive.
## Requirements
### Requirement: Rule-based pacing analysis
The system SHALL analyze multiple chapter bodies using deterministic rules.

#### Scenario: Pacing report
- **WHEN** a user analyzes a chapter range
- **THEN** the system reports per-chapter emotional intensity
- **AND** reports cliffhanger density across the range
- **AND** reports average payoff interval
- **AND** reports fatigue risks for consecutive high-intensity or low-intensity chapters
- **AND** reports CP screentime based on configured or inferred character co-occurrence.

