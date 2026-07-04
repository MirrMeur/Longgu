# Longgu Claude Code-first 使用说明

Longgu 现在的定位是：

> Claude Code-first 的中文网文长篇 workflow 启动器。

它不是模型配置器，不是通用 LLM 平台，也不是 OpenAI-compatible 兼容壳。推荐路径不是先填写 provider、API key、model，再让 CLI 直接调模型；推荐路径是先用 `longgu init` 生成中文小说项目和 Claude Code skills，然后在 Claude Code 里按 `当前步骤.md` 推进。

## 1. 这次改动本质

Longgu 从“要配 LLM 的小说工具”改成：

> Claude Code-first 的中文网文长篇 workflow 启动器。

这意味着：

- 不把 provider 配置当主入口。
- 不把 model 选择当主入口。
- 不把 API key 配置当主入口。
- 不做通用 LLM 平台。
- 不做兼容壳。
- 把 Claude Code skills 和中文项目文件当主入口。

## 2. 初始化方式

`longgu init` 现在目标是：

1. 生成中文小说项目目录。
2. 生成 Claude Code 可用 skill 目录。
3. 用中文提示下一步怎么做。

初始化时不再做这些事：

- 不问 provider。
- 不问 API key。
- 不配 model。
- 不做兼容模式。

初始化后直接生成：

- 小说项目结构。
- 当前步骤文件：`当前步骤.md`。
- 创作流程文件：`创作流程.md`。
- 多个 Claude Code skills。

推荐入口：

```bash
longgu init 我的小说
cd 我的小说
claude
```

进入 Claude Code 后，先看 `当前步骤.md`，再使用 Longgu skills。

## 3. 初始化后怎么用

核心入口是 `当前步骤.md`。用户不需要猜下一步看什么。

`当前步骤.md` 会明确：

- 当前阶段。
- 要看哪些文件。
- 能改哪些文件。
- 改了影响什么。
- 下一步生成什么。
- 可以怎么回复。

常见回复：

- `继续推进当前步骤`
- `我改好了，按当前文件继续推进`
- `批准当前步骤，进入下一步`
- `解释当前步骤为什么要看这些文件`

作者可以直接修改项目里的中文 Markdown 文件。作者手改优先级最高，后续生成和审稿必须以作者手改为准，除非作者明确要求覆盖。

## 4. Claude Code skills 结构

Longgu 不再把所有规则塞进一个 `longgu` skill，而是拆成一组 workflow skills：

```text
.claude/
└── skills/
    ├── longgu-start/
    │   └── SKILL.md
    ├── longgu-plan/
    │   └── SKILL.md
    ├── longgu-write/
    │   └── SKILL.md
    ├── longgu-review/
    │   └── SKILL.md
    ├── longgu-state/
    │   └── SKILL.md
    └── longgu-help/
        └── SKILL.md
```

各 skill 职责：

- `longgu-start`：立项/开书。用于确定题材、目标读者、故事卖点、读者承诺和不写什么。示例：`使用 longgu-start 开始立项。`
- `longgu-plan`：设定、大纲、分卷、章节规划。用于把立项文件推进成设定圣经、全书大纲、分卷大纲和单章规划。示例：`使用 longgu-plan 继续规划下一章。`
- `longgu-write`：写正文。用于根据当前章规划、前情、状态、伏笔和上一章正文生成或协助修改正文。示例：`使用 longgu-write 写第001章。`
- `longgu-review`：AI 审稿。用于检查正文是否符合章节规划、设定圣经、读者承诺和连续性要求。示例：`使用 longgu-review 审第001章。`
- `longgu-state`：前情压缩/状态更新。用于生成章节摘要，更新近期前情、角色状态、世界状态、关系状态、未解决问题和伏笔账本。示例：`使用 longgu-state 更新第001章后的状态。`
- `longgu-help`：看当前步骤/解释目录/导航。用于解释当前项目结构、当前步骤、下一步建议和文件影响范围。示例：`使用 longgu-help 解释当前步骤。`

这样拆分的原因：

- 每个 skill 只管一段 workflow。
- 上下文更干净。
- Claude Code 用起来更顺。
- 不把开书规则、写正文规则、审稿规则全部塞在一起。

## 5. 中文可见项目目录

小说资产不藏在黑盒里。项目使用中文目录，作者看得懂，也能直接修改。

根目录核心文件：

