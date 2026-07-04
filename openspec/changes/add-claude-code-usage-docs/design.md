## Context

Longgu 已经从 provider/model 配置优先，转向 Claude Code-first 的中文网文长篇 workflow。当前代码与前一轮设计已经形成中文项目目录、当前步骤驱动、章节规划、前情状态、AI 审稿等能力，但用户仍缺一份“上手说明”。

文档读者是中文小说作者和使用 Claude Code 的创作者，不默认他们理解 TypeScript、provider、OpenAI-compatible API、模型路由等工程概念。文档必须先解释“怎么用”，再解释“有哪些命令”，并避免把旧 provider-backed 路径放成主路径。

本变更把完整说明整理为 `usage-guide.md`：一版文档同时覆盖产品定位、初始化方式、Claude Code skills、中文项目目录、当前步骤驱动、章节规划、前情状态、AI 审稿、每章闭环、CLI 命令、代码层变更和验证状态。

## Goals / Non-Goals

**Goals:**

- 提供中文用户视角使用说明，从安装/初始化到 Claude Code skills 推进小说项目。
- 明确 Longgu 的本质：Claude Code-first 的中文网文长篇 workflow 启动器。
- 说明 `longgu init` 只负责生成中文小说项目目录、Claude Code skills 和中文下一步提示。
- 说明主路径不要求 provider、API key、model 或兼容模式配置。
- 提供 CLI 命令清单，区分主路径、验证/调试、旧 provider-backed 命令。
- 提供 Claude Code skills 目录树和每个 skill 的职责说明。
- 提供 `longgu init` 后的实际文件树示例，包括 `.claude/skills/` 和小说中文目录。
- 说明 `当前步骤.md` 驱动工作流和用户常用回复。
- 说明章节规划、前情状态、AI 审稿、每章闭环。
- 记录代码层实际改动范围和验证命令。

**Non-Goals:**

- 不在本变更中实现新 skill 生成逻辑。
- 不修改核心 workflow 行为。
- 不新增 Web UI、provider 配置向导或多 agent 适配。
- 不把旧 provider-backed 命令删除，只在文档中降级为进阶/旧路径。
- 不恢复或覆盖当前工作树中已删除的 README/docs 文件，除非作者明确要求。

## Decisions

### Decision 1: 文档以“用户路径”组织，而不是以模块组织

文档顺序采用：产品定位、初始化、当前步骤、skills、项目树、章节规划、前情状态、AI 审稿、每章闭环、CLI 命令、代码层说明、验证状态。

理由：用户真正困惑的是“下一步做什么”，不是“有哪些内部模块”。把用户路径放前面，能减少上手阻力。

替代方案：按代码模块或功能列表写文档。放弃原因：容易重新变成工程说明，不解决“好难用”的核心反馈。

### Decision 2: Claude Code-first 是主叙事

文档必须明确：Longgu 的推荐路径是 Claude Code skills，不是填写 `provider`、`model`、`apiKeyEnv` 后让 CLI 直接调模型。

理由：用户希望使用现成 agent，不想配置通用 LLM 信息。文档要顺着这个产品方向。

### Decision 3: `longgu init` 是中文 workflow 启动器

`longgu init` 的目标是生成：

1. 中文小说项目目录。
2. Claude Code skill 目录。
3. 中文下一步提示。

初始化后不问 provider、不问 API key、不配 model、不做兼容模式。

### Decision 4: 多 skill 拆分是主入口

文档展示以下 skills：

- `longgu-start`：立项/开书。
- `longgu-plan`：设定 / 大纲 / 分卷 / 章节规划。
- `longgu-write`：写正文。
- `longgu-review`：AI 审稿。
- `longgu-state`：前情压缩 / 状态更新。
- `longgu-help`：看当前步骤 / 解释目录 / 导航。

理由：每个 skill 只管一段 workflow，上下文更干净，Claude Code 用起来更顺，不把开书规则、写正文规则、审稿规则全塞一起。

### Decision 5: 中文目录是作者可见资产，不是黑盒

文档强调根目录文件和 `01_立项设定/` 到 `08_AI审稿/` 是作者可读、可改的小说资产，`.claude/skills/` 是 Claude Code skill 文件。

### Decision 6: CLI 命令分层展示

CLI 命令清单分三层：

1. 主路径命令：`longgu init`、`longgu --version`。
2. 本地开发/验证命令：`npm ci`、`npm run build`、`npm link`、`npm run dev:cli -- ...`、`npm run typecheck`、`npm test`、`openspec validate --all`。
3. 进阶/旧 provider-backed 命令：`longgu plan ...`、`longgu write ...`、`longgu audit ...`、`longgu state ...`。

理由：命令都存在，但不应暗示用户必须配置 provider 后才能用。

### Decision 7: 当前步骤驱动替代目录猜测

文档必须说明核心入口是 `当前步骤.md`，它负责告诉用户当前阶段、需要看什么、可以改什么、影响什么、下一步生成什么、可以怎么回复。

常见回复包括：

- `继续推进当前步骤`
- `我改好了，按当前文件继续推进`
- `批准当前步骤，进入下一步`
- `解释当前步骤为什么要看这些文件`

### Decision 8: 长篇上下文用前情状态压缩，不读全历史正文

文档明确写新章时默认读取当前步骤、创作流程、设定圣经、大纲、伏笔与期待、近期前情、角色状态、未解决问题、当前章规划和上一章正文，不读全历史正文。

### Decision 9: AI 审稿只建议，作者拍板

文档明确 `08_AI审稿/第NNN章_审稿.md` 是正式流程输出，但只给建议，不自动覆盖作者决定。

## Risks / Trade-offs

- 旧 CLI 命令仍需要 provider 配置，用户可能误用。缓解：文档把它们标为“进阶/旧路径”，主路径只推荐 Claude Code skills。
- 目前多 skill 生成可能还未完全实现。缓解：文档描述目标体验，后续任务检查实际 init 输出是否同步。
- README 当前在工作树中为 deleted。缓解：本次先把完整说明放在 change 目录 `usage-guide.md`，不主动恢复或覆盖 README。
- Claude Code skill 命名未来可能变化。缓解：文档集中维护 skills 清单，避免散落多处。

## Verification

完成后需要验证：

```bash
npm run typecheck
npm test
openspec validate --all
```

当前文档变更至少需要运行：

```bash
openspec validate add-claude-code-usage-docs --strict
```
