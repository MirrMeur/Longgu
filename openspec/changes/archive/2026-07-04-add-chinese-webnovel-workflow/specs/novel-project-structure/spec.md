## ADDED Requirements

### Requirement: Novel project uses Chinese-visible structure
The system SHALL create each novel as an independent folder with Chinese-visible directories for author-facing creative assets.

#### Scenario: Create new novel project
- **WHEN** a new novel project is initialized
- **THEN** the project SHALL include author-facing roots for `01_立项设定`, `02_设定圣经`, `03_大纲`, `04_伏笔与期待`, `05_前情与状态`, `06_章节规划`, `07_正文`, and `08_AI审稿`

#### Scenario: Avoid hidden creative assets
- **WHEN** the system stores core creative assets for a novel
- **THEN** it SHALL NOT place those core assets only inside hidden implementation directories such as `.longgu`

### Requirement: Root files provide project entry points
The system SHALL create root-level files that explain current work, workflow rules, confirmed decisions, and project purpose.

#### Scenario: Initialize root files
- **WHEN** a novel project is initialized
- **THEN** the project SHALL include `当前步骤.md`, `创作流程.md`, `已确认决定.md`, and `项目说明.md`

#### Scenario: Author opens project
- **WHEN** an author opens a novel project without knowing what to do next
- **THEN** `当前步骤.md` SHALL identify the current stage and the next author action

### Requirement: Directories explain their purpose
Each author-facing directory SHALL include a `_说明.md` file describing the directory purpose, when to inspect it, whether it can be edited, and what downstream content it affects.

#### Scenario: Inspect directory meaning
- **WHEN** an author opens any numbered author-facing directory
- **THEN** `_说明.md` SHALL explain what the directory contains and how changes affect later generation

### Requirement: Creative files are directly editable
Author-facing creative files SHALL be plain text Markdown where practical, and SHALL indicate that author edits are valid source material for future generation.

#### Scenario: Edit character file
- **WHEN** an author directly edits `02_设定圣经/角色设定/主角.md`
- **THEN** future generation SHALL treat the edited content as authoritative input
