## ADDED Requirements

### Requirement: Continuity state stores compressed context
The system SHALL maintain `05_前情与状态/` as the compressed continuity layer for long-form writing.

#### Scenario: Initialize continuity directory
- **WHEN** a novel project is initialized
- **THEN** `05_前情与状态/` SHALL include `总前情.md`, `当前卷前情.md`, `近期前情.md`, `章节摘要/`, `角色状态.md`, `世界状态.md`, `关系状态.md`, `未解决问题.md`, and `连续性风险.md`

#### Scenario: Avoid full-history dependency
- **WHEN** the system prepares to write chapter N
- **THEN** it SHALL NOT require reading all previous chapter正文 files as the default context strategy

### Requirement: Chapter completion updates summaries and state
The system SHALL update continuity files after a chapter正文 is completed and reviewed.

#### Scenario: Complete chapter state update
- **WHEN** chapter N正文 reaches the post-review update step
- **THEN** the system SHALL create or update `05_前情与状态/章节摘要/第NNN章_摘要.md`, `近期前情.md`, `角色状态.md`, `世界状态.md`, `关系状态.md`, `未解决问题.md`, and `连续性风险.md` as applicable

#### Scenario: Update foreshadowing after chapter
- **WHEN** chapter N adds, deepens, or resolves伏笔
- **THEN** the system SHALL update `04_伏笔与期待/伏笔账本.md` with the current status and source chapter

### Requirement: New chapter reads a bounded context packet
The system SHALL use a bounded context packet for writing a new chapter.

#### Scenario: Build context for chapter N
- **WHEN** the system writes or assists with chapter N
- **THEN** it SHALL read `当前步骤.md`, `创作流程.md`, relevant `02_设定圣经/` files, relevant `03_大纲/` files, relevant `04_伏笔与期待/` files, `05_前情与状态/近期前情.md`, `05_前情与状态/角色状态.md`, `05_前情与状态/未解决问题.md`, `06_章节规划/第NNN章_规划.md`, and chapter N-1正文 when it exists

#### Scenario: Read older正文 only when needed
- **WHEN** an older chapter is needed for伏笔回收, important角色回归, setting dispute, or explicit author request
- **THEN** the system SHALL read the specific older正文 file and explain why it is needed

### Requirement: Important foreshadowing stores original anchors
The system SHALL preserve original text anchors for important foreshadowing or continuity-critical moments.

#### Scenario: Record foreshadowing anchor
- **WHEN** the system records an important伏笔 in `伏笔账本.md`
- **THEN** it SHALL include the source chapter and a short original text anchor when available

#### Scenario: Recover foreshadowing later
- **WHEN** the system prepares to回收 a伏笔
- **THEN** it SHALL use the recorded source chapter and anchor to avoid relying only on rewritten summaries

### Requirement: Continuity files prevent repeated or contradicted story state
The system SHALL use continuity files to identify events that should not be repeated and states that must not be contradicted.

#### Scenario: Prevent repeated exposition
- **WHEN** `近期前情.md` or `连续性风险.md` lists content under 不能重复
- **THEN** the system SHALL avoid restating that content as new discovery in the next chapter

#### Scenario: Prevent knowledge contradiction
- **WHEN** `角色状态.md` states that a character does not know a fact
- **THEN** the system SHALL NOT write that character as knowing the fact unless the current chapter explicitly reveals it
