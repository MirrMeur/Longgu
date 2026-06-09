# 龙骨 Longgu：中文网文创作工程化 Harness 整体规划

> 目标：龙骨 Longgu 是一个面向中文商业网文创作的工程化 harness，而不是单纯的 AI 写作壳。它负责把“开书、拆卷、拆章、生成、审计、修订、状态沉淀、复盘评测”组织成可重复、可验证、可扩展的生产流程。

---

## 一、项目定位

### 1.0 品牌命名

项目名：龙骨 Longgu。

一句话：中文网文创作工程化 Harness。

CLI：`longgu`。

包名规划：

- `@longgu/core`
- `@longgu/cli`
- `@longgu/genre-cards`

“龙骨”本身有骨架、主梁、支撑结构的含义，贴合本项目要解决的核心问题：撑住长篇网文的大纲、伏笔、状态账本、章节节奏和正文审计。Longgu 不是一个普通写作 SaaS 名称，而是强调长篇结构支撑和工程化生产线。

### 1.1 核心定义

龙骨 Longgu 的 harness 指的是一套围绕网文创作流程的工程编排系统：

- 把创作输入拆成稳定规格：题材、主角引擎、金手指、世界观、力量体系、角色关系、卷目标、章节目标。
- 把写作过程拆成可执行命令：开书、拆卷、拆章、写章、审计、修订、沉淀状态。
- 把质量检查变成机器可读结果：冲突、OOC、节奏、爽点、章尾钩子、伏笔、AI 味、信息泄露。
- 把长篇一致性存入状态账本：人物、地点、势力、时间线、能力、资源、伏笔、读者承诺。
- 把每次生成和修订留下证据：模型、提示词、上下文、审计结果、修订 diff、成本估算。

### 1.2 与现有项目的区别

已有项目大多偏向以下方向：

- AI 写作 GUI。
- Prompt 工作流集合。
- 多 Agent 自动生成。
- 规格驱动写作方法论。
- 写作 SaaS 或桌面平台。

本项目优先做的是“创作生产线的测试框架和状态管理层”。它不追求一开始就有完整 GUI，而是先把核心流程做扎实：

- CLI 优先，便于开发、自动化和复现。
- 文件优先，所有中间产物可读、可审查、可版本管理。
- 中文男频网文优先，类型卡和审计规则围绕实际连载需求设计。
- 模型无关，支持 OpenAI-compatible 接口、国产模型、本地模型。
- 审计闭环优先，生成只是流程的一环。

### 1.3 目标用户

- 想长期连载、但需要 AI 辅助控节奏和一致性的作者。
- 想批量测试不同题材、开篇、风格和模型组合的创作团队。
- 想研究 AI 网文工程化生产链路的开发者。
- 想在 Codex、Claude Code、Cursor 等编码助手里写小说项目的人。

### 1.4 非目标

初期不做以下事情：

- 不先做大而全 SaaS。
- 不先做复杂富文本编辑器。
- 不承诺完全自动写出可直接发表的长篇。
- 不做抄袭式风格模仿。
- 不把“去 AI 味”包装成单个按钮，而是拆成可检查、可修订的具体问题。

---

## 二、完整形态愿景

完整形态是一个“中文网文创作 CI/CD 系统”：

```text
开书规格
  -> 类型适配
  -> 世界观/人物/金手指/力量体系建模
  -> 分卷规划
  -> 章节规划
  -> 上下文组装
  -> 章节生成
  -> 多维审计
  -> 定点修订
  -> 状态沉淀
  -> 连载复盘
  -> 下一章生产
```

最终项目应具备四层能力：

1. 创作规格层：把模糊想法变成可执行的小说工程规格。
2. 状态记忆层：持续维护长篇事实、伏笔、人物、时间线和读者承诺。
3. 写审改流水线：按章节目标生成正文，并用审计结果驱动修订。
4. 评测与运营层：追踪成本、质量、节奏、读者预期和题材表现。

