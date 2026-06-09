# 龙骨 Longgu

中文网文创作工程化 Harness。

龙骨 Longgu 不是一个简单的 AI 写作壳，而是面向中文商业网文长篇生产的工程化支撑系统。它用 CLI、规格、状态账本、运行记录和审计流程撑住大纲、伏笔、章节节奏与正文质量。

## 当前状态

项目处于 V0.2 阶段：已具备最小 CLI Harness，并开始落地小说规格与规划流程。

已具备：

- `longgu init`：初始化小说工作区。
- `longgu doctor`：检查配置、API key、模型连接和文件结构。
- `longgu write chapter --id 001`：根据基础设定生成单章。
- `longgu plan book`：从当前配置和 `bible/` 输入生成开书规格草稿。
- `longgu plan volume --id 001`：从开书规格草稿生成分卷规划草稿。
- `longgu plan chapters --volume 001`：从分卷规划草稿生成章节卡草稿。
- `longgu run show`：查看最近一次生成记录。
- `longgu.yaml` 配置 schema。
- OpenAI-compatible provider adapter。
- 成功/失败 run record 落盘。
- 规划目录：`outlines/`，当前输出 `outlines/book.draft.json`、`outlines/volume-<id>.draft.json` 与 `outlines/chapters-<volume>.draft.json`。
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

## 品牌与包名

- 项目名：龙骨 Longgu。
- CLI：`longgu`。
- 当前包名：`@longgu/cli`。
- 后续包名规划：`@longgu/core`、`@longgu/cli`、`@longgu/genre-cards`。
