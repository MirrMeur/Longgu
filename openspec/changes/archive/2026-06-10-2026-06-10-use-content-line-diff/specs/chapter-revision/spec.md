## MODIFIED Requirements

### Requirement: Revision diff
The system SHALL preserve a readable diff between the original and revised chapter.

#### Scenario: Diff contains changes
- **WHEN** a revision changes chapter text
- **THEN** `diff.md` contains removed and added lines

#### Scenario: Diff aligns inserted lines
- **WHEN** a revision inserts a line before otherwise unchanged content
- **THEN** `diff.md` marks the inserted line as added
- **AND** it does not mark the unchanged following lines as removed and re-added solely due to index shift

#### Scenario: Non-critical identical output recorded
- **WHEN** provider output is identical to the existing chapter
- **AND** the selected revision issues are not critical
- **THEN** the revision succeeds
- **AND** the system writes a revision record
- **AND** the chapter content remains unchanged

#### Scenario: Critical identical output rejected
- **WHEN** provider output is identical to the existing chapter
- **AND** the selected revision issues include a critical issue
- **THEN** the revision fails
- **AND** the chapter is not modified
