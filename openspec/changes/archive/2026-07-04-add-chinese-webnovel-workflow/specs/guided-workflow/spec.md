## ADDED Requirements

### Requirement: Current step drives progression
The system SHALL use `当前步骤.md` as the default task card for workflow progression.

#### Scenario: Continue current step
- **WHEN** the author asks to continue the current step
- **THEN** the system SHALL read `当前步骤.md`, read `创作流程.md`, read files listed by the current step, and determine whether to generate, ask for review, or wait for approval

#### Scenario: Display actionable current step
- **WHEN** `当前步骤.md` is generated or updated
- **THEN** it SHALL state the current stage, status, required files to inspect, editable files, impact scope, next outputs, and allowed author replies

### Requirement: Workflow file defines route and rules
The system SHALL use `创作流程.md` to define stage order, stage goals, required inputs, outputs, confirmation gates, and progression rules.

#### Scenario: Inspect workflow route
- **WHEN** the author reads `创作流程.md`
- **THEN** it SHALL show the route from 立项设定 through 设定圣经, 大纲, 伏笔与期待, 前情与状态, 章节规划, 正文, AI审稿, and 状态更新

#### Scenario: Enforce stage order
- **WHEN** the system advances to a new major stage
- **THEN** it SHALL follow the order and confirmation gates defined in `创作流程.md`

### Requirement: Author confirmation gates are mandatory
The system SHALL wait for author confirmation before advancing past major planning stages.

#### Scenario: Planning stage complete
- **WHEN** a major planning stage such as 立项设定, 设定圣经, 全书大纲, 第一卷大纲, or first batch 章节规划 is complete
- **THEN** the system SHALL mark the step as waiting for author review instead of automatically advancing

#### Scenario: Author approves step
- **WHEN** the author approves the current step
- **THEN** the system SHALL record the approved decision in `已确认决定.md` and update `当前步骤.md` to the next stage

### Requirement: Author edits take precedence
The system SHALL treat direct author edits to creative files as higher priority than prior generated content or conversation memory.

#### Scenario: Author edits upstream file
- **WHEN** the author states that they edited a creative file and asks to continue
- **THEN** the system SHALL reread the edited file and use it as authoritative input before generating downstream content

#### Scenario: Upstream edit affects downstream artifacts
- **WHEN** an author edit may invalidate downstream 大纲, 伏笔, 章节规划, 正文, or AI审稿 files
- **THEN** the system SHALL identify the likely affected files before rewriting or regenerating them

### Requirement: Each generation reports reads, writes, and next step
The system SHALL summarize which files were used, which files were written, and what the next step is after each workflow action.

#### Scenario: Generate workflow artifact
- **WHEN** the system creates or updates workflow files
- **THEN** it SHALL report the generated artifacts and update `当前步骤.md` with the next expected action
