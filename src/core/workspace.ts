import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const BIBLE_FILES = [
  "premise.md",
  "characters.md",
  "world.md",
  "style.md"
] as const;

export const GUIDED_ROOT_FILES = ["当前步骤.md", "创作流程.md", "已确认决定.md", "项目说明.md"] as const;

export const GUIDED_DIRECTORIES = [
  "01_立项设定",
  "02_设定圣经",
  "03_大纲",
  "04_伏笔与期待",
  "05_前情与状态",
  "06_章节规划",
  "07_正文",
  "08_AI审稿"
] as const;

const starterFiles: Record<string, string> = {
  "longgu.yaml": `title: 未命名小说
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
`,
  "bible/premise.md": `# Premise

一句话卖点：

主线矛盾：

读者承诺：
`,
  "bible/characters.md": `# Characters

## 主角

- 姓名：
- 欲望：
- 弱点：
- 金手指：
`,
  "bible/world.md": `# World

世界基础规则：

核心资源：

主要势力：
`,
  "bible/style.md": `# Style

叙事视角：

文风约束：

禁用表达：
`,
  "bible/payoff-recipes.md": `# 爽点配方

## 核心爽点类型

- [ ] 反差打脸
- [ ] 降维打击
- [ ] 身份误会

## 节奏约束

- 最小爽点间隔：2500 字
- 章尾必须保留钩子型爽点
- CP 互动最低频率：每 3 章 1 场非任务互动

## 名场面设计提示

- 每卷至少设计 1 个读者会截图传播的场景
`
};

