## ADDED Requirements

### Requirement: Chapter planning files define single-chapter intent
The system SHALL create chapter planning files before drafting chapter text.

#### Scenario: Create chapter plan
- **WHEN** the system prepares to write chapter N
- **THEN** it SHALL create or update `06_章节规划/第NNN章_规划.md` before generating or requesting正文 for that chapter

#### Scenario: Plan includes required sections
- **WHEN** a chapter planning file is created
- **THEN** it SHALL include 本章作用, 本章必须发生, 本章不能发生, 读者看点, 爽点, 伏笔, 章尾钩子, and 连续性风险 sections

### Requirement: Chapter planning constrains drafting
The system SHALL use the chapter planning file as the primary task brief for generating or reviewing the corresponding chapter.

#### Scenario: Draft chapter from plan
- **WHEN** the system drafts `07_正文/第NNN章.md`
- **THEN** it SHALL follow `06_章节规划/第NNN章_规划.md` and avoid content listed under 本章不能发生

#### Scenario: Author writes chapter manually
- **WHEN** the author provides or edits `07_正文/第NNN章.md`
- **THEN** the system SHALL still use `06_章节规划/第NNN章_规划.md` as a reference for later AI审稿

### Requirement: Chapter planning exposes reader-retention design
Chapter planning SHALL explicitly describe why the reader should continue reading after the chapter.

#### Scenario: Plan chapter hook
- **WHEN** a chapter planning file is generated
- **THEN** it SHALL identify at least one 章尾钩子 or explain why the chapter is intentionally hook-light

#### Scenario: Plan chapter payoff
- **WHEN** a chapter planning file is generated
- **THEN** it SHALL identify the intended 爽点, 情绪回报, or reader-facing payoff

### Requirement: Chapter planning references continuity constraints
Chapter planning SHALL reference known state, unresolved questions, and foreshadowing constraints relevant to the chapter.

#### Scenario: Plan chapter with existing伏笔
- **WHEN** a chapter is expected to deepen or回收 a伏笔
- **THEN** the chapter planning file SHALL reference the corresponding item from `04_伏笔与期待/伏笔账本.md` or `05_前情与状态/未解决问题.md`

#### Scenario: Plan chapter with state risk
- **WHEN** a known role, world, or relationship state could be contradicted by the chapter
- **THEN** the chapter planning file SHALL list that risk under 连续性风险