---

## 三、总体架构

### 3.1 推荐技术路线

第一阶段建议使用 TypeScript + Node.js：

- CLI：`commander` 或 `oclif`
- 数据校验：`zod`
- 本地状态：JSON + SQLite
- 文档格式：Markdown
- LLM 接口：OpenAI-compatible adapter
- 测试：Vitest
- 后续 Web：Vite + React

选择 TypeScript 的原因：

- 类型约束适合维护复杂 story state。
- Zod schema 能把 LLM 输出变成可验证结构。
- CLI、Web、插件系统可以共享核心包。
- 更适合后续扩展为桌面端或 Web Studio。

### 3.2 项目目录规划

```text
longgu/
  packages/
    core/                    # 创作状态、schema、上下文组装、审计引擎
    cli/                     # 命令行入口
    adapters/                # LLM provider、embedding provider、存储 provider
    genre-cards/             # 中文网文类型规则
    studio/                  # 后续 Web 工作台
  templates/
    project/                 # 新项目模板
    prompts/                 # prompt 模板
    audit-rules/             # 审计规则模板
  examples/
    xuanhuan-demo/
    urban-system-demo/
  docs/
    architecture.md
    commands.md
    state-schema.md
    audit-rules.md
```

### 3.3 小说项目目录规划

每一本小说都是一个可版本管理的独立工作区：

```text
my-longgu-novel/
  longgu.yaml                 # 项目配置、模型路由、目标字数、题材
  bible/
    premise.md               # 一句话卖点、主线矛盾、读者承诺
    world.md                 # 世界观
    power-system.md          # 力量体系/职业体系/资源体系
    characters.md            # 角色初始设定
    factions.md              # 势力
    style.md                 # 文风约束
  outlines/
    book.md                  # 全书大纲
    volume-001.md            # 分卷大纲
    chapters.md              # 章节列表
  chapters/
    001.md
    002.md
  state/
    truth.json               # 全局事实
    characters.json          # 角色状态
    timeline.json            # 时间线
    hooks.json               # 伏笔账本
    reader-promises.json     # 读者承诺与兑现记录
    resources.json           # 境界、物品、金钱、势力资源
  audits/
    001.audit.json
    002.audit.json
  runs/
    2026-06-08T22-30-00/     # 每次生成的上下文、提示词、模型输出、成本
```

---

## 四、版本路线图

## V0.1：最小可用 CLI Harness

### 目标

建立项目骨架，让用户可以初始化一本小说、配置模型、生成第一章，并保留运行记录。

### 功能范围

- `longgu init`：初始化小说项目目录。
- `longgu doctor`：检查配置、API key、模型连接、文件结构。
- `longgu write chapter --id 001`：根据基础设定生成单章。
- `longgu run show`：查看最近一次生成的输入、输出、模型和耗时。
- 支持一个 OpenAI-compatible provider。
- 所有输入输出落盘，不能只存在内存里。

### 工程产物

- CLI 包。
- `longgu.yaml` schema。
- 基础 prompt 模板。
- 运行记录目录 `runs/`。
- 示例项目 `examples/xuanhuan-demo/`。

### 验收标准

- 新用户能用 3 条命令完成初始化、检查、生成第一章。
- 每次生成都有完整运行记录。
- LLM 返回失败时有明确错误信息，不吞异常。
- 生成章节可复现：能看到当时使用的上下文和 prompt。

---

## V0.2：小说规格与章节规划

### 目标

从“直接写一章”升级到“先建立开书规格，再拆分卷和章节”。

### 功能范围

- `longgu plan book`：生成或完善全书规格。
- `longgu plan volume --id 001`：生成分卷目标、冲突阶梯、爽点安排。
- `longgu plan chapters --volume 001`：拆章节列表。
- 建立 `bible/` 与 `outlines/` 的结构化文档。
- 支持人工编辑后继续流程，不强制全自动覆盖。
- 引入 `novel-outline-checker` 的宏观检查逻辑，用于开书规格、题材定位、主角引擎、金手指、力量体系、长线冲突和留存风险检查。
- 引入 `novel-chapter-checker` 的章节规划检查逻辑，用于分卷目标、章节节奏、爽点密度、场景顺序和章尾钩子检查。

