# 龙骨 Longgu

中文网文创作工程化 Harness。

龙骨 Longgu 不是一个简单的 AI 写作壳，而是面向中文商业网文长篇生产的工程化支撑系统。它用 CLI、规格、状态账本、运行记录和审计流程撑住大纲、伏笔、章节节奏与正文质量。

## 当前状态

项目处于 V0.8 阶段：已具备最小 CLI Harness、小说规格与规划流程、长篇状态账本、章节审计质量门禁、第一版写审改闭环、中文网文类型卡 registry、单章上下文包，并加入模型路由与成本估算。

已具备：

- `longgu init`：初始化小说工作区。
- `longgu doctor`：检查配置、API key、模型连接和文件结构。
- `longgu write chapter --id 001`：根据基础设定生成单章，默认走 `drafting` 模型路由。
- `longgu write chapter --id 001 --important`：按配置升级到重要章节模型。
- `longgu plan book`：从当前配置和 `bible/` 输入生成开书规格草稿。
- `longgu plan volume --id 001`：从开书规格草稿生成分卷规划草稿。
- `longgu plan chapters --volume 001`：从分卷规划草稿生成章节卡草稿。
- `longgu state init`：初始化长篇一致性状态账本。
- `longgu state inspect`：查看状态账本条目数量和更新时间。
- `longgu settle chapter --id 001`：从章节正文提取状态 delta，经 schema 校验后合并进状态账本。
- `longgu settle chapter --id 001 --delta state/deltas/001.delta.json`：使用人工或外部工具产出的 delta 执行确定性状态沉淀。
- `longgu audit chapter --id 001`：对章节进行结构化质量审计，输出 JSON 与 Markdown 报告。
- `longgu audit chapter --id 001 --input audits/001.raw-audit.json`：使用人工或外部工具产出的 raw audit 执行确定性审计归一化。
- `longgu revise chapter --id 001`：根据审计结果修订章节，写入修订记录并替换章节正文。
- `longgu revise chapter --id 001 --input revisions/001.candidate.md`：使用人工或外部工具产出的修订稿执行确定性修订落盘。
- `longgu genre list`：列出内置 V0.6 类型卡。
- `longgu genre show 玄幻`：查看匹配后的类型卡 JSON。
- `longgu context build --chapter 001`：为目标章节生成可审查上下文包。
- `longgu context build --chapter 001 --max-tokens 4000`：按估算 token 预算构建上下文，低优先级来源会先被裁剪，关键状态仍保留。
- `longgu model list`：列出已配置模型 profile、成本参数和任务路由。
- `longgu cost report`：汇总 run metadata 中的 token 与估算成本。
- `longgu run show`：查看最近一次生成记录。
- `longgu.yaml` 配置 schema。
- OpenAI-compatible provider adapter。
- 成功/失败 run record 落盘。
- 规划目录：`outlines/`，当前输出 `outlines/book.draft.json`、`outlines/volume-<id>.draft.json` 与 `outlines/chapters-<volume>.draft.json`。
- 状态目录：`state/`，当前输出 `truth.json`、`characters.json`、`timeline.json`、`hooks.json`、`reader-promises.json` 与 `resources.json`。
- 状态沉淀记录：`state/settlements/<chapter-id>-<timestamp>/`，包含 `delta.json`、`before.json`、`after.json`、`diff.json`、`metadata.json`；模型提取路径还会保存 `prompt.md` 和 `model-output.txt`。
- 状态更新采用 id-based delta merge，并内置基础冲突检查，避免模型整份重写状态文件。
- 审计目录：`audits/`，当前输出 `audits/<id>.audit.json`、`audits/<id>.audit.md`，provider 路径还会输出 `audits/<id>.audit-attempts.json`。
- 审计结果支持 `critical`、`warning`、`info` 分级，`P0/P1/P2` 会映射到 harness severity，并派生 `blocked` 与 `reviseQueue`。
- 修订目录：`revisions/<chapter-id>/<timestamp>/`，当前输出 `before.md`、`after.md`、`diff.md`、`metadata.json`、`prompt.md`、`model-output.md`。
- 修订模式支持 `spot-fix`、`polish`、`rewrite-scene`、`rewrite-chapter`，默认根据审计严重级别选择模式。
- 类型卡：内置 `xuanhuan`、`xianxia`、`urban`、`urban-system`、`historical`、`sci-fi`、`game-system`、`supernatural-mystery`，支持中文 alias 解析并注入审计/修订 prompt。
- 上下文目录：`context/`，当前输出 `context/<chapter-id>.context.json` 与 `context/<chapter-id>.context.md`。
- 上下文包来源包括当前章节卡、分卷规划、状态账本、近期章节摘要、类型卡和 `bible/style.md`；预算不足时优先裁剪低优先级来源，`critical` 状态和章节卡不会被裁剪。
- 模型配置：兼容旧 `provider`，并支持可选 `models`、`routes`、`fallback`、`importantModel` 与 per-1K token 成本参数。
- run metadata：生成记录包含 `task`、`modelProfile`、`fallbackAttempts`、`inputTokens`、`outputTokens`、`estimatedCost` 和 `durationMs`。
- 示例项目：`examples/xuanhuan-demo/`。

## 安装依赖

```bash
npm install
```

当前开发环境使用 Node.js 24。

## 本地开发

```bash
npm run typecheck
npm run build
npm test
```

查看 CLI：

```bash
npm run build
node dist/cli/index.js --help
```

初始化一个测试工作区：

```bash
node dist/cli/index.js init /tmp/longgu-demo
```

## 项目结构

```text
src/
  adapters/          # LLM provider adapter
  cli/               # longgu CLI entry
  core/              # config, workspace, prompt, generation, run records
examples/
  xuanhuan-demo/     # 示例项目
openspec/
  specs/             # 已归档规格
  changes/           # SDD 变更工作区
docs/
  网文写作Harness工程整体规划.md
```

## SDD 工作流

本项目使用 OpenSpec 做 SDD（Spec-Driven Development）。

所有非平凡功能、架构调整、数据结构变化、CLI 行为变化、质量门禁变化，都应先创建 OpenSpec change，再实现：

```text
proposal -> specs -> design -> tasks -> implementation -> validation -> archive
```

当前正式规格：

- `openspec/specs/minimal-cli-harness/spec.md`
- `openspec/specs/book-planning/spec.md`
- `openspec/specs/story-state/spec.md`
- `openspec/specs/chapter-audit/spec.md`
- `openspec/specs/chapter-revision/spec.md`
- `openspec/specs/genre-cards/spec.md`
- `openspec/specs/context-builder/spec.md`

## 品牌与包名

- 项目名：龙骨 Longgu。
- CLI：`longgu`。
- 当前包名：`@longgu/cli`。
- 后续包名规划：`@longgu/core`、`@longgu/cli`、`@longgu/genre-cards`。
