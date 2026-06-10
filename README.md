# 龙骨 Longgu

Longgu 是一个面向中文长篇网文创作的工程化 CLI Harness。它把开书设定、分卷拆章、章节写作、质量审计、定点修订、状态沉淀、上下文组装、节奏分析、模型成本和实验评测组织成可落盘、可复查、可迭代的本地工作流。

它不是单次对话式写作工具。Longgu 更适合支撑长篇项目：每次规划、生成、审计、修订、导入、沉淀和评测都会留下文件证据，方便人工审查、版本管理和后续复盘。

## 当前能做什么

- 初始化小说工作区：创建 `longgu.yaml`、`bible/`、`outlines/`、`chapters/`、`state/`、`runs/` 等基础结构。
- 开书与拆章：生成书籍规格、分卷规划、章节卡草稿；支持 `--scaffold` 从 `bible/*.md` 提取脚手架，也支持 `--model` 调 planning 路由。
- 上下文组装：为目标章节生成 JSON/Markdown context pack；支持 token 预算裁剪和 `--human-readable` 人类摘要卡片。
- 单章写作：使用 provider 直接生成章节，或导出 prompt 给 Claude Code 等宿主 LLM，再导入 Markdown 正文。
- 批量宿主 LLM 工作流：批量导出章节 prompt，批量导入 `drafts/*.md`。
- 字数反馈：导入宿主正文时按章节目标字数输出偏差提示。
- 章节审计与修订：输出结构化审计 JSON、Markdown 报告、修订记录、diff 和运行 metadata。
- 状态账本：维护事实、角色、时间线、伏笔、读者承诺和资源变化；支持单章 settle、批量 settle 和一致性检查。
- 节奏分析：跨章分析情绪曲线、章尾钩子密度、爽点间隔、疲劳风险和 CP 同框分布。
- 类型卡与爽点配方：内置中文男频类型卡；可通过 `bible/payoff-recipes.md` 注入操作性爽点约束。
- 市场适配：可在 `longgu.yaml` 配置平台、读者画像和更新频次，让 context/audit 带上平台意识。
- 模型路由与成本：支持多模型 profile、任务路由、fallback、重要章节升级、token/成本估算。
- 实验评测：登记候选稿、模型生成候选稿、人工评分、对比排序和自动诊断。

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

## 快速开始

下面用 `node dist/cli/index.js` 演示。构建后如果你把 `longgu` 链接到 PATH，也可以直接用 `longgu`。

### 1. 初始化工作区

```bash
node dist/cli/index.js init ./my-novel
```

然后编辑：

- `./my-novel/longgu.yaml`
- `./my-novel/bible/premise.md`
- `./my-novel/bible/characters.md`
- `./my-novel/bible/world.md`
- `./my-novel/bible/style.md`
- `./my-novel/bible/payoff-recipes.md`

第一轮不需要写很长，但至少写清主角、世界规则、开篇冲突、文风禁忌和本书主要爽点。

### 2. 检查配置

如果使用 provider-backed 工作流，先配置 `provider` 和对应 API key，再运行：

```bash
node dist/cli/index.js doctor ./my-novel
```

如果只使用宿主 LLM 工作流，可以省略 `provider`，跳过 `doctor` 的模型连通性检查。

### 3. 生成规划

纯本地脚手架模式：

```bash
node dist/cli/index.js plan book --scaffold ./my-novel
node dist/cli/index.js plan volume --id 001 --scaffold ./my-novel
node dist/cli/index.js audit volume-plan --id 001 ./my-novel
node dist/cli/index.js plan chapters --volume 001 --scaffold ./my-novel
node dist/cli/index.js audit chapter-plan --volume 001 ./my-novel
```

模型规划模式：

```bash
node dist/cli/index.js plan book --model ./my-novel
node dist/cli/index.js plan volume --id 001 --model ./my-novel
node dist/cli/index.js audit volume-plan --id 001 ./my-novel
node dist/cli/index.js plan chapters --volume 001 --model ./my-novel
node dist/cli/index.js audit chapter-plan --volume 001 ./my-novel
```

规划文件会写入 `outlines/`。继续前建议人工打开 JSON 看一遍；不满意就直接编辑，再重新审计。

### 4. 写第一章

初始化状态账本并生成上下文：

```bash
node dist/cli/index.js state init ./my-novel
node dist/cli/index.js context build --chapter 001-001 --human-readable ./my-novel
```

使用 provider 直接写：

```bash
node dist/cli/index.js write chapter --id 001-001 ./my-novel
```

使用宿主 LLM 写：

```bash
node dist/cli/index.js write chapter --id 001-001 --host-prompt ./my-novel
```

把 `host-prompts/001-001.prompt.md` 交给 Claude Code 或其他宿主模型生成正文，保存成 `drafts/001-001.md`，再导入：