const guidedStarterFiles: Record<string, string> = {
  "项目说明.md": `# 项目说明

这里是一本独立小说项目。小说资产使用中文目录保存，作者可以直接打开和修改。

## 默认入口

先看 \`当前步骤.md\`。如果想了解完整路线，再看 \`创作流程.md\`。

## 作者手改优先

作者直接修改的设定、大纲、正文、伏笔和状态文件，都是后续生成与审稿的最高优先级输入。
`,
  "当前步骤.md": `# 当前步骤

阶段：1. 立项设定
状态：等待作者填写或确认
进度：1 / 9

## 本步骤目标

确定这本书写什么、给谁看、核心卖点是什么。

## 你现在需要看

1. \`01_立项设定/创作目标.md\`
2. \`01_立项设定/故事卖点.md\`
3. \`01_立项设定/读者承诺.md\`
4. \`01_立项设定/不写什么.md\`

## 你可以直接改

- \`01_立项设定/创作目标.md\`
- \`01_立项设定/故事卖点.md\`
- \`01_立项设定/读者承诺.md\`
- \`01_立项设定/不写什么.md\`

## 改这些会影响

- 设定圣经
- 全书大纲
- 分卷大纲
- 章节规划
- AI 审稿标准

## 如果你批准

下一步生成或完善：\`02_设定圣经/\`。

## 你可以回复

- 批准当前步骤，进入下一步
- 我改了设定，按当前文件继续推进
- 重做立项设定
- 解释当前步骤为什么要看这些文件
`,
  "创作流程.md": `# 创作流程

本项目按以下顺序推进。AI 每次继续工作前，必须先读取 \`当前步骤.md\` 和本文件。

## 总原则

1. 作者手改文件优先级最高。
2. 没有作者确认，不进入下一大阶段。
3. 不跳过章节规划直接写正文。
4. 每次生成都要说明读取了什么、写入了什么、下一步是什么。
5. AI 审稿只给建议，最终是否修改由作者决定。
6. 写新章默认不读取全部历史正文，只读取前情压缩、状态账本、当前章规划和上一章正文。

## 阶段路线

1. 立项设定：确定创作目标、故事卖点、读者承诺和不写什么。
2. 设定圣经：确定故事核心、世界、角色、势力和风格。
3. 全书大纲：确定主线、成长线、世界谜团和结局方向。
4. 分卷大纲：确定每卷目标、高潮、卷尾爆点。
5. 伏笔与期待：维护伏笔账本、章尾钩子和读者期待。
6. 前情与状态：维护总前情、当前卷前情、近期前情、角色状态、世界状态、关系状态、未解决问题和连续性风险。
7. 章节规划：写正文前明确单章任务。
8. 正文：生成或作者写作正文。
9. AI 审稿与状态更新：检查正文并回写前情、状态和伏笔。

## 推进规则

- 当前步骤状态为“等待作者审核”时，AI 不得自动进入下一阶段。
- 作者批准后，AI 必须把决定写入 \`已确认决定.md\`。
- 作者修改上游文件后，AI 必须提示可能影响的下游文件。
- 每章正文完成后，必须先进行 AI 审稿，再更新前情与状态。
`,
  "已确认决定.md": `# 已确认决定

这里记录作者已经拍板的关键决定。后续生成不得随意推翻。

## 立项设定

- 待确认。

## 设定圣经

- 待确认。

## 大纲

- 待确认。

## 章节规划

- 待确认。

## 审稿取舍

- 待确认。
`,
  "01_立项设定/_说明.md": renderDirectoryGuide({
    title: "01_立项设定",
    purpose: "确定这本书为什么写、写给谁看、核心卖点是什么。",
    when: "开新书、调整定位、发现后续生成跑偏时。",
    impact: "影响设定圣经、全书大纲、读者期待、章节规划和 AI 审稿标准。",
    files: ["创作目标.md", "故事卖点.md", "读者承诺.md", "不写什么.md"]
  }),
  "01_立项设定/创作目标.md": `# 创作目标

> 作者可直接修改。AI 后续必须以本文件为准。

## 题材


## 目标平台/读者


## 篇幅目标


## 更新目标


## 这本书最想满足的读者情绪


`,
  "01_立项设定/故事卖点.md": `# 故事卖点

> 作者可直接修改。AI 后续必须以本文件为准。

## 一句话卖点


## 核心差异点


## 长篇潜力


## 最大风险


`,
  "01_立项设定/读者承诺.md": `# 读者承诺

> 作者可直接修改。AI 后续必须以本文件为准。

这本书承诺读者看到：

-

## 爽点节奏


## 追读理由


## 卷尾期待


`,
  "01_立项设定/不写什么.md": `# 不写什么

> 作者可直接修改。AI 后续必须以本文件为准。

## 雷点

-

## 禁止路线

-

## 禁止写法

-
`,
  "02_设定圣经/_说明.md": renderDirectoryGuide({
    title: "02_设定圣经",
    purpose: "保存长期有效的故事、世界、角色、势力和风格设定。",
    when: "设定成型、角色登场、世界规则变化、发现人设不对时。",
    impact: "影响大纲、章节规划、正文生成、AI 审稿和连续性检查。",
    files: ["故事核心.md", "世界设定.md", "角色设定/主角.md", "角色设定/重要配角.md", "角色设定/反派.md", "势力设定.md", "风格要求.md"]
  }),
  "02_设定圣经/故事核心.md": `# 故事核心

> 作者可直接修改。AI 后续必须以本文件为准。

## 核心命题


## 主线矛盾


## 长期谜团


## 结局倾向


`,
  "02_设定圣经/世界设定.md": `# 世界设定

> 作者可直接修改。AI 后续必须以本文件为准。

## 世界基础规则


## 核心资源


## 危险与代价


## 不能违反

-
`,
  "02_设定圣经/风格要求.md": `# 风格要求

> 作者可直接修改。AI 后续必须以本文件为准。

## 叙事视角


## 文风约束


## 禁用表达

-
`,
  "02_设定圣经/势力设定.md": `# 势力设定

> 作者可直接修改。AI 后续必须以本文件为准。

| 势力 | 目标 | 资源 | 与主角关系 | 当前状态 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
`,
  "02_设定圣经/角色设定/主角.md": `# 主角

> 作者可直接修改。AI 后续必须以本文件为准。

## 一句话定位


## 背景史


## 核心欲望


## 弱点与代价


## 成长方向


## 不能写错

-
`,
  "02_设定圣经/角色设定/重要配角.md": `# 重要配角

> 作者可直接修改。AI 后续必须以本文件为准。

| 角色 | 功能 | 欲望 | 与主角关系 | 后续变化 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
`,
  "02_设定圣经/角色设定/反派.md": `# 反派

> 作者可直接修改。AI 后续必须以本文件为准。

| 反派 | 压迫来源 | 目标 | 资源 | 阶段作用 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
`,
  "03_大纲/_说明.md": renderDirectoryGuide({
    title: "03_大纲",
    purpose: "保存全书、分卷和章节层级的路线。",
    when: "立项和设定确认后；准备拆卷、拆章或发现主线跑偏时。",
    impact: "影响伏笔规划、章节规划、正文生成和 AI 审稿。",
    files: ["全书大纲.md", "分卷大纲.md", "章节列表.md"]
  }),
  "03_大纲/全书大纲.md": `# 全书大纲

> 作者可直接修改。AI 后续必须以本文件为准。

## 全书主线


## 成长线


## 世界谜团线


## 阶段结构

| 阶段 | 章节范围 | 目标 | 高潮 | 转折 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
`,
  "03_大纲/分卷大纲.md": `# 分卷大纲

> 作者可直接修改。AI 后续必须以本文件为准。

| 卷 | 目标 | 主要反派/压力 | 关键爽点 | 卷尾爆点 |
| --- | --- | --- | --- | --- |
| 第一卷 |  |  |  |  |
`,
  "03_大纲/章节列表.md": `# 章节列表

> 作者可直接修改。AI 后续必须以本文件为准。

| 章节 | 标题 | 本章作用 | 章尾钩子 | 状态 |
| --- | --- | --- | --- | --- |
| 第001章 |  |  |  | 规划中 |
`,
  "04_伏笔与期待/_说明.md": renderDirectoryGuide({
    title: "04_伏笔与期待",
    purpose: "管理读者为什么追、哪些坑要埋、何时加深、何时回收。",
    when: "拆卷、拆章、写正文、AI 审稿和状态更新时。",
    impact: "影响章节规划、章尾钩子、正文生成、AI 审稿和前情状态。",
    files: ["伏笔账本.md", "章尾钩子.md", "读者期待.md"]
  }),
  "04_伏笔与期待/伏笔账本.md": `# 伏笔账本

> 作者可直接修改。AI 后续必须以本文件为准。

| 编号 | 伏笔 | 首次出现 | 原文锚点 | 当前状态 | 计划回收 | 作者备注 |
| --- | --- | --- | --- | --- | --- | --- |
| F001 |  |  |  | 未埋 |  |  |
`,
  "04_伏笔与期待/章尾钩子.md": `# 章尾钩子

> 作者可直接修改。AI 后续必须以本文件为准。

| 章节 | 钩子 | 类型 | 承接方式 | 状态 |
| --- | --- | --- | --- | --- |
| 第001章 |  |  |  | 待设计 |
`,
  "04_伏笔与期待/读者期待.md": `# 读者期待

> 作者可直接修改。AI 后续必须以本文件为准。

## 当前核心期待

-

## 爽点密度


## 风险

-
`,
  "05_前情与状态/_说明.md": renderDirectoryGuide({
    title: "05_前情与状态",
    purpose: "保存压缩前情和当前状态，避免每章重复读取全部历史正文。",
    when: "写新章前、AI 审稿后、章节完成后。",
    impact: "影响下一章上下文、连续性检查、伏笔回收和状态更新。",
    files: ["总前情.md", "当前卷前情.md", "近期前情.md", "章节摘要/", "角色状态.md", "世界状态.md", "关系状态.md", "未解决问题.md", "连续性风险.md"]
  }),
  "05_前情与状态/总前情.md": `# 总前情

> 作者可直接修改。AI 后续必须以本文件为准。

尚未开始正文。
`,
  "05_前情与状态/当前卷前情.md": `# 当前卷前情

> 作者可直接修改。AI 后续必须以本文件为准。

尚未开始当前卷。
`,
  "05_前情与状态/近期前情.md": `# 近期前情

> 作者可直接修改。AI 后续必须以本文件为准。

## 最近发生

- 尚未开始正文。

## 下一章必须承接

-

## 不能重复

-
`,
  "05_前情与状态/角色状态.md": `# 角色状态

> 作者可直接修改。AI 后续必须以本文件为准。

## 主角

当前位置：
身体状态：
持有物：
知道的信息：
不知道的信息：
情绪状态：
不能写错：

-
`,
  "05_前情与状态/世界状态.md": `# 世界状态

> 作者可直接修改。AI 后续必须以本文件为准。

## 当前世界状态


## 已改变规则

-
`,
  "05_前情与状态/关系状态.md": `# 关系状态

> 作者可直接修改。AI 后续必须以本文件为准。

| 角色A | 角色B | 当前关系 | 变化来源 | 注意事项 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
`,
  "05_前情与状态/未解决问题.md": `# 未解决问题

> 作者可直接修改。AI 后续必须以本文件为准。

| 编号 | 问题 | 首次出现 | 当前状态 | 计划处理 |
| --- | --- | --- | --- | --- |
| Q001 |  |  | 未解释 |  |
`,
  "05_前情与状态/连续性风险.md": `# 连续性风险

> 作者可直接修改。AI 后续必须以本文件为准。

## 高风险

-

## 不能写错

-
`,
  "05_前情与状态/章节摘要/.gitkeep": "",
  "06_章节规划/_说明.md": renderDirectoryGuide({
    title: "06_章节规划",
    purpose: "保存写正文前的单章任务书。",
    when: "每章正文生成或作者动笔前。",
    impact: "影响正文生成、AI 审稿和状态更新。",
    files: ["第001章_规划.md"]
  }),
  "06_章节规划/第001章_规划.md": renderChapterPlanTemplate("001"),
  "07_正文/_说明.md": renderDirectoryGuide({
    title: "07_正文",
    purpose: "保存真正的小说正文。",
    when: "章节规划确认后，由 AI 生成或作者手写。",
    impact: "影响 AI 审稿、章节摘要、前情状态和伏笔账本。",
    files: ["第001章.md"]
  }),
  "07_正文/第001章.md": `# 第001章

`,
  "08_AI审稿/_说明.md": renderDirectoryGuide({
    title: "08_AI审稿",
    purpose: "保存 AI 对正文的检查结果和修改建议。",
    when: "每章正文完成后。",
    impact: "影响正文修改、前情状态更新和伏笔账本更新。AI 审稿只提供建议，最终由作者决定。",
    files: ["第001章_审稿.md"]
  }),
  "08_AI审稿/第001章_审稿.md": renderAiReviewTemplate("001")
};

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function initWorkspace(workspaceDir: string): Promise<{ created: string[]; existing: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];

  for (const dir of ["bible", "outlines", "state", "chapters", "runs", ...GUIDED_DIRECTORIES]) {
    const dirPath = path.join(workspaceDir, dir);
    if (await pathExists(dirPath)) {
      existing.push(dir);
    } else {
      await mkdir(dirPath, { recursive: true });
      created.push(dir);
    }
  }

  for (const [relativePath, content] of Object.entries({ ...starterFiles, ...guidedStarterFiles })) {
    const filePath = path.join(workspaceDir, relativePath);
    if (await pathExists(filePath)) {
      existing.push(relativePath);
      continue;
    }
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
    created.push(relativePath);
  }

  return { created, existing };
}

