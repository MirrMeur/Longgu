## ADDED Requirements

### Requirement: AI review checks chapter against planning and canon
The system SHALL generate AI review files that compare chapter正文 against the corresponding chapter plan and established creative assets.

#### Scenario: Review chapter正文
- **WHEN** `07_正文/第NNN章.md` is ready for review
- **THEN** the system SHALL create or update `08_AI审稿/第NNN章_审稿.md`

#### Scenario: Review against chapter plan
- **WHEN** AI review is generated for chapter N
- **THEN** it SHALL evaluate whether the正文 satisfies `06_章节规划/第NNN章_规划.md`, including 本章必须发生, 本章不能发生, 读者看点, 爽点, 伏笔, 章尾钩子, and 连续性风险

#### Scenario: Review against canon
- **WHEN** AI review is generated
- **THEN** it SHALL check for conflicts with relevant `02_设定圣经/` files and `已确认决定.md`

### Requirement: AI review checks reader-retention quality
The system SHALL evaluate whether the chapter supports reader retention for Chinese webnovel serialization.

#### Scenario: Check reader promise
- **WHEN** AI review is generated
- **THEN** it SHALL evaluate whether the chapter reinforces or at least does not violate `01_立项设定/读者承诺.md`

#### Scenario: Check chapter hook
- **WHEN** AI review is generated
- **THEN** it SHALL assess whether the chapter ending gives readers a reason to continue, or explain why a weaker hook is acceptable in context

#### Scenario: Check protagonist agency and payoff
- **WHEN** AI review is generated
- **THEN** it SHALL identify whether the protagonist has meaningful agency and whether the chapter provides intended emotional payoff, 爽点, tension, or mystery

### Requirement: AI review checks continuity and state
The system SHALL compare chapter正文 with continuity-state files and identify contradictions or missing updates.

#### Scenario: Check continuity state
- **WHEN** AI review is generated
- **THEN** it SHALL compare the chapter against `05_前情与状态/近期前情.md`, `角色状态.md`, `世界状态.md`, `关系状态.md`, `未解决问题.md`, and `连续性风险.md`

#### Scenario: Identify new state updates
- **WHEN** chapter正文 changes character, world, relationship, foreshadowing, or unresolved-question state
- **THEN** AI review SHALL list the required updates for `05_前情与状态/` and `04_伏笔与期待/`

### Requirement: AI review remains advisory
AI review SHALL provide recommendations, but SHALL NOT automatically override author-approved or author-edited content.

#### Scenario: Review proposes change
- **WHEN** AI review recommends modifying正文,设定,大纲, or伏笔
- **THEN** it SHALL present the recommendation as author-decidable advice rather than applying it without approval

#### Scenario: Author rejects review advice
- **WHEN** the author rejects an AI review recommendation
- **THEN** the system SHALL preserve the author decision and avoid repeatedly applying the rejected recommendation unless new context appears

### Requirement: AI review output is actionable
AI review SHALL produce concise, actionable findings rather than vague quality comments.

#### Scenario: Produce review sections
- **WHEN** AI review is generated
- **THEN** it SHALL include 总评, 章节规划符合度, 读者期待, 伏笔检查, 连续性检查, 角色一致性, and 建议修改 sections

#### Scenario: Recommend concrete fix
- **WHEN** AI review identifies a problem
- **THEN** it SHALL include a concrete suggested fix or a clear reason why author judgment is needed
