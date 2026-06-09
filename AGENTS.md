# Project Instructions

本项目后续开发必须采用 OpenSpec 的 SDD（Spec-Driven Development）流程。

## SDD Workflow

- 所有非平凡功能、架构调整、数据结构变化、CLI 行为变化、质量门禁变化，都必须先创建 OpenSpec change，再进入实现。
- 默认流程为：`proposal` -> `specs` -> `design` -> `tasks` -> implementation -> validation -> archive。
- 开始新需求时，先使用 `openspec change` / `/opsx:propose` 创建 `openspec/changes/<change-id>/`。
- 编码前必须完成并审阅：
  - `proposal.md`：说明为什么改、改什么、影响范围。
  - `specs/<capability>/spec.md`：用 `ADDED` / `MODIFIED` / `REMOVED` requirements 描述可验证行为。
  - `design.md`：当变更涉及架构、跨模块契约、状态模型、LLM 流程或风险较高时必须编写。
  - `tasks.md`：拆成可执行、可验收的任务清单。
- 实现时只做当前 change 范围内的工作，不夹带无关重构。
- 每完成一个任务，更新对应 `tasks.md` 状态。
- 交付前必须运行 `openspec validate <change-id>`；如果无法运行，要在最终回复中说明原因。
- 变更完成并验证后，使用 `openspec archive <change-id>` 将规格合并到 `openspec/specs/`。

## Project Context

- 项目名：龙骨 Longgu。
- 一句话：中文网文创作工程化 Harness。
- CLI：`longgu`。
- 包名规划：`@longgu/core`、`@longgu/cli`、`@longgu/genre-cards`。
- 项目目标：构建面向中文商业网文创作的工程化 harness，覆盖开书、拆卷、拆章、生成、审计、修订、状态沉淀、复盘评测。
- 初期优先 CLI、文件落盘、可审查运行记录、中文男频网文规则、模型无关适配和审计闭环。
- 现有规划参考：
  - `docs/网文写作Harness工程整体规划.md`
  - `code_analysis/AI写网文开源项目对比分析.md`

## Implementation Defaults

- 第一阶段技术路线默认 TypeScript + Node.js。
- CLI 可优先考虑 `commander` 或 `oclif`。
- 结构化数据校验优先使用 `zod`。
- 测试默认使用 `vitest`，除非后续 OpenSpec change 明确调整。
- 所有生成、审计、修订、状态变更都应有可追踪文件产物，避免只存在内存中。