export async function assertWorkspaceShape(workspaceDir: string): Promise<string[]> {
  const missing: string[] = [];
  for (const relativePath of [
    "longgu.yaml",
    "bible",
    "outlines",
    "state",
    "chapters",
    "runs",
    ...GUIDED_ROOT_FILES,
    ...GUIDED_DIRECTORIES
  ]) {
    if (!(await pathExists(path.join(workspaceDir, relativePath)))) {
      missing.push(relativePath);
    }
  }
  for (const file of BIBLE_FILES) {
    const relativePath = path.join("bible", file);
    if (!(await pathExists(path.join(workspaceDir, relativePath)))) {
      missing.push(relativePath);
    }
  }
  for (const dir of GUIDED_DIRECTORIES) {
    const guide = path.join(dir, "_说明.md");
    if (!(await pathExists(path.join(workspaceDir, guide)))) {
      missing.push(guide);
    }
  }
  return missing;
}

export async function assertGuidedWorkspaceShape(workspaceDir: string): Promise<string[]> {
  const missing: string[] = [];
  for (const relativePath of [...GUIDED_ROOT_FILES, ...GUIDED_DIRECTORIES]) {
    if (!(await pathExists(path.join(workspaceDir, relativePath)))) {
      missing.push(relativePath);
    }
  }
  for (const dir of GUIDED_DIRECTORIES) {
    const guide = path.join(dir, "_说明.md");
    if (!(await pathExists(path.join(workspaceDir, guide)))) {
      missing.push(guide);
    }
  }
  return missing;
}

