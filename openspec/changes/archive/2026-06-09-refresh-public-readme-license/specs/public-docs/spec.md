## ADDED Requirements

### Requirement: Public README
The project README SHALL describe the current Longgu project for external readers.

#### Scenario: README focuses on current project
- **WHEN** a reader opens `README.md`
- **THEN** it introduces Longgu, current capabilities, installation, usage, project artifacts, and license
- **AND** it does not include internal SDD workflow, roadmap, or implementation planning sections

### Requirement: Development workflow location
Development workflow instructions SHALL live outside the public README.

#### Scenario: Contributor workflow
- **WHEN** a contributor needs development process instructions
- **THEN** they can find SDD/OpenSpec instructions in `AGENTS.md`

### Requirement: Non-commercial license
The project SHALL use a license that prohibits commercial use.

#### Scenario: License declaration
- **WHEN** a reader inspects project license metadata
- **THEN** the repository contains a license file and package metadata that indicate non-commercial use only