- `当前步骤.md`：默认入口，说明当前阶段、要看什么、能改什么、下一步是什么。
- `创作流程.md`：完整 workflow 说明，定义阶段顺序和确认规则。
- `已确认决定.md`：记录作者已经拍板的关键决定。
- `项目说明.md`：解释项目目录和作者手改优先规则。

小说目录：

- `01_立项设定/`
- `02_设定圣经/`
- `03_大纲/`
- `04_伏笔与期待/`
- `05_前情与状态/`
- `06_章节规划/`
- `07_正文/`
- `08_AI审稿/`

每个目录都带 `_说明.md`。

初始化后的目录示例：

```text
我的小说/
├── 当前步骤.md                    # 作者可读；默认入口
├── 创作流程.md                    # 作者可读；workflow 规则
├── 已确认决定.md                  # 作者可改；关键决定记录
├── 项目说明.md                    # 作者可读；项目说明
├── longgu.yaml                    # 进阶/旧 CLI 路径可能使用
├── .claude/
│   └── skills/                    # Claude Code skill 文件，不是小说正文资产
│       ├── longgu-start/
│       │   └── SKILL.md
│       ├── longgu-plan/
│       │   └── SKILL.md
│       ├── longgu-write/
│       │   └── SKILL.md
│       ├── longgu-review/
│       │   └── SKILL.md
│       ├── longgu-state/
│       │   └── SKILL.md
│       └── longgu-help/
│           └── SKILL.md
├── 01_立项设定/                  # 作者可改；开书定位
│   ├── _说明.md
│   ├── 创作目标.md
│   ├── 故事卖点.md
│   ├── 读者承诺.md
│   └── 不写什么.md
├── 02_设定圣经/                  # 作者可改；长期设定
│   ├── _说明.md
│   ├── 故事核心.md
│   ├── 世界设定.md
│   ├── 势力设定.md
│   ├── 风格要求.md
│   └── 角色设定/
│       ├── 主角.md
│       ├── 重要配角.md
│       └── 反派.md
├── 03_大纲/                      # 作者可改；全书/分卷/章节路线
│   ├── _说明.md
│   ├── 全书大纲.md
│   ├── 分卷大纲.md
│   └── 章节列表.md
├── 04_伏笔与期待/                # 作者可改；追读和伏笔管理
│   ├── _说明.md
│   ├── 伏笔账本.md
│   ├── 章尾钩子.md
│   └── 读者期待.md
├── 05_前情与状态/                # 作者可改；压缩前情和状态账本
│   ├── _说明.md
│   ├── 总前情.md
│   ├── 当前卷前情.md
│   ├── 近期前情.md
│   ├── 章节摘要/
│   ├── 角色状态.md
│   ├── 世界状态.md
│   ├── 关系状态.md
│   ├── 未解决问题.md
│   └── 连续性风险.md
├── 06_章节规划/                  # 作者可改；单章任务书
│   ├── _说明.md
│   └── 第001章_规划.md
├── 07_正文/                      # 作者可改；小说正文
│   ├── _说明.md
│   └── 第001章.md
└── 08_AI审稿/                    # 作者可读/可改；AI 审稿建议
    ├── _说明.md
    └── 第001章_审稿.md
```

`01_立项设定/` 到 `08_AI审稿/` 是作者可编辑小说资产。`.claude/skills/` 是 Claude Code skill 文件，正常写作时不需要手改。

## 6. 章节规划：中文单章任务书

以前叫“章节合同”，现在改成更直观的中文规划文件：

```text
06_章节规划/第NNN章_规划.md
```

里面写：

- 本章作用。
- 本章必须发生。
- 本章不能发生。
- 读者看点。
- 爽点。
- 伏笔。
- 章尾钩子。
- 连续性风险。

写正文前，必须先有当前章规划。

## 7. 前情与状态独立

长篇不能每章都重读所有正文，所以新增前情与状态目录：

- `05_前情与状态/总前情.md`
- `05_前情与状态/当前卷前情.md`
- `05_前情与状态/近期前情.md`
- `05_前情与状态/章节摘要/`
- `05_前情与状态/角色状态.md`
- `05_前情与状态/世界状态.md`
- `05_前情与状态/关系状态.md`
- `05_前情与状态/未解决问题.md`
- `05_前情与状态/连续性风险.md`

作用：

- 防重复。
- 防忘坑。
- 防人设漂移。
- 防世界规则冲突。
- 防上下文爆炸。

写新章时默认只读：

