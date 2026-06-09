# 龙骨 Longgu

Longgu 是一个面向中文长篇网文创作的工程化 CLI Harness。它把开书设定、分卷拆章、章节生成、质量审计、定点修订、状态沉淀、上下文组装、模型成本和实验评测组织成可落盘、可复查、可迭代的本地工作流。

它不是单次对话式写作工具。Longgu 更适合用来支撑长篇项目：每次生成、审计、修订和状态更新都会留下文件证据，方便人工审查、版本管理和后续复盘。

## 核心能力

- 小说工作区初始化：创建 `bible/`、`outlines/`、`chapters/`、`state/`、`runs/` 等目录和基础配置。
- 开书与拆章：生成结构化的书籍规格、分卷规划和章节卡草稿。
- 单章写作：基于 `longgu.yaml`、`bible/` 和模型路由生成章节正文。
- 状态账本：维护事实、角色、时间线、伏笔、读者承诺和资源变化，支持章节状态 delta 合并。
- 章节审计：输出结构化审计 JSON 和 Markdown 报告，包含问题分级、质量分数、修订队列和阻断状态。
- 定点修订：根据审计结果修订章节，保存修订前后文本、diff、prompt、模型输出和 metadata。
- 类型卡：内置中文网文类型卡，覆盖玄幻、仙侠、都市、都市系统、历史、科幻、游戏/系统、悬疑灵异。
- 上下文包：为目标章节组装可审查的 context pack，在预算不足时优先裁剪低优先级内容。
- 模型路由与成本：支持多模型 profile、任务路由、fallback、重要章节升级和 token/成本估算。
- 实验评测：登记多个候选稿，写入人工评分，生成对比报告。

## 安装

```bash
npm install
npm run build
```

当前开发环境使用 Node.js 24。

查看 CLI：

```bash
node dist/cli/index.js --help
```

开发时也可以直接运行源码入口：

```bash
npm run dev:cli -- --help
```

## 10 分钟从零写一章

下面是一条最短可审查流程，适合新项目先跑通一章。

初始化一个小说工作区：

```bash
node dist/cli/index.js init ./my-novel
```

编辑 `./my-novel/longgu.yaml`，把 `provider.baseUrl`、`provider.model` 和 `provider.apiKeyEnv` 改成你的模型配置；再补充 `bible/premise.md`、`bible/characters.md`、`bible/world.md`、`bible/style.md`。第一轮不需要写很长，但至少写清主角、世界规则、开篇冲突和文风禁忌。

检查工作区、配置和模型连接：

```bash
node dist/cli/index.js doctor ./my-novel
```

生成规划草稿：

```bash
node dist/cli/index.js plan book ./my-novel
node dist/cli/index.js plan volume --id 001 ./my-novel
node dist/cli/index.js plan chapters --volume 001 ./my-novel
```

每一步都会写入 `outlines/*.draft.json`。默认生成 deterministic draft，适合先快速落盘和人工编辑；如果要让模型补完整规划内容，可以给三个规划命令加 `--model`。继续前先打开这些文件看一遍：不满意就直接编辑 JSON，再进入下一步。

初始化状态账本并生成章节上下文：

```bash
node dist/cli/index.js state init ./my-novel
node dist/cli/index.js context build --chapter 001 ./my-novel
```

生成、审计、修订和沉淀章节：

```bash
node dist/cli/index.js write chapter --id 001 ./my-novel
node dist/cli/index.js audit chapter --id 001 ./my-novel
node dist/cli/index.js revise chapter --id 001 ./my-novel
node dist/cli/index.js feedback chapter --id 001 --score 7 --comment "节奏比初稿好，但章尾钩子还弱" ./my-novel
node dist/cli/index.js settle chapter --id 001 ./my-novel
node dist/cli/index.js state check ./my-novel
```

生成后建议先读 `chapters/001.md`，再看 `audits/001.audit.md`。如果审计阻断或问题较多，先运行 `revise chapter` 或手动改章节；也可以用 `feedback chapter` 记录人工评价，让后续 context pack 带上这些偏好。满意后再 `settle chapter` 写入状态账本。

查看模型和成本：

```bash
node dist/cli/index.js model list ./my-novel
node dist/cli/index.js cost report ./my-novel
node dist/cli/index.js run show ./my-novel
```

创建实验并比较候选稿：

```bash
node dist/cli/index.js experiment create --id opening-ab --goal "测试开篇钩子" ./my-novel
node dist/cli/index.js experiment generate --id opening-ab --variant hook-model --prompt prompts/hook-model.md ./my-novel
node dist/cli/index.js experiment run --id opening-ab --variant hook-a --input drafts/hook-a.md ./my-novel
node dist/cli/index.js experiment score --id opening-ab --variant hook-a --payoff 8 --hook 9 --ai-flavor 2 ./my-novel
node dist/cli/index.js experiment compare --id opening-ab --sort hook ./my-novel
```

