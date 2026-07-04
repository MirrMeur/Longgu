## ADDED Requirements

### Requirement: Chinese user guide exists
The system SHALL provide a Chinese-first user guide for the Claude Code-first Longgu workflow.

#### Scenario: Reader starts from user guide
- **WHEN** a user opens the Longgu usage documentation
- **THEN** the documentation SHALL explain how to initialize a novel project, open it in Claude Code, choose Longgu skills, and proceed from `当前步骤.md`

#### Scenario: Documentation states product stance
- **WHEN** the user reads the introduction
- **THEN** the documentation SHALL state that Longgu is Claude Code-first and agent-first, and that normal usage does not require configuring a generic LLM provider first

#### Scenario: Documentation rejects old positioning
- **WHEN** the user reads the positioning section
- **THEN** the documentation SHALL state that Longgu is not a model configurator, not a generic LLM platform, and not a compatibility shell

### Requirement: Init flow is documented as Claude Code-first
The documentation SHALL explain the new `longgu init` behavior as a workflow starter.

#### Scenario: User reads init behavior
- **WHEN** the documentation describes `longgu init`
- **THEN** it SHALL state that initialization generates a Chinese novel project directory, Claude Code skill directory, and Chinese next-step instructions

#### Scenario: User expects provider setup
- **WHEN** the documentation describes initialization
- **THEN** it SHALL state that initialization does not ask for provider, API key, model, or compatibility mode configuration in the main path

### Requirement: Documentation explains next-step workflow
The documentation SHALL explain the user-facing workflow after initialization.

#### Scenario: User wants next action
- **WHEN** the user asks what to do after initialization
- **THEN** the documentation SHALL direct them to read `当前步骤.md`, edit the listed files, and use a Longgu skill to continue

#### Scenario: User hand-edits files
- **WHEN** the documentation describes editing project files
- **THEN** it SHALL state that author hand-edited files are authoritative and should not be overwritten unless the author explicitly requests it

#### Scenario: User reads current step behavior
- **WHEN** the documentation describes `当前步骤.md`
- **THEN** it SHALL list that the file shows current stage, required files, editable files, downstream impact, next outputs, and allowed replies

#### Scenario: User needs reply examples
- **WHEN** the documentation describes allowed replies
- **THEN** it SHALL include examples such as `继续推进当前步骤`, `我改好了，按当前文件继续推进`, `批准当前步骤，进入下一步`, and `解释当前步骤为什么要看这些文件`

### Requirement: CLI command list is documented
The documentation SHALL include a CLI command list grouped by user relevance.

#### Scenario: User reads CLI command list
- **WHEN** the user reads the command list
- **THEN** commands SHALL be grouped into main path commands, installation/development commands, verification commands, and advanced provider-backed commands

#### Scenario: User sees main path commands
- **WHEN** main path commands are listed
- **THEN** the documentation SHALL include `longgu init` and `longgu --version`

#### Scenario: User sees development commands
- **WHEN** development commands are listed
- **THEN** the documentation SHALL include `npm ci`, `npm run build`, `npm link`, and `npm run dev:cli -- ...`

#### Scenario: User sees verification commands
- **WHEN** verification commands are listed
- **THEN** the documentation SHALL include `npm run typecheck`, `npm test`, and `openspec validate --all`

#### Scenario: User sees provider-backed commands
- **WHEN** provider-backed commands such as `longgu write chapter` or `longgu audit chapter` are listed
- **THEN** the documentation SHALL mark them as advanced or legacy paths that may require provider configuration

### Requirement: Claude Code skills tree is documented
The documentation SHALL include a Claude Code skills directory tree and describe each Longgu skill.

#### Scenario: User reads skills tree
- **WHEN** the user reads the skills section
- **THEN** it SHALL list `longgu-start`, `longgu-plan`, `longgu-write`, `longgu-review`, `longgu-state`, and `longgu-help`

#### Scenario: User reads skill responsibilities
- **WHEN** the user reads each skill entry
- **THEN** the documentation SHALL explain what the skill does and include an example Chinese invocation phrase

#### Scenario: User reads skill split rationale
- **WHEN** the documentation explains multi-skill structure
- **THEN** it SHALL state that each skill owns one workflow segment, keeps context cleaner, and avoids mixing start, drafting, and review rules in one skill

### Requirement: Initialized file tree example is documented
The documentation SHALL show an example file tree after `longgu init`.

#### Scenario: User inspects initialized project example
- **WHEN** the user reads the initialized file tree section
- **THEN** the documentation SHALL show root files, `.claude/skills/`, and the numbered Chinese novel directories from `01_立项设定/` through `08_AI审稿/`

