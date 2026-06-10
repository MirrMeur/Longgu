## MODIFIED Requirements

### Requirement: Chapter generation from base inputs
The system SHALL support host-LLM prompt export and draft import without requiring provider credentials.

#### Scenario: Batch host prompt export
- **WHEN** a user runs `longgu write batch --from 001 --to 010 --host-prompt`
- **THEN** the system writes one combined batch prompt file
- **AND** the file separates each chapter prompt with Markdown `---`.

#### Scenario: Batch host draft import
- **WHEN** a user runs `longgu write batch --from 001 --to 010 --input-dir drafts`
- **THEN** the system imports matching Markdown files by chapter id basename
- **AND** writes one chapter file and one run record per imported chapter.

#### Scenario: Imported draft word-count feedback
- **WHEN** a user imports a host-generated chapter
- **THEN** the system reports actual words, target words, and fit status
- **AND** deviations over 20 percent are warnings
- **AND** deviations over 40 percent are errors in the returned result.

## ADDED Requirements

### Requirement: Pacing CLI
The system SHALL provide a rule-based `longgu pacing` command.

#### Scenario: Analyze chapter range
- **WHEN** a user runs `longgu pacing --from 001 --to 010`
- **THEN** the system writes JSON and Markdown pacing reports
- **AND** reports cliffhanger density, emotional curve, payoff interval, fatigue risk, and CP screentime.
