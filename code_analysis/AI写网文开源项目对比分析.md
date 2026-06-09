# AI 写网文开源项目对比分析

> 分析日期：2026-06-08 | 分析方式：git clone 源码阅读

---

## 一、数据总览

| 项目 | Stars | 语言 | 许可证 | 核心理念 |
|------|-------|------|--------|----------|
| [inkos](https://github.com/Narcooo/inkos) | 6,949 | TypeScript | AGPL-3.0 | 10-agent 自主写审改流水线 |
| [AI_NovelGenerator](https://github.com/YILING0013/AI_NovelGenerator) | 5,228 | Python | MIT | GUI + ChromaDB 向量记忆长篇小说生成 |
| [AI-Writer](https://github.com/BlinkDL/AI-Writer) | 3,746 | Python | Apache-2.0 | RWKV 模型中文网文专项生成 |
| [AI-Novel-Writing-Assistant](https://github.com/ExplosiveCoderflome/AI-Novel-Writing-Assistant) | 1,542 | TypeScript | AGPL-3.0 | AI 导演式全链路生产系统 |
| [AI-automatically-generates-novels](https://github.com/wfcz10086/AI-automatically-generates-novels) | 878 | Python/JS | MIT | 轻量级批量小说生产工具 |
| [novel-writer](https://github.com/wordflowlab/novel-writer) | 846 | TypeScript | MIT | SDD 规格驱动 + 跨平台斜杠命令 |
| [MaliangAINovalWriter](https://github.com/Deng-m1/MaliangAINovalWriter) | 786 | Dart/Java | Apache-2.0 | Flutter + Spring Boot 全栈创作平台 |

---

## 二、逐个深度分析

### 1. inkos（6,949 ★）—— 最成熟的自主写作 Agent

**架构**：TypeScript monorepo（packages/core + cli + studio），10-agent 流水线

```
Phase 1 (Creative, temp=0.7):
  Radar → Planner → Composer → Writer（生成正文）
       ↓ 章节意图  ↓ 上下文组装  ↓ 长度治理+首屏钩子+语义密度

Phase 2 (State Settlement, temp=0.3):
  Observer → Reflector → 代码层 Zod Schema 校验
       ↓ 9类事实提取  ↓ JSON delta（非全文）

Phase 3 (Quality Loop):
  Normalizer → Auditor（33维检查）→ Reviser（定点修复）
       ↓ 字数调整    ↓ critical/warning/info  ↓ spot-fix/polish/rewrite/anti-detect
```

**核心技术特点**：
- **Truth Files**：JSON 格式持久化状态（`story/state/*.json`），markdown 投影供人类阅读
- **SQLite 时序记忆库**：`story/memory.db`，Node 22+ 相关性检索
- **Hook Ledger**：伏笔账本系统，upsert/mention/resolve/defer 操作语义
- **33 维审计**：OOC检查/时间线/设定冲突/战力崩坏/数值检查/伏笔检查/节奏检查/文风检查/信息越界/词汇疲劳/利益链断裂/年代考据/配角降智/配角工具人化/爽点虚化/台词失真/流水账/知识库污染/视角一致性/段落等长/套话密度/公式化转折/列表式结构/支线停滞/弧线平坦/节奏单调/敏感词/正传事件冲突/未来信息泄露/世界规则跨书一致性/番外伏笔隔离/读者期待管理/章节备忘偏离/角色还原度/世界规则遵守/关系动态/正典事件一致性
- **多模型路由**：不同 agent 可指定不同模型（writer 用 Claude Sonnet，auditor 用 GPT-4o）
- **三种入口**：OpenClaw Skill / TUI（终端全屏仪表盘）/ Studio Web 工作台
- **英文原生支持**：10 种英文类型（LitRPG, Progression Fantasy, Isekai 等）

**优点**：
1. 审计维度最全面（33+项），且分 severity 三级，写审改闭环真正落地
2. Truth Files + SQLite 记忆库的双层状态持久化方案，长篇一致性最强
3. 多入口（TUI/Studio/OpenClaw）共享同一交互内核，架构设计优秀
4. 连载式迭代，更新频率极高（README 记录了 v1.4.0 等连续版本）

**缺点**：
1. AGPL-3.0 许可证，商用受限
2. npm 全局安装，对非开发者门槛较高
3. 需 Node 20+，SQLite 记忆库需 Node 22+
4. 10-agent 流水线 token 消耗巨大，写一章成本不低
5. 国产模型适配不如 AI_NovelGenerator（主要走 OpenAI/Anthropic 兼容接口）

---

### 2. AI_NovelGenerator（5,228 ★）—— GUI + ChromaDB 向量记忆

**架构**：Python 单体，customtkinter GUI + ChromaDB + LangChain

```
主流程:
1. Novel_architecture_generate()
     ├── core_seed_prompt（核心种子）
     ├── character_dynamics_prompt（角色动力学）
     ├── world_building_prompt（世界观）
     └── plot_architecture_prompt（三幕式情节）
     → 输出 Novel_architecture.txt

2. Chapter_blueprint_generate()
     → 分块生成章节目录（避免 token 超长）
     → 输出 chapter_blueprint.txt

3. 逐章生成循环
     ├── get_relevant_context_from_vector_store()（ChromaDB 检索前文）
     ├── summarize_recent_chapters()（前三章摘要）
     ├── 知识库关键词检索
     └── consistency_check()（一致性校验）
```

**核心技术特点**：
- **ChromaDB 本地向量库**：每章分段存入，写新章前检索相关上下文
- **LLM 适配器模式**：统一接口支持 OpenAI / DeepSeek / Ollama / Gemini / Claude / Azure
- **断点续传**：`partial_architecture.json` 保存中间结果，失败后可从中断步骤继续
- **重试机制**：`call_with_retry` 封装，max 3 次，带 fallback
- **一致性检查**：对比小说设定 + 角色状态 + 前文摘要 + 未解决冲突 vs 最新章节
- **蓝图分块算法**：`compute_chunk_size()` 根据 max_tokens 自动计算分块大小

**优点**：
1. 本地 ChromaDB 向量记忆，不需要外部向量数据库
2. GUI 友好（customtkinter），对非程序员更友好
3. MIT 许可证，商用友好
4. LLM 适配器设计清晰，添加新模型简单
5. 断点续传机制实用，长篇生成不怕中断

**缺点**：
1. **作者已声明精力和毕业问题，维护不稳定**（README 有弃坑声明）
2. 代码质量属于学术/个人项目级别（全局 logging.basicConfig 到处重复）
3. 没有多 agent 协作，每章生成是一次性 LLM 调用
4. 一致性检查只做简单对比，没有 inkos 那种 33 维审计
5. 向量检索只取 top-2，可能遗漏重要上下文
6. UI 使用 tkinter，界面较原始

---

### 3. AI-Writer（3,746 ★）—— 已过时的 RWKV 中文网文模型

**架构**：RWKV 模型（类似 GPT-2），8849 字词表，512 token 上下文

**核心技术特点**：
- 训练数据全部来自中文网文（玄幻/言情）
- RWKV 架构：线性时间推理，无 KV-cache
- 支持 N/A/I 卡 GPU 加速
- 特殊采样方法改善小模型生成质量
- Python 网页版 + CPU exe 版

**优点**：
1. 最早的 AI 中文网文专项项目之一，历史地位高
2. RWKV 模型推理快，消费级 GPU 可跑
3. 训练数据纯网文，文风贴近网文

**缺点**：
1. **作者已明确标注"过时的信息！过时的模型！仅供参考！"**
2. README 引导使用新项目 RWKV-Runner
3. 模型已不再维护，只支持 Python 3.8.x
4. 512 token 上下文太小，无法生成长篇
5. 模型缺乏生活常识，生成内容仅供娱乐

**当前价值**：仅供学习参考，不推荐实际使用。作者新项目是 RWKV-Runner。

---

### 4. AI-Novel-Writing-Assistant（1,542 ★）—— 工程化程度最高的全链路系统

**架构**：pnpm monorepo，前后端分离 + Electron 桌面版

```
client/         React + Vite + Tailwind + Plate 编辑器
server/         Express + Prisma + SQLite/Qdrant + LangChain/LangGraph
shared/         类型定义
desktop/        Electron 宿主

核心链路:
Creative Hub → 自动导演开书 → 项目设定 → 故事宏观规划
→ 本书世界/角色准备 → 卷战略/拆章 → 章节执行
→ 质量修复 → 整本生产主链
```

**核心技术特点**：
- **LangGraph 编排**：自动导演的 workflow 使用 LangGraph 管理状态流转
- **模型路由**：支持 OpenAI / DeepSeek / SiliconFlow / xAI，不同任务可指定不同模型
- **写法引擎**：从文本提取风格特征 → 特征池编辑 → 绑定到章节生成，可启用/停用/组合
- **RAG 系统**：Qdrant 向量库 + 知识库文档回灌到写作上下文
- **质量预算管理**：局部修复 → 整章重写 → 窗口重规划 → 质量待回收，四级递进
- **自动导演全自动模式**：`full_book_autopilot` 遇普通问题自动继续，仅硬风险阻断
- **Database 迁移**：50+ 个 Prisma migration，可见迭代密度极高
- **Windows 桌面版**：Setup.exe / portable 两种分发

**优点**：
1. 工程化程度业界最高：Monorepo + 完整的 middleware/agent/worker/pipeline 分层
2. 自动导演是真正的"全自动"，不是简单的 prompt chain，有质量预算和熔断机制
3. 写法引擎设计优秀，提取→编辑→绑定→验证完整闭环
4. 目标用户定位精准：完全不懂写作的新手
5. 有 Electron 桌面版分发，降低使用门槛

**缺点**：
1. AGPL-3.0 许可证，商用受限
2. 项目复杂度极高，二次开发学习成本大
3. 仅支持 Windows 桌面版（macOS/Linux 无安装包）
4. 50+ 数据库迁移说明仍在快速迭代，稳定性待验证
5. 默认 SQLite，生产环境需额外配置 Qdrant 和 PostgreSQL

---

### 5. AI-automatically-generates-novels（878 ★）—— 轻量级生产工具

**架构**：Flask 后端 + 原生 JS 前端，单体应用

```
app.py (85行) + static/*.js (~11,000行前端逻辑)
├── /gen   → 高质量模型（Claude 3.5 Sonnet）
├── /gen2  → 低成本模型（Qwen 2.5 72B）
├── 思维导图构建大纲/章节
├── shift+L 快捷词条输入
├── 右键润色/扩写/去AI味
├── 多套提示词库管理
└── 拆书功能
```

**核心技术特点**：
- **双模型策略**：/gen 用高质量模型生成正文，/gen2 用低成本模型做迭代/拆书
- **写作知识库管理**：数据存于配置中
- **思维导图集成**：构建大纲和章节结构
- **提示词导入导出**：支持多套提示词库
- **右击菜单**：选中大纲/章节/正文右键润色、扩写、去AI味
- **拆书功能**：分析已有小说提取风格和结构
- 支持所有主流大模型接入（Ollama/豆包/Gemini/Claude/通义千问/DeepSeek/ChatGPT）

**优点**：
1. 数百家工作室实际使用，生产环境验证
2. 架构极其简单（app.py 仅 85 行），易于修改
3. 双模型策略平衡质量和成本
4. 思维导图 + 快捷词条在实际写作中很实用
5. 支持任意 OpenAI 兼容接口，国产模型适配好

**缺点**：
1. 代码质量一般（app.py 硬编码 API key）
2. 没有前端框架，原生 JS 维护困难
3. 没有向量记忆/一致性检查等高级功能
4. 本质上是很强的"提示词壳"，不解决长文本一致性
5. 依赖特定 API 代理（ssb.org.cn），内置密钥可能已失效

---

### 6. novel-writer（846 ★）—— SDD 规格驱动方法论

**架构**：npm CLI 工具，TypeScript，寄生在 13 个 AI 平台

```
novel init → 生成项目结构 + 斜杠命令文件
↓
在 AI 助手中使用斜杠命令:
/constitution → /specify → /clarify → /plan → /tasks → /write → /analyze
```

**核心技术特点**：
- **SDD 方法论**：将软件工程规格体系嫁接到小说创作
- **单一命令源**：`templates/commands/` 维护一套命令，构建系统生成 13 个平台格式
- **插件系统**：8 个官方插件（真实人声/翻译/拆书分析/风格模仿等）
- **专家系统**：剧情结构/人物塑造/世界观设计/文风语言 四个专家
- **追踪系统**：情节追踪/时间线/角色关系/世界观检查，有自动修复
- **混合写作方法**：三幕/英雄之旅/故事圈/七点结构/皮克斯/雪花法 + 方法转换

**优点**：
1. 方法论系统化，七步 SDD 将模糊写作分解为可执行工程步骤
2. 13 平台兼容设计务实高效——一套命令源码生成所有平台格式
3. Checklist + 追踪体系提供了双层质量验证
4. 渐进式规格：从"一句话故事"到"完整规格"四个层级
5. MIT 许可证，商用友好

**缺点**：
1. **完全依赖第三方 AI 平台，本身无独立运行能力**——没有 AI 平台就无法工作
2. 命令行 + Markdown 操作门槛对纯文学作家不友好
3. 写作质量完全取决于底层 AI 模型，项目本身只是 prompt 工程 + 流程管理
4. 版本迭代过快（半年 20 个大版本），用户项目升级频繁
5. 英文/中文混用，文档信息架构不够清晰

---

### 7. MaliangAINovalWriter（786 ★）—— Flutter 全栈创作平台

> **限制**：该仓库 git clone / sparse checkout 多次卡在 `index-pack`，未能完整落盘；本节基于 README 页面提取与项目结构描述分析。

**架构**：Flutter Web + Spring Boot + MongoDB + Docker Compose

**核心技术特点**：
- **Flutter Quill** 富文本编辑器集成
- 作品 → 卷 → 章节 → 场景 四级结构
- 世界观构建系统
- 支持 OpenAI / Gemini / Anthropic / OpenRouter
- 公共模型管理 + 模型定价/计费审计
- LLM 可观测性（调用追踪/图表）
- 订阅与积分管理
- txt 导入
- Docker Compose 一键部署

**优点**：
1. 唯一有计费/订阅系统的项目，可直接商用运营
2. Flutter 跨平台，Web + 移动端潜力
3. LLM 可观测性内置，适合运营管理
4. Docker Compose 部署简单

**缺点**：
1. MongoDB 需要副本集初始化，首次启动可能超时
2. 框架较重（Flutter + Spring Boot），二次开发门槛高
3. Apache-2.0 但含平台运营属性，实际需自行维护部署
4. 没有 Agent Pipeline，写作主要靠 AI 补全

---

## 三、横向对比矩阵

| 维度 | inkos | AI_NovelGenerator | AI-Novel-Writing-Assistant | novel-writer | AI-auto-novels | Maliang |
|------|-------|-------------------|---------------------------|-------------|----------------|---------|
| **工程化程度** | ★★★★★ | ★★ | ★★★★★ | ★★★ | ★ | ★★★ |
| **长篇一致性** | ★★★★★ | ★★★ | ★★★★ | ★★ | ★ | ★★ |
| **审计/质量控制** | ★★★★★ | ★★ | ★★★★ | ★★★ | ★ | ★ |
| **易用性** | ★★★ | ★★★★ | ★★★★ | ★★ | ★★★ | ★★★ |
| **Token 成本** | 高 | 中 | 中 | 低 | 低 | 未知 |
| **商用友好度** | AGPL | MIT | AGPL | MIT | MIT | Apache |
| **模型兼容性** | OpenAI/Claude | 所有主流 | 所有主流 | 依赖 AI 平台 | 所有主流 | 所有主流 |
| **中文优化** | ★★★★ | ★★★★ | ★★★★ | ★★★★★ | ★★★★★ | ★★★★ |
| **社区活跃度** | 极高 | 低(停维) | 极高 | 高 | 中 | 低 |
| **适合谁** | 技术写作者 | 个人创作者 | 不懂写作的新手 | 会用 AI 工具的人 | 批量生产工作室 | 想开写作平台的 |

---

## 四、核心结论

### 选型建议

- **想做最强单书质量 + 能接受 AGPL + 有 Node 开发能力** → **inkos**
  - 审计最全面，流水线最成熟，但 token 消耗高

- **想要免费商用 + 想要 GUI + 不想碰代码** → **AI_NovelGenerator**
  - MIT 协议，GUI 友好，但作者已停维，代码需自己改

- **想研究 AI 小说工程化上限 + 想学习 LangGraph 编排** → **AI-Novel-Writing-Assistant**
  - 架构最完整，自动导演理念最先进，但 AGPL + 复杂度高

- **想围绕 Claude Code / Cursor 工作流写作** → **novel-writer**
  - SDD 方法论有深度，跨平台好，但完全依赖第三方 AI

- **工作室批量生产 + 不在意代码质量** → **AI-automatically-generates-novels**
  - 经过实际生产验证，架构极简易改，但硬编码多

- **想开写作 SaaS 平台** → **MaliangAINovalWriter**
  - 唯一带计费/订阅系统，但框架重

### 共同短板

1. **没有万星项目**：AI 写网文赛道天花板约 7k stars
2. **都依赖外部 LLM**：没有项目自研了可用的领域微调模型（AI-Writer 已过时）
3. **长篇一致性仍靠 prompt 工程**：没有项目在模型层面解决长上下文遗忘问题
4. **去 AI 味是行业难题**：各项目都声称有去 AI 味功能，但效果高度依赖模型
---

## 五、最短决策版

| 目标 | 首选 | 理由 |
|------|------|------|
| 写长篇并尽量保证质量 | inkos | 10-agent 写审改闭环 + Truth Files + 33维审计，当前成熟度最高 |
| 做完整产品/研究工程架构 | AI-Novel-Writing-Assistant | 自动导演 + LangGraph + 写法引擎 + RAG + 桌面端，链路最完整 |
| 需要 MIT 商用友好 GUI | AI_NovelGenerator | 本地 GUI + ChromaDB + 多模型适配，改造成本低 |
| 工作室批量产文 | AI-automatically-generates-novels | 轻量、直接、已有工作室用法，但代码质量差 |
| Claude/Cursor 写作方法论 | novel-writer | SDD 七步流程强，适合把 AI 当协作工具而非独立平台 |
| 开写作 SaaS / 平台运营 | MaliangAINovalWriter | 用户/模型/计费/可观测/后台较完整 |
| 学模型或历史参考 | AI-Writer | RWKV 中文网文早期项目，现已过时，不建议生产用 |

**一句话结论**：实际落地优先看 `inkos`；做产品架构研究看 `AI-Novel-Writing-Assistant`；要 MIT 可商用二开看 `AI_NovelGenerator`；工作室粗放量产看 `AI-automatically-generates-novels`。