#### Scenario: File tree distinguishes author assets and agent skills
- **WHEN** the initialized file tree is shown
- **THEN** the documentation SHALL distinguish author-editable novel assets from Claude Code skill files

#### Scenario: User reads root files
- **WHEN** root files are documented
- **THEN** the documentation SHALL include `当前步骤.md`, `创作流程.md`, `已确认决定.md`, and `项目说明.md`

#### Scenario: User reads directory guides
- **WHEN** Chinese project directories are documented
- **THEN** the documentation SHALL state that each directory includes `_说明.md`

### Requirement: Chapter planning is documented as Chinese single-chapter task files
The documentation SHALL describe chapter planning as Chinese single-chapter task files.

#### Scenario: User reads chapter planning section
- **WHEN** the documentation describes chapter planning
- **THEN** it SHALL use the path pattern `06_章节规划/第NNN章_规划.md`

#### Scenario: User reads chapter plan contents
- **WHEN** chapter plan contents are listed
- **THEN** the documentation SHALL include chapter role, must happen, must not happen, reader hooks, payoff, foreshadowing, ending hook, and continuity risks

### Requirement: Prior context and state are documented as separate longform continuity assets
The documentation SHALL describe `05_前情与状态/` as the continuity and compressed-context area.

#### Scenario: User reads state files
- **WHEN** the documentation lists prior-context and state files
- **THEN** it SHALL include `总前情.md`, `当前卷前情.md`, `近期前情.md`, `章节摘要/`, `角色状态.md`, `世界状态.md`, `关系状态.md`, `未解决问题.md`, and `连续性风险.md`

#### Scenario: User reads state purpose
- **WHEN** the documentation describes state purpose
- **THEN** it SHALL explain that these files prevent repetition, forgotten plot hooks, characterization drift, world-rule conflicts, and context explosion

#### Scenario: User reads chapter context policy
- **WHEN** the documentation describes writing a new chapter
- **THEN** it SHALL state that the default context reads compressed context, state, current chapter plan, and previous chapter body rather than full historical chapter text

### Requirement: AI review is documented as a formal workflow step
The documentation SHALL describe AI review as a first-class chapter workflow step.

#### Scenario: User reads AI review output
- **WHEN** AI review is documented
- **THEN** it SHALL use the path pattern `08_AI审稿/第NNN章_审稿.md`

#### Scenario: User reads AI review checks
- **WHEN** review checks are listed
- **THEN** the documentation SHALL include checks for chapter plan fit, bible fit, reader promise fit, ending hook, outline progress, foreshadowing misuse, forgotten payoff, passive protagonist, continuity conflict, and AI-like prose

#### Scenario: User reads AI review authority
- **WHEN** AI review behavior is documented
- **THEN** it SHALL state that review only gives suggestions, does not automatically override author decisions, and final decisions belong to the author

### Requirement: Chapter loop is documented
The documentation SHALL describe the per-chapter closed loop.

#### Scenario: User reads chapter loop
- **WHEN** the documentation describes chapter progression
- **THEN** it SHALL list the loop as chapter planning, prose, AI review, chapter summary, continuity/state updates, and next chapter

### Requirement: Code-level changes are documented
The documentation SHALL include a code-level change summary for maintainers.

#### Scenario: Maintainer reads code summary
- **WHEN** the documentation lists implementation files
- **THEN** it SHALL mention `src/core/workspace.ts`, `src/core/guidedWorkflow.ts`, `src/core/context.ts`, `src/core/bookPlan.ts`, `src/core/summary.ts`, `src/core/audit.ts`, `src/core/state.ts`, `src/test/testUtils.ts`, and `package.json`

#### Scenario: Maintainer reads build fix summary
- **WHEN** `package.json` changes are described
- **THEN** the documentation SHALL mention the build target fix to `tsconfig.json`, post-build executable bit handling, and `npm link` permission-denied prevention

### Requirement: CLI Chinese experience and verification are documented
The documentation SHALL record the intended CLI Chinese user experience and validation status.

#### Scenario: User reads CLI prompt examples
- **WHEN** CLI experience is described
- **THEN** the documentation SHALL include Chinese examples such as `下一步：用 Claude Code 打开项目`, `输入：使用 longgu-start`, `按 当前步骤.md 填写立项设定`, and `填好后说：继续推进当前步骤`

#### Scenario: User reads verification status
- **WHEN** verification status is documented
- **THEN** the documentation SHALL include `npm run typecheck`, `npm test`, and `openspec validate --all` as required checks
