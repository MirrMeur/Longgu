## 1. Project Structure Templates

- [x] 1.1 Add a novel project initializer that creates root files `当前步骤.md`, `创作流程.md`, `已确认决定.md`, and `项目说明.md`.
- [x] 1.2 Add numbered Chinese author-facing directories: `01_立项设定`, `02_设定圣经`, `03_大纲`, `04_伏笔与期待`, `05_前情与状态`, `06_章节规划`, `07_正文`, and `08_AI审稿`.
- [x] 1.3 Add `_说明.md` templates for each numbered directory explaining purpose, editability, review timing, and downstream impact.
- [x] 1.4 Add default Markdown templates for key creative files including `创作目标.md`, `故事卖点.md`, `读者承诺.md`, `故事核心.md`, `世界设定.md`, `全书大纲.md`, `伏笔账本.md`, and `角色状态.md`.

## 2. Guided Workflow Engine

- [x] 2.1 Implement current-step loading that reads `当前步骤.md`, `创作流程.md`, and current-step required files before any workflow progression.
- [x] 2.2 Implement current-step updates that state current stage, status, required files, editable files, impact scope, next outputs, and allowed author replies.
- [x] 2.3 Implement approval handling that records approved choices in `已确认决定.md` and advances `当前步骤.md` to the next stage.
- [x] 2.4 Implement author-edit handling that rereads edited files, treats them as authoritative, and reports affected downstream artifacts before regeneration.

## 3. Chapter Planning Workflow

- [x] 3.1 Add generation for `06_章节规划/第NNN章_规划.md` before drafting or reviewing chapter N.
- [x] 3.2 Ensure chapter planning includes 本章作用, 本章必须发生, 本章不能发生, 读者看点, 爽点, 伏笔, 章尾钩子, and 连续性风险.
- [x] 3.3 Ensure chapter drafting uses the corresponding chapter planning file as the primary task brief.
- [x] 3.4 Add validation or checks that chapter plans reference relevant伏笔,未解决问题, and continuity risks when applicable.

## 4. Continuity State Workflow

- [x] 4.1 Add continuity files under `05_前情与状态/`, including `总前情.md`, `当前卷前情.md`, `近期前情.md`, `章节摘要/`, `角色状态.md`, `世界状态.md`, `关系状态.md`, `未解决问题.md`, and `连续性风险.md`.
- [x] 4.2 Implement bounded context packet selection for writing chapter N, avoiding default reads of all historical正文 files.
- [x] 4.3 Implement post-chapter summary generation to create or update `章节摘要/第NNN章_摘要.md`.
- [x] 4.4 Implement post-chapter state updates for recent context,角色状态,世界状态,关系状态,未解决问题,连续性风险, and伏笔账本.
- [x] 4.5 Add original text anchor recording for important伏笔 in `04_伏笔与期待/伏笔账本.md`.

## 5. AI Review Workflow

- [x] 5.1 Add generation for `08_AI审稿/第NNN章_审稿.md` when chapter N正文 is ready for review.
- [x] 5.2 Ensure AI review checks chapter正文 against章节规划,设定圣经,已确认决定,大纲,伏笔与期待, and前情与状态.
- [x] 5.3 Ensure AI review evaluates reader-retention quality including读者承诺,章尾钩子,主角主动性,情绪回报,爽点, tension, or mystery.
- [x] 5.4 Ensure AI review lists required state updates and keeps recommendations advisory until author approval.
- [x] 5.5 Ensure AI review output contains actionable sections: 总评, 章节规划符合度, 读者期待, 伏笔检查, 连续性检查, 角色一致性, and 建议修改.

## 6. Verification

- [x] 6.1 Add tests or fixture checks proving project initialization creates all required Chinese paths and templates.
- [x] 6.2 Add tests or fixture checks proving `当前步骤.md` progression respects confirmation gates and author edits.
- [x] 6.3 Add tests or fixture checks proving chapter N uses bounded context rather than all previous正文 files.
- [x] 6.4 Add tests or fixture checks proving post-chapter review updates continuity and foreshadowing state.
- [x] 6.5 Run the project test suite or relevant verification commands and record results.