### 工程产物

- 开书规格 schema。
- 分卷规格 schema。
- 章节卡 schema。
- 规划 prompt 模板。
- `macro-outline-review` prompt pack。
- `chapter-plan-review` prompt pack。
- 人工确认机制：生成内容默认写入 draft，确认后进入正式文件。

### 验收标准

- 可以从一句话题材生成完整开书材料草稿。
- 分卷大纲必须包含阶段目标、主要敌人、资源变化、结尾钩子。
- 章节列表必须包含每章目标、冲突、爽点、信息增量、章尾钩子。
- 开书和章节规划必须能输出结构化 review，不只输出自然语言建议。
- 用户手改规格后，后续命令读取的是手改后的版本。

---

## V0.3：状态账本与长篇一致性

### 目标

引入可机器校验的 story state，让写作不只依赖向量检索和短摘要。

### 功能范围

- `longgu state init`：初始化状态账本。
- `longgu state inspect`：查看角色、伏笔、时间线、资源等状态。
- `longgu settle chapter --id 001`：从章节正文提取状态变化。
- 建立以下账本：
  - `truth.json`
  - `characters.json`
  - `timeline.json`
  - `hooks.json`
  - `reader-promises.json`
  - `resources.json`
- LLM 输出必须通过 schema 校验。
- 状态更新采用 delta，不让模型整份重写状态文件。

### 工程产物

- 状态 schema。
- 状态 delta schema。
- settle prompt。
- 状态 merge 逻辑。
- 状态冲突检测基础规则。

### 验收标准

- 写完一章后能自动提取人物状态、地点变化、资源变化、伏笔变化。
- 状态更新有 diff 记录。
- 非法状态更新会被拒绝并要求模型重新输出。
- 同一个伏笔可以记录 `opened`、`mentioned`、`delayed`、`resolved`。

---

## V0.4：章节审计系统

### 目标

建立真正的质量门禁，让每章都有可追踪的审计结果。

### 功能范围

- `longgu audit chapter --id 001`：对章节进行多维审计。
- 输出 `audits/001.audit.json`。
- 审计结果分级：`critical`、`warning`、`info`。
- 接入 `novel-chapter-checker` 作为章节计划与章节草稿的节奏审计来源。
- 接入 `novel-prose-checker` 作为正文质感、AI 味、对话压力和场景真实感审计来源。
- 第一批审计维度：
  - 角色 OOC
  - 时间线冲突
  - 设定冲突
  - 战力/资源崩坏
  - 伏笔遗漏
  - 爽点虚化
  - 章尾钩子弱
  - 流水账
  - AI 解释腔
  - 套话密度
  - 信息越界
  - 章节目标偏离

### 工程产物

- 审计 schema。
- 审计规则 registry。
- 审计 prompt 模板。
- `chapter-plan-audit.schema.ts`。
- `prose-audit.schema.ts`。
- 审计报告 Markdown 投影。
- 按 genre 调整审计权重。

### 验收标准

- 每条问题都必须包含位置、原因、严重级别、建议修复方式。
- `novel-chapter-checker` 的 `P0/P1/P2` 必须映射到 harness 的 `critical/warning/info`。
- `novel-prose-checker` 的 AI 味、场景压力、角色声线、可读性评分必须进入审计结果。
- critical 问题会阻断自动进入下一章。
- warning 问题可以进入修订队列。
- 审计结果能被后续 revise 命令读取。

---

## V0.5：定点修订与写审改闭环

### 目标

从“发现问题”升级到“按审计结果定点修复”，形成第一版闭环。

### 功能范围

