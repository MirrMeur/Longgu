## MODIFIED Requirements

### Requirement: Novel workspace initialization
The system SHALL initialize a Longgu novel workspace with the minimum file and directory structure required for V0.1 writing and V0.2 planning.

#### Scenario: Initialize a new novel workspace
- **WHEN** a user runs `longgu init` in an empty target directory
- **THEN** the system creates `longgu.yaml`, `bible/`, `outlines/`, `chapters/`, and `runs/`
- **THEN** the system creates starter files for premise, characters, world, and style inputs

#### Scenario: Avoid overwriting existing workspace content
- **WHEN** a user runs `longgu init` in a directory that already contains workspace files
- **THEN** the system reports the existing files and does not silently overwrite user-authored content
