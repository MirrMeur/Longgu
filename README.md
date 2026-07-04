# Longgu

Longgu 是 **Claude Code-first 的中文网文长篇 workflow 启动器**。

它的主路径不是先配 provider、model、API key，而是：

1. `longgu init` 生成中文小说项目骨架。
2. 用 Claude Code 打开项目。
3. 读 `当前步骤.md`。
4. 按 Longgu skills 推进立项、设定、大纲、章节规划、正文、审稿和状态更新。

## 快速开始

```bash
npm ci
npm run build
longgu init 我的小说
cd 我的小说
claude
```

进入 Claude Code 后，先看：

- `当前步骤.md`
- `创作流程.md`
- `项目说明.md`

然后按当前步骤回复，例如：

- `继续推进当前步骤`
- `我改好了，按当前文件继续推进`
- `批准当前步骤，进入下一步`
- `解释当前步骤为什么要看这些文件`

## Longgu 会生成什么

`longgu init` 会生成中文小说项目结构和 Claude Code 可用 skills：

- 根文件：`当前步骤.md`、`创作流程.md`、`已确认决定.md`、`项目说明.md`
- 小说目录：`01_立项设定/` 到 `08_AI审稿/`
- Skills：`longgu-start`、`longgu-plan`、`longgu-write`、`longgu-review`、`longgu-state`、`longgu-help`

每个目录都带 `_说明.md`，作者可以直接打开、修改。

## 常用命令

### 主路径

```bash
longgu init <项目名>
longgu --version
```

### 本地开发

```bash
npm ci
npm run build
npm run dev:cli -- init <项目名>
```

### 验证

```bash
npm run typecheck
npm test
openspec validate --all
```

## 完整说明

更完整中文使用说明见：

- `openspec/changes/add-claude-code-usage-docs/usage-guide.md`

## 产品口径

- Claude Code-first
- agent-first
- 中文网文长篇连载工作流
- 不把通用 LLM provider 配置当主入口
- 不把兼容壳当主入口

旧 provider-backed 命令仍可保留，但只算进阶/旧路径。