- `longgu revise chapter --id 001`：根据审计结果修订章节。
- 修订模式：
  - `spot-fix`：只修问题片段。
  - `polish`：润色但不改剧情。
  - `rewrite-scene`：重写指定场景。
- `rewrite-chapter`：整章重写。
- 修订前后保留 diff。
- 修订后自动重跑关键审计项。
- 使用 `novel-prose-checker` 的 Rewrite Patch Mode 作为定点修订的第一版策略来源。

### 工程产物

- 修订 prompt。
- `prose-rewrite-patch` prompt pack。
- patch/diff 工具。
- 修订策略选择器。
- 二次审计流程。
- 修订历史记录。

### 验收标准

- 普通问题默认定点修复，不整章重写。
- 修订不能破坏状态账本。
- 修订前后能看到差异。
- 修订后 critical 问题数量必须下降，否则标记为失败。

---

## V0.6：中文网文类型卡

### 目标

把项目从“通用小说工具”升级为“中文商业网文专用 harness”。

### 功能范围

- 类型卡 registry：
  - 玄幻
  - 仙侠
  - 都市
  - 都市系统
  - 历史
  - 科幻
  - 游戏/系统
  - 悬疑灵异
- 每个类型卡包含：
  - 主角引擎
  - 爽点模式
  - 常见节奏
  - 升级体系
  - 读者雷点
  - 章尾钩子模式
  - 审计权重
  - 开篇 10 章检查重点

### 工程产物

- `packages/genre-cards/`。
- 从三个现有 skill 的 reference cards 迁移第一批类型规则：
  - `novel-outline-checker/references/genre-cards.md`
  - `novel-chapter-checker/references/genre-beat-cards.md`
  - `novel-prose-checker/references/genre-prose-cards.md`
- genre schema。
- 类型卡测试样例。
- prompt 注入机制。

### 验收标准

- 同一章节目标在不同 genre 下会产生不同规划和审计重点。
- 都市系统不会被玄幻式战力审计误伤。
- 悬疑类会更重视信息遮蔽、误导和线索公平性。
- 玄幻类会更重视境界、资源、势力阶梯和压迫感。

---

## V0.7：上下文组装与记忆检索

### 目标

让模型每次写作拿到“刚好够用”的上下文，降低 token 成本和遗漏风险。

### 功能范围

- `longgu context build --chapter 001`：构建章节上下文包。
- 上下文来源：
  - 当前章节卡
  - 分卷目标
  - 最近章节摘要
  - 相关角色状态
  - 相关伏笔
  - 时间线约束
  - 类型卡规则
  - 风格约束
- 支持 SQLite FTS 或本地 embedding 检索。
- 上下文包落盘，便于复盘。

### 工程产物

- context builder。
- relevance scorer。
- token budget manager。
- chapter summary schema。
- SQLite 存储层。

### 验收标准

- 上下文包可解释：每段上下文说明来源和被选中的原因。
- 超过 token budget 时能降级，而不是直接失败。
- 关键状态，如当前境界、敌我关系、未兑现伏笔，不能被裁掉。
- 写作成本可在 run 记录中统计。

---

## V0.8：模型路由与成本控制

### 目标

支持不同任务使用不同模型，降低整体成本。

### 功能范围

- `longgu model list`：列出已配置模型。
- `longgu cost report`：统计运行成本。
- 模型路由：
  - planning model
  - drafting model
  - audit model
  - revise model
  - settle model
- 支持 OpenAI-compatible 多 provider。
- 支持按章节重要性选择模型强度。

### 工程产物

- provider adapter。
- model router。
- cost calculator。
- retry/backoff。
- fallback model 配置。

### 验收标准

- 用户可以配置多个 provider。
- 单个模型失败时可以按策略 fallback。
- 每次 run 记录输入输出 token、估算成本、耗时。
- 关键章节可以自动升级到强模型。

---

## V0.9：批量生产与实验评测

