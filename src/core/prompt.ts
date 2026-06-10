import { defaultDraftingTargetWords, type LongguConfig } from "./config.js";

export function renderChapterPrompt(input: {
  config: LongguConfig;
  chapterId: string;
  targetWords?: number;
  context: { file: string; content: string }[];
}): string {
  const targetWords = input.targetWords ?? input.config.drafting?.targetWords ?? defaultDraftingTargetWords;
  const contextText = input.context
    .map((item) => `## ${item.file}\n\n${item.content.trim()}`)
    .join("\n\n---\n\n");

  return `你是中文商业网文写作助手。请根据以下项目设定写第 ${input.chapterId} 章。

要求：
- 类型：${input.config.genre}
- 语言：${input.config.language}
- 目标字数：约 ${targetWords} 字，允许上下浮动 10%，不要为了撑满 maxTokens 而冗长铺写
- 输出 Markdown 正文
- 不要解释写作过程
- 不要输出大纲或分析
- 保持角色、世界观和文风约束一致

项目资料：

${contextText}

请开始写第 ${input.chapterId} 章：`;
}