```bash
node dist/cli/index.js write chapter --id 001-001 --input drafts/001-001.md ./my-novel
```

批量宿主 LLM 工作流：

```bash
node dist/cli/index.js write batch --from 001-001 --to 001-010 --host-prompt ./my-novel
node dist/cli/index.js write batch --from 001-001 --to 001-010 --input-dir drafts ./my-novel
```

### 5. 审计、修订、沉淀

```bash
node dist/cli/index.js audit chapter --id 001-001 ./my-novel
node dist/cli/index.js revise chapter --id 001-001 ./my-novel
node dist/cli/index.js feedback chapter --id 001-001 --score 7 --comment "节奏比初稿好，但章尾钩子还弱" ./my-novel
node dist/cli/index.js settle chapter --id 001-001 ./my-novel
node dist/cli/index.js state check --chapter 001-001 ./my-novel
```

批量沉淀一卷或一个范围：

```bash
node dist/cli/index.js state settle --volume 001 ./my-novel
node dist/cli/index.js state settle --from 001-001 --to 001-010 ./my-novel
```

### 6. 分析和评测

节奏分析：

```bash
node dist/cli/index.js pacing --from 001-001 --to 001-010 ./my-novel
```

实验评测：

```bash
node dist/cli/index.js experiment create --id opening-ab --goal "测试开篇钩子" ./my-novel
node dist/cli/index.js experiment generate --id opening-ab --variant hook-model --prompt prompts/hook-model.md ./my-novel
node dist/cli/index.js experiment run --id opening-ab --variant hook-a --input drafts/hook-a.md ./my-novel
node dist/cli/index.js experiment score --id opening-ab --variant hook-a --payoff 8 --hook 9 --ai-flavor 2 ./my-novel
node dist/cli/index.js experiment compare --id opening-ab --sort hook ./my-novel
node dist/cli/index.js experiment diagnose --id opening-ab ./my-novel
```

运行记录和成本：

```bash
node dist/cli/index.js run show ./my-novel
node dist/cli/index.js model list ./my-novel
node dist/cli/index.js cost report ./my-novel
```

## 常用命令

### 工作区和配置

| 命令 | 用途 |
| --- | --- |
| `longgu init` | 初始化小说工作区 |
| `longgu doctor` | 检查文件结构、配置、API key 和 provider 连通性 |
| `longgu genre list` | 列出内置类型卡 |
| `longgu genre show 玄幻` | 查看匹配后的类型卡 |
| `longgu model list` | 列出模型 profile 和任务路由 |
| `longgu cost report` | 汇总 run 成本估算 |
| `longgu run show` | 查看最近一次运行记录 |

### 规划和上下文

| 命令 | 用途 |
| --- | --- |
| `longgu plan book --scaffold` | 从 bible 提取开书规格脚手架 |
| `longgu plan book --model` | 使用 planning 路由生成开书规格 |
| `longgu plan volume --id 001 --scaffold` | 生成分卷规划脚手架 |
| `longgu plan volume --id 001 --model` | 使用 planning 路由生成分卷规划 |
| `longgu audit volume-plan --id 001` | 审计分卷规划是否可拆章 |
| `longgu plan chapters --volume 001 --scaffold` | 生成章节卡脚手架 |
| `longgu plan chapters --volume 001 --model` | 使用 planning 路由生成章节卡 |
| `longgu audit chapter-plan --volume 001` | 审计章节卡是否可进入写作 |
| `longgu context build --chapter 001-001` | 生成章节上下文包 |
| `longgu context build --chapter 001-001 --human-readable` | 同时生成人类可读章节摘要卡 |

### 写作、审计、修订

| 命令 | 用途 |
| --- | --- |
| `longgu write chapter --id 001-001` | 通过 provider 生成章节正文 |
| `longgu write chapter --id 001-001 --host-prompt` | 导出宿主 LLM 写作 prompt |
| `longgu write chapter --id 001-001 --input drafts/001-001.md` | 导入宿主 LLM 生成的章节正文 |
| `longgu write batch --from 001-001 --to 001-010 --host-prompt` | 批量导出宿主 LLM prompts |
| `longgu write batch --from 001-001 --to 001-010 --input-dir drafts` | 批量导入宿主 LLM 正文 |
| `longgu audit chapter --id 001-001` | 生成章节审计报告 |
| `longgu revise chapter --id 001-001` | 根据审计结果修订章节 |
| `longgu feedback chapter --id 001-001` | 记录章节人工反馈 |

### 状态、节奏、实验