export async function loadBibleContext(workspaceDir: string): Promise<{ file: string; content: string }[]> {
  const bibleDir = path.join(workspaceDir, "bible");
  const entries = await readdir(bibleDir);
  const markdownFiles = entries.filter((entry) => entry.endsWith(".md")).sort();
  const context: { file: string; content: string }[] = [];

  for (const file of markdownFiles) {
    context.push({
      file: path.join("bible", file),
      content: await readFile(path.join(bibleDir, file), "utf8")
    });
  }

  return context;
}

export function renderChapterPlanTemplate(chapterId: string): string {
  return `# 第${chapterId}章_规划

> 作者可直接修改。AI 写正文和审稿必须以本文件为准。

## 本章作用


## 本章必须发生

-

## 本章不能发生

-

## 读者看点

-

## 爽点


## 伏笔

-

## 章尾钩子


## 连续性风险

-
`;
}

export function renderAiReviewTemplate(chapterId: string): string {
  return `# 第${chapterId}章_审稿

## 总评

待审稿。

## 章节规划符合度


## 读者期待


## 伏笔检查


## 连续性检查


## 角色一致性


## 建议修改

-
`;
}

function renderDirectoryGuide(input: {
  title: string;
  purpose: string;
  when: string;
  impact: string;
  files: string[];
}): string {
  return `# ${input.title}

## 这个目录是什么

${input.purpose}

## 你什么时候看

${input.when}

## 你可以直接改吗

可以。作者手改内容优先级最高。

## 会影响什么

${input.impact}

## 常看文件

${input.files.map((file) => `- \`${file}\``).join("\n")}
`;
}