## 能力状态

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 工作区初始化、配置校验、doctor | 可用 | doctor 使用极简 chat completion 检查 provider 连通性 |
| 书籍/分卷/章节规划 | 可用 | 默认可编辑 deterministic draft；`--model` 可走 planning 路由生成 schema-validated draft |
| 单章写作 | 可用 | 使用 context pack、章节卡和历史章节上下文生成 |
| 上下文包 | 可用 | 支持 `context.maxTokens` 和 `--max-tokens` 覆盖 |
| 状态账本 | 可用 | 支持初始化、inspect、delta settle 和一致性 check 报告 |
| 审计与修订 | 可用 | 支持结构化审计/修订记录、路由运行记录和成本统计；质量仍需人工复核 |
| 模型路由与成本 | 可用 | planning/drafting/audit/revise/settle/experiment 支持任务路由、fallback 和成本汇总 |
| 实验评测 | 可用 | 支持模型生成候选稿、登记本地候选稿、人工评分和对比报告 |
| Claude Code/宿主 LLM 集成 | 规划中 | 独立方向，当前 CLI 仍使用配置的 provider |

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `longgu init` | 初始化小说工作区 |
| `longgu doctor` | 检查文件结构、配置、API key 和模型连接 |
| `longgu plan book` | 生成开书规格草稿 |
| `longgu plan volume --id 001` | 生成分卷规划草稿 |
| `longgu plan chapters --volume 001` | 生成章节卡草稿 |
| `longgu plan book --model` | 使用 planning 路由生成开书规格草稿 |
| `longgu write chapter --id 001` | 生成章节正文 |
| `longgu state init` | 初始化状态账本 |
| `longgu state inspect` | 查看状态账本 |
| `longgu state check` | 生成状态一致性检查报告 |
| `longgu settle chapter --id 001` | 将章节变化沉淀到状态账本 |
| `longgu audit chapter --id 001` | 生成章节审计报告 |
| `longgu revise chapter --id 001` | 根据审计结果修订章节 |
| `longgu genre list` | 列出内置类型卡 |
| `longgu genre show 玄幻` | 查看匹配后的类型卡 |
| `longgu context build --chapter 001` | 生成章节上下文包 |
| `longgu model list` | 列出模型 profile 和路由 |
| `longgu cost report` | 汇总 run 成本估算 |
| `longgu experiment create` | 创建实验 |
| `longgu experiment generate` | 通过 experiment 路由生成候选稿 |
| `longgu experiment run` | 登记本地候选稿 |
| `longgu experiment score` | 写入候选稿人工评分 |
| `longgu experiment compare` | 生成实验对比报告 |
| `longgu feedback chapter --id 001` | 记录章节人工反馈 |
| `longgu run show` | 查看最近一次运行记录 |

## 工作区结构

一个 Longgu 小说工作区通常长这样：

```text
my-novel/
  longgu.yaml
  bible/
    premise.md
    characters.md
    world.md
    style.md
  outlines/
    book.draft.json
    volume-001.draft.json
    chapters-001.draft.json
  chapters/
    001.md
  audits/
    001.audit.json
    001.audit.md
  revisions/
    001/<timestamp>/
  state/
    truth.json
    characters.json
    timeline.json
    hooks.json
    reader-promises.json
    resources.json
  context/
    001.context.json
    001.context.md
  runs/
    <timestamp>/
  experiments/
    opening-ab/
```

## 配置

基础配置文件是 `longgu.yaml`：

```yaml
title: 未命名小说
genre: 玄幻
language: zh-CN
provider:
  name: openai-compatible
  baseUrl: https://api.example.com/v1
  model: example-model
  apiKeyEnv: OPENAI_API_KEY
  temperature: 0.8
  maxTokens: 3000
context:
  maxTokens: 16000
```

`provider.maxTokens` 控制单次模型输出预算。使用 reasoning model 时，如果看到“reasoning output”相关错误，优先提高这个值。

`context.maxTokens` 控制 context pack 的默认输入预算；命令行 `longgu context build --chapter 001 --max-tokens 24000` 会覆盖配置值。

也可以配置多个模型 profile 和任务路由：

```yaml
models:
  fast:
    provider:
      name: openai-compatible
      baseUrl: https://api.example.com/v1
      model: cheap-model
      apiKeyEnv: FAST_API_KEY
    cost:
      inputPer1K: 0.001
      outputPer1K: 0.002
  strong:
    provider:
      name: openai-compatible
      baseUrl: https://api.example.com/v1
      model: strong-model
      apiKeyEnv: STRONG_API_KEY
    cost:
      inputPer1K: 0.01
      outputPer1K: 0.03
routes:
  drafting:
    model: fast
    fallback: strong
    importantModel: strong
  audit:
    model: strong
```

## 示例项目

仓库内置了一个玄幻示例：

```text
examples/xuanhuan-demo/
```

它包含基础 `bible/`、示例规划、状态账本、章节上下文和实验 manifest，可以直接用来了解 Longgu 的文件组织方式。

## 本地验证

```bash
npm run verify
```

该命令会运行 TypeScript 类型检查、构建、测试和规格校验。

## 许可

本项目采用 `PolyForm-Noncommercial-1.0.0` 许可。

允许个人学习、研究、评估和非商业使用；禁止未经授权的商业使用、商业分发、商业托管服务、商业集成和以营利为目的的再发布。完整条款见 [LICENSE](LICENSE)。
