## Why

Longgu 的产品方向已经从“要配置 LLM provider/model/API key 的小说工具”，转成 Claude Code-first 的中文网文长篇 workflow 启动器。

这次改动需要把这个方向写清楚，避免用户继续把 Longgu 理解成：

- 模型配置器
- 通用 LLM 平台
- OpenAI-compatible 兼容壳
- 需要先填 provider/model/API key 才能用的 CLI 工具

用户真正需要的是：运行 `longgu init` 后，得到一个中文小说项目骨架、Claude Code 可用 skills、清楚的 `当前步骤.md`，然后在 Claude Code 中按步骤推进立项、设定、大纲、章节规划、正文、审稿和状态更新。

## What Changes

- 新增一版中文用户视角使用说明，覆盖从 `longgu init` 到 Claude Code 中使用 skills 推进小说项目的完整路径。
- 明确产品口径：Longgu 是 Claude Code-first 的中文网文长篇连载工作流工具，不是模型配置器、通用 LLM 平台或兼容壳。
- 说明 `longgu init` 初始化目标：生成中文小说项目目录、Claude Code skill 目录、中文下一步提示。
- 说明初始化后不再做 provider/API key/model/兼容模式配置问答。
- 说明多 skill 结构：`longgu-start`、`longgu-plan`、`longgu-write`、`longgu-review`、`longgu-state`、`longgu-help`。
- 说明中文可见项目目录：根文件、`01_立项设定/` 到 `08_AI审稿/`，以及每个目录的 `_说明.md`。
- 说明 `当前步骤.md` 驱动流程：当前阶段、需要看什么、可以改什么、影响什么、下一步生成什么、用户可以怎么回复。
- 说明章节规划改为中文单章任务书：`06_章节规划/第NNN章_规划.md`。
- 说明前情与状态独立：不读全历史正文，默认读取压缩前情、状态账本、当前章规划和上一章正文。
- 说明 AI 审稿正式进入流程：输出 `08_AI审稿/第NNN章_审稿.md`，只给建议，最终由作者决定。
- 说明每章闭环：章节规划、正文、AI 审稿、章节摘要、状态更新、下一章。
- 说明代码层实际改动范围：`workspace.ts`、`guidedWorkflow.ts`、`context.ts`、`bookPlan.ts`、`summary.ts`、`audit.ts`、`state.ts`、`testUtils.ts`、`package.json`。
- 说明 CLI 中文体验和验证状态。

## Capabilities

### New Capabilities

- `claude-code-usage-docs`: 定义 Longgu Claude Code-first 使用文档应包含的内容、结构、语气和示例。

### Modified Capabilities

无。

## Impact

- 影响 README 或 docs 下的用户文档。
- 影响 OpenSpec 变更说明，统一 Longgu 当前产品叙事。
- 可能影响 `longgu init` 输出文案或示例说明。
- 不引入新依赖。
- 不把 provider-backed 命令删除，但文档应降级为进阶/旧路径。