- 当前步骤。
- 创作流程。
- 设定圣经。
- 大纲。
- 伏笔与期待。
- 近期前情。
- 角色状态。
- 未解决问题。
- 当前章规划。
- 上一章正文。

默认不读全历史正文。

## 8. AI 审稿正式进入流程

新增审稿文件：

```text
08_AI审稿/第NNN章_审稿.md
```

审稿检查：

- 是否符合章节规划。
- 是否符合设定圣经。
- 是否符合读者承诺。
- 是否有章尾钩子。
- 是否推进大纲。
- 是否乱埋伏笔。
- 是否忘回收伏笔。
- 是否主角太被动。
- 是否连续性冲突。
- 是否 AI 味太重。

审稿性质：

- 只给建议。
- 不自动覆盖作者决定。
- 最终由作者拍板。

## 9. 每章生成/更新闭环

每章闭环：

```text
章节规划
  ↓
正文
  ↓
AI审稿
  ↓
章节摘要
  ↓
近期前情 / 角色状态 / 世界状态 / 关系状态 / 未解决问题 / 伏笔账本
  ↓
下一章
```

这保证正文、审稿、状态沉淀和下一章规划连起来，不靠作者手动记忆全部上下文。

## 10. CLI 命令清单

### 主路径命令

```bash
longgu init <项目名>
longgu --version
```

`longgu init` 用于生成中文小说项目骨架和 Claude Code skills。`longgu --version` 用于确认本地安装版本。

### 本地开发/安装命令

```bash
npm ci
npm run build
npm link
npm run dev:cli -- init <项目名>
```

`npm run build` 使用 `tsconfig.json`，构建后会自动 `chmod +x dist/cli/index.js`，避免 `npm link` 后执行 `longgu` 出现 `permission denied`。

### 验证命令

```bash
npm run typecheck
npm test
openspec validate --all
```

### 进阶/旧 provider-backed 命令

这些命令仍可存在，但不属于 Claude Code-first 主路径，可能需要 provider 配置：

```bash
longgu plan ...
longgu write ...
longgu audit ...
longgu state ...
```

如果用户走 Claude Code skills 主路径，不需要先配置通用 LLM provider。

## 11. 代码层实际改动说明

`src/core/workspace.ts`

- 加入中文项目结构常量。
- 加入 root 文件模板。
- 加入各目录 `_说明.md` 模板。
- `initWorkspace` 现在会生成完整中文项目骨架。
- `assertWorkspaceShape` 现在也检查中文项目结构。

`src/core/guidedWorkflow.ts`

新增 workflow 管理能力：

- 读当前步骤。
- 更新当前步骤。
- 记录批准决定。
- 分析作者手改影响范围。

`src/core/context.ts`

- 写第 N 章时会读 `当前步骤.md`。
- 会读 `创作流程.md`。
- 会读 `06_章节规划/第NNN章_规划.md`。
- 会读 `05_前情与状态/`。
- 会读 `04_伏笔与期待/`。
- 上下文更贴近长篇连载。

`src/core/bookPlan.ts`

- 生成中文章节规划文件。
- 章节规划更贴合“本章任务书”语义。

`src/core/summary.ts`

- 章节摘要后会落到中文前情目录。
- 会更新近期前情。

`src/core/audit.ts`

- 审稿会看中文规划、中文前情、中文设定。
- 会输出新版 `08_AI审稿/第NNN章_审稿.md`。

`src/core/state.ts`

- 状态沉淀增强。
- 伏笔支持原文锚点。
- 状态写回中文前情目录。

`src/test/testUtils.ts`

- 测试 fixture 也补成完整中文项目骨架。

`package.json`

- 修掉 build 指向不存在的 `tsconfig.build.json`。
- 改成 `tsconfig.json`。
- build 后自动 `chmod +x dist/cli/index.js`。
- 解决 `npm link` 后 `longgu permission denied`。

## 12. CLI 中文体验

`longgu init` 的目标提示应是中文，不是英文工程提示。

示例：

- `下一步：用 Claude Code 打开项目`
- `输入：使用 longgu-start`
- `按 当前步骤.md 填写立项设定`
- `填好后说：继续推进当前步骤`

## 13. 验证状态

已验证目标：

```bash
npm run typecheck
npm test
openspec validate --all
```

这三项都应通过后，再认为本变更完成。

## 14. 产品结论

现在 Longgu 的方向是：

> Claude Code 上的中文网文长篇连载工作流工具。