### 目标

让用户可以批量测试题材、开篇、模型、prompt 和审计规则。

### 功能范围

- `longgu experiment create`：创建实验。
- `longgu experiment run`：批量生成多个方案。
- `longgu experiment compare`：对比审计结果、成本、人工评分。
- 支持 A/B 测试：
  - 不同开篇冲突
  - 不同主角动机
  - 不同金手指
  - 不同模型组合
  - 不同章节钩子

### 工程产物

- experiment schema。
- batch runner。
- result aggregator。
- report generator。
- 人工评分表。

### 验收标准

- 同一题材能批量生成多个开篇版本。
- 每个版本都有审计报告和成本记录。
- 可以按爽点强度、钩子强度、AI 味、设定冲突数量排序。
- 人工评分能回写并参与后续比较。

---

## V1.0：稳定版 Harness

### 目标

形成可以长期使用的中文网文创作工程系统。

### 功能范围

- 完整 CLI。
- 稳定 schema。
- 多 genre 支持。
- 写作、审计、修订、状态沉淀闭环。
- 模型路由和成本统计。
- 批量实验。
- 完整文档。
- 示例项目。
- 测试覆盖核心状态和审计逻辑。

### 工程产物

- `packages/core`
- `packages/cli`
- `packages/adapters`
- `packages/genre-cards`
- `templates`
- `examples`
- `docs`
- 发布脚本

### 验收标准

- 能稳定支持一本 30 万字级别小说的持续创作流程。
- 中途修改设定、角色、分卷目标后，后续章节能正确读取新状态。
- 所有章节都能追溯生成上下文、模型、审计、修订和状态变化。
- 不依赖单一模型供应商。
- 核心命令有自动化测试。

---

## 五、V1.0 后增强路线

## V1.1：Web Studio

### 目标

给非开发用户提供可视化工作台。

### 功能范围

- 项目浏览。
- 章节编辑。
- 审计报告可视化。
- 状态账本查看。
- 伏笔看板。
- 时间线看板。
- 模型成本看板。

### 注意

Web Studio 不能替代 CLI 和文件系统。它只是更友好的操作层，核心逻辑仍在 `packages/core`。

---

## V1.2：插件系统

### 目标

允许用户扩展 genre、审计规则、provider、导出格式。

### 功能范围

- 自定义审计规则。
- 自定义 genre card。
- 自定义 prompt pack。
- 自定义导出器。
- 插件版本约束。

---

## V1.3：协作与多人流程

### 目标

支持作者、编辑、审稿人、运营共同维护项目。

### 功能范围

- 审计评论。
- 人工任务队列。
- 修改建议状态。
- 章节锁。
- 版本对比。

---

## V1.4：平台化能力

### 目标

如果要做商业产品，再补平台运营能力。

### 功能范围

- 用户管理。
- 项目权限。
- 模型额度。
- 用量计费。
- 队列 worker。
- 管理后台。

### 注意

这不是早期目标。平台化必须建立在 harness 本身足够稳定之后。

---

## 六、关键设计原则

### 6.1 文件可读优先

所有核心产物都应该能被人直接读懂。即使没有 GUI，用户也能通过 Markdown 和 JSON 理解项目状态。

### 6.2 Schema 优先

LLM 输出必须落到 schema 上。凡是进入状态账本的内容，都不能只靠自由文本。

### 6.3 人工可介入

所有自动生成结果都允许人工编辑。harness 的职责是组织和校验，不是强迫用户接受模型输出。

### 6.4 审计驱动修订

修订不能靠一句“润色一下”。每次修订都必须知道在修什么、为什么修、修完是否解决。

### 6.5 成本透明

每次调用都记录模型、token、耗时、成本估算。长篇生产必须知道钱花在哪里。

### 6.6 类型规则内置

中文网文不是通用小说。类型差异必须进入规划、上下文和审计，而不是只写在 prompt 里。

---

## 七、优先级排序