| 命令 | 用途 |
| --- | --- |
| `longgu state init` | 初始化状态账本 |
| `longgu state inspect` | 查看状态账本 |
| `longgu settle chapter --id 001-001` | 沉淀单章状态变化 |
| `longgu state settle --volume 001` | 批量沉淀一卷已有章节 |
| `longgu state settle --from 001-001 --to 001-010` | 批量沉淀章节范围 |
| `longgu state check --chapter 001-010` | 生成状态一致性检查报告 |
| `longgu summarize chapter --id 001-001` | 生成结构化章节摘要 |
| `longgu pacing --from 001-001 --to 001-010` | 生成跨章节奏分析 |
| `longgu experiment create` | 创建实验 |
| `longgu experiment generate` | 通过 experiment 路由生成候选稿 |
| `longgu experiment run` | 登记本地候选稿 |
| `longgu experiment score` | 写入候选稿人工评分 |
| `longgu experiment compare` | 生成实验对比报告 |
| `longgu experiment diagnose` | 生成候选稿结构诊断 |

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
    payoff-recipes.md
  outlines/
    book.draft.json
    volume-001.draft.json
    chapters-001.draft.json
  chapters/
    001-001.md
  drafts/
    001-001.md
  host-prompts/
    001-001.prompt.md
    001-001-001-010.batch.prompt.md
  context/
    001-001.context.json
    001-001.context.md
    001-001.brief.md
  audits/
    volume-001.plan-audit.json
    chapters-001.plan-audit.json
    001-001.audit.json
    001-001.audit.md
  revisions/
    001-001/<timestamp>/
  state/
    truth.json
    characters.json
    timeline.json
    hooks.json
    reader-promises.json
    resources.json
    settlements/
    checks/
  summaries/
    001-001.summary.json
  pacing/
    001-001-001-010.pacing.json
    001-001-001-010.pacing.md
  feedback/
    001-001.feedback.json
  runs/
    <timestamp>/
  experiments/
    opening-ab/
```

## 配置

基础配置文件是 `longgu.yaml`。如果只使用 `--host-prompt` 和 `--input` 宿主 LLM 工作流，可以省略 `provider`；如果要让 Longgu 自己调用外部模型，则需要配置 provider。

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

drafting:
  targetWords: 2500

market:
  platform: qidian
  targetAudience: male-25-35
  updateCadence: daily
```

字段说明：

- `provider.maxTokens` 控制单次模型输出预算。使用 reasoning model 时，如果看到 reasoning-only 或空正文相关错误，优先提高这个值。
- `context.maxTokens` 控制 context pack 默认输入预算；`longgu context build --max-tokens 24000` 会覆盖配置值。
- `drafting.targetWords` 控制章节正文目标字数，会写入写作 prompt；导入宿主正文时也会用于字数偏差提示。
- `market.platform` 支持 `qidian`、`fanqie`、`feilu`、`zongheng`，会作为 context/audit 的平台约束。

多模型 profile 和任务路由：

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
  planning:
    model: strong
  drafting:
    model: fast
    fallback: strong
    importantModel: strong
  audit:
    model: strong
  revise:
    model: strong
  settle:
    model: strong
  experiment:
    model: fast
```

`bible/payoff-recipes.md` 用来把描述性设定变成可执行的创作约束：

```markdown
# 爽点配方

## 核心爽点类型

- [x] 反差打脸
- [x] 降维打击
- [x] 身份误会

## 节奏约束

- 最小爽点间隔：2500 字
- 章尾必须保留钩子型爽点
- CP 互动最低频率：每 3 章 1 场非任务互动

## 名场面设计提示

- 每卷至少设计 1 个读者会截图传播的场景
```

## 产物怎么读

- `outlines/*.draft.json`：书、卷、章的结构化规划草稿。
- `context/*.context.md`：给模型用的上下文包，带来源、优先级和估算 token。
- `context/*.brief.md`：给人读的章节摘要卡，适合宿主 LLM 工作流。
- `host-prompts/*.prompt.md`：可复制给宿主模型的写作 prompt。
- `chapters/*.md`：章节正文。
- `audits/*.audit.md`：章节质量审计报告。
- `revisions/<chapter>/<timestamp>/`：修订前后文本、diff、prompt、输出和 metadata。
- `state/*.json`：长篇连续性账本。
- `state/settlements/`：每次状态沉淀的 before/after/delta/diff 记录。
- `pacing/*.pacing.md`：跨章节奏分析报告。
- `experiments/<id>/`：候选稿、评分、对比和诊断报告。
- `runs/<timestamp>/`：每次模型调用或宿主导入的可审查运行记录。

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

该命令会运行 TypeScript 类型检查、构建、测试和项目校验。

## 许可

本项目采用 `PolyForm-Noncommercial-1.0.0` 许可。

允许个人学习、研究、评估和非商业使用；禁止未经授权的商业使用、商业分发、商业托管服务、商业集成和以营利为目的的再发布。完整条款见 [LICENSE](LICENSE)。
