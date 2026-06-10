import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ChapterSummarySchema, type ChapterSummary } from "./context.js";
import { loadLongguConfig, requireProviderBackedConfig, type LongguConfig } from "./config.js";
import { runRoutedTextGeneration, type GenerateTextFn } from "./modelExecution.js";
import { parseProviderJsonObject } from "./providerJson.js";
import { pathExists } from "./workspace.js";

export type GenerateChapterSummaryFn = GenerateTextFn;

export interface SummarizeChapterResult {
  summary: ChapterSummary;
  summaryPath: string;
  runDir: string;
}

export async function summarizeChapter(input: {
  workspaceDir: string;
  chapterId: string;
  config?: LongguConfig;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate: GenerateChapterSummaryFn;
  now?: Date;
}): Promise<SummarizeChapterResult> {
  const chapterRelative = path.join("chapters", `${input.chapterId}.md`);
  const chapterPath = path.join(input.workspaceDir, chapterRelative);
  if (!(await pathExists(chapterPath))) {
    throw new Error(`Chapter body is required before summary generation: ${chapterRelative}`);
  }
  const config = requireProviderBackedConfig(input.config ?? (await loadLongguConfig(input.workspaceDir)));
  if ((!input.apiKey && !input.readApiKey) || !input.generate) {
    throw new Error("Chapter summary requires provider config and API key.");
  }

  const chapterText = await readFile(chapterPath, "utf8");
  const prompt = renderChapterSummaryPrompt({ chapterId: input.chapterId, chapterText });
  const result = await runRoutedTextGeneration({
    workspaceDir: input.workspaceDir,
    task: "summarize",
    subjectId: input.chapterId,
    config,
    prompt,
    context: [{ file: chapterRelative, content: chapterText }],
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate
  });
  const summary = normalizeChapterSummary({
    raw: parseSummaryFromText(result.text),
    chapterId: input.chapterId,
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  const outputDir = path.join(input.workspaceDir, "summaries");
  await mkdir(outputDir, { recursive: true });
  const summaryPath = path.join(outputDir, `${input.chapterId}.summary.json`);
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return { summary, summaryPath, runDir: result.runDir };
}

function renderChapterSummaryPrompt(input: { chapterId: string; chapterText: string }): string {
  return `你是龙骨 Longgu 的章节摘要器。请阅读章节正文，只输出一个 JSON 对象，不要输出 Markdown，不要解释。

JSON 必须符合：
- schemaVersion 固定为 "longgu.chapter-summary.v0.7"
- chapterId 固定为 "${input.chapterId}"
- title 为章节标题或简短标题
- summary 用 2-4 句中文概括本章关键行动、状态变化、伏笔和未兑现承诺
- generatedAt 可省略，由 Longgu 写入

章节正文 chapters/${input.chapterId}.md：

${input.chapterText}

只输出 JSON：`;
}

function parseSummaryFromText(text: string): unknown {
  return parseProviderJsonObject(text, "Chapter summary provider response did not contain a JSON object.");
}

function normalizeChapterSummary(input: { raw: unknown; chapterId: string; generatedAt: string }): ChapterSummary {
  const parsed = ChapterSummarySchema.parse(input.raw);
  if (parsed.chapterId !== input.chapterId) {
    throw new Error(`Chapter summary chapterId mismatch: expected ${input.chapterId}, received ${parsed.chapterId}.`);
  }
  return ChapterSummarySchema.parse({
    ...parsed,
    schemaVersion: parsed.schemaVersion ?? "longgu.chapter-summary.v0.7",
    generatedAt: parsed.generatedAt ?? input.generatedAt
  });
}