第一优先级：

1. CLI 初始化与运行记录。
2. 小说规格和章节规划。
3. 状态账本。
4. 章节审计。
5. 定点修订。

第二优先级：

1. 类型卡。
2. 上下文组装。
3. 模型路由。
4. 成本统计。

第三优先级：

1. 批量实验。
2. Web Studio。
3. 插件系统。
4. 协作和平台化。

---

## 八、第一阶段建议实施顺序

如果从零开始，建议按这个顺序落地：

1. 建 TypeScript monorepo。
2. 做 `longgu init` 和项目模板。
3. 定义 `longgu.yaml`、chapter card、run record schema。
4. 接入一个 OpenAI-compatible provider。
5. 做 `write chapter`，保留完整 run 记录。
6. 做 `plan book`、`plan volume`、`plan chapters`。
7. 迁移 `novel-outline-checker`，做 `audit outline` 的最小版本。
8. 迁移 `novel-chapter-checker`，做 `audit chapter-plan` 的最小版本。
9. 做 `state settle` 的最小版本。
10. 迁移 `novel-prose-checker`，做 `audit chapter --prose` 的最小版本。
11. 做 `revise chapter` 的最小版本。
12. 用一个玄幻 demo 跑通前 10 章。

这个顺序的关键是先跑通“章节生产闭环”，不要一开始陷入 GUI、SaaS、插件系统和复杂 RAG。

---

## 九、最小成功标准

项目早期不要用“能不能自动写完整本书”作为成功标准。更合理的最小成功标准是：

- 能从一句话题材生成一本书的基础规格。
- 能拆出一卷和 10 个章节卡。
- 能生成第 1 章正文。
- 能审计第 1 章的问题。
- 能按审计结果修订第 1 章。
- 能从第 1 章沉淀人物、伏笔、时间线和资源变化。
- 能用沉淀状态继续生成第 2 章。

只要这个闭环可靠，就已经比大多数“提示词壳”更有工程价值。

---

## 十、现有 Codex Skills 接入方案

当前已有三个 Codex skill 可以作为 harness 的第一批领域知识资产：

```text
/Users/a17826856385/.codex/skills/novel-outline-checker
/Users/a17826856385/.codex/skills/novel-chapter-checker
/Users/a17826856385/.codex/skills/novel-prose-checker
```

它们不应该作为运行时外部依赖直接调用，而应该迁移成 harness 内部的 prompt pack、genre card、audit schema 和规则 registry。

### 10.1 Skill 分层映射

| Skill | Harness 层级 | 对应命令 | 主要产物 |
|---|---|---|---|
| `novel-outline-checker` | 宏观开书层 | `longgu plan book`、`longgu audit outline` | `macro_audit.json`、开书重建建议 |
| `novel-chapter-checker` | 分卷/章节层 | `longgu plan chapters`、`longgu audit chapter-plan` | `chapter_plan_audit.json`、章节顺序修复建议 |
| `novel-prose-checker` | 正文/修订层 | `longgu audit chapter`、`longgu revise chapter` | `prose_audit.json`、定点修订 patch |

### 10.2 迁移后的目录结构

```text
packages/
  genre-cards/
    macro/
      xuanhuan.md
      xianxia.md
      urban.md
      historical.md
      sci-fi.md
      game-system.md
      supernatural-mystery.md
    beat/
      xuanhuan.md
      xianxia.md
      urban.md
      historical.md
      sci-fi.md
      game-system.md
      supernatural-mystery.md
    prose/
      xuanhuan.md
      xianxia.md
      urban.md
      historical.md
      sci-fi.md
      game-system.md
      supernatural-mystery.md
  audit-rules/
    macro-outline.ts
    chapter-plan.ts
    prose.ts
  prompts/
    macro-outline-review.md
    chapter-plan-review.md
    prose-review.md
    prose-rewrite-patch.md
  schemas/
    macro-audit.schema.ts
    chapter-plan-audit.schema.ts
    prose-audit.schema.ts
```

### 10.3 结构化输出要求

三个 skill 目前的输出格式偏 Markdown，适合人工阅读。进入 harness 后必须改成 JSON-first，再生成 Markdown 投影。

宏观大纲审计输出：

```json
{
  "genreLens": "xuanhuan",
  "loadedCards": ["macro/xuanhuan"],
  "readerContract": "...",
  "commercialClarityScore": 8,
  "durabilityScore": 7,
  "issues": [
    {
      "priority": "P1",
      "severity": "warning",
      "area": "golden_finger",
      "problem": "...",
      "fix": "..."
    }
  ],
  "rebuildSuggestions": ["..."]
}
```

章节规划审计输出：

```json
{
  "genreLens": "urban",
  "loadedCards": ["beat/urban"],
  "retentionScore": 7,
  "draftReadinessScore": 8,
  "beatMap": [
    {
      "unit": "Ch 1",
      "function": "Pressure",
      "payoff": "...",
      "risk": "...",
      "fix": "..."
    }
  ],
  "issues": []
}
```

正文审计输出：

```json
{
  "genreLens": "supernatural-mystery",
  "loadedCards": ["prose/supernatural-mystery"],
  "aiFlavorScore": 6,
  "scenePressureScore": 7,
  "characterVoiceScore": 6,
  "readabilityScore": 8,
  "findings": [
    {
      "priority": "P0",
      "severity": "critical",
      "location": "paragraph 12",
      "problem": "...",
      "suggestedPatchMode": "spot-fix"
    }
  ]
}
```

### 10.4 优先级映射

Codex skill 里的 `P0/P1/P2` 应该映射到 harness 审计系统：

| Skill Priority | Harness Severity | 行为 |
|---|---|---|
| `P0` | `critical` | 阻断自动进入下一阶段，必须修 |
| `P1` | `warning` | 进入修订队列，可人工放行 |
| `P2` | `info` | 作为增强建议，不阻断 |

### 10.5 接入顺序

第一步接入 `novel-outline-checker`：

- 迁移 macro genre cards。
- 建立 `macro-audit.schema.ts`。
- 支持 `longgu audit outline`。
- 让 `longgu plan book` 生成后自动跑一次宏观审计。

第二步接入 `novel-chapter-checker`：

- 迁移 beat cards。
- 建立 `chapter-plan-audit.schema.ts`。
- 支持 `longgu audit chapter-plan`。
- 在 `longgu plan chapters` 后检查章节列表是否具备起钩、冲突、转折、爽点和尾钩。

第三步接入 `novel-prose-checker`：

- 迁移 prose cards。
- 建立 `prose-audit.schema.ts`。
- 支持 `longgu audit chapter --prose`。
- 支持 `longgu revise chapter --mode spot-fix`。

### 10.6 工程注意点

- Skill 内容不能只作为大段 prompt 塞进模型，每次调用要按 genre 和任务裁剪上下文。
- Reference cards 要拆分成独立类型文件，避免每次审计加载全量类型规则。
- 每条审计结果必须可定位、可修复、可复查。
- 人工可读 Markdown 报告由 JSON 生成，不能反过来从 Markdown 里解析状态。
- 这三个 skill 只覆盖创作质量层，不覆盖 provider、状态账本、成本统计、运行记录和 CLI 编排。

---

## 十一、最终判断

这个项目要赢，不靠“模型更强”或“按钮更多”，而靠三件事：

1. 把中文网文创作知识结构化。
2. 把长篇状态维护工程化。
3. 把写审改流程变成可验证闭环。

如果按这个路线推进，它可以避开已有项目的主要短板：不被 GUI 绑架，不被单一 Agent 流水线拖高成本，不只做 prompt 集合，也不急着做 SaaS。先把 harness 内核做扎实，再决定是否扩展成桌面端、Web Studio 或平台产品。
