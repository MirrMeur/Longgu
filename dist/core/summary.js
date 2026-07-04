import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ChapterSummarySchema } from "./context.js";
import { loadLongguConfig, requireProviderBackedConfig } from "./config.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { parseProviderJsonObject } from "./providerJson.js";
import { pathExists } from "./workspace.js";
export async function summarizeChapter(input) {
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
    const guidedSummaryPath = await writeGuidedChapterSummary(input.workspaceDir, summary);
    const recentContextPath = await updateRecentContext(input.workspaceDir, summary);
    return { summary, summaryPath, guidedSummaryPath, recentContextPath, runDir: result.runDir };
}
async function writeGuidedChapterSummary(workspaceDir, summary) {
    const outputDir = path.join(workspaceDir, "05_前情与状态", "章节摘要");
    await mkdir(outputDir, { recursive: true });
    const summaryPath = path.join(outputDir, `第${summary.chapterId}章_摘要.md`);
    await writeFile(summaryPath, renderGuidedChapterSummary(summary), "utf8");
    return summaryPath;
}
async function updateRecentContext(workspaceDir, summary) {
    const outputDir = path.join(workspaceDir, "05_前情与状态");
    await mkdir(outputDir, { recursive: true });
    const recentContextPath = path.join(outputDir, "近期前情.md");
    await writeFile(recentContextPath, renderRecentContext(summary), "utf8");
    return recentContextPath;
}
function renderGuidedChapterSummary(summary) {
    return `# 第${summary.chapterId}章_摘要

> 本文件由章节摘要生成。作者可直接修改，AI 后续必须以本文件为准。

## 标题

${summary.title ?? "未命名"}

## 本章摘要

${summary.summary ?? "待补充。"}

## 状态变化

- 请在 AI 审稿或状态更新后补充。

## 新增/加深/回收伏笔

- 请对照 \`04_伏笔与期待/伏笔账本.md\` 更新。

## 影响下一章

- 请对照 \`05_前情与状态/近期前情.md\` 更新。
`;
}
function renderRecentContext(summary) {
    return `# 近期前情

> 作者可直接修改。AI 后续必须以本文件为准。

更新时间：第${summary.chapterId}章后

## 最近发生

- 第${summary.chapterId}章：${summary.summary ?? "待补充。"}

## 下一章必须承接

- 承接第${summary.chapterId}章结尾状态。

## 不能重复

- 不要把第${summary.chapterId}章已经完成的发现、解释或冲突当成新内容重复呈现。
`;
}
function renderChapterSummaryPrompt(input) {
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
function parseSummaryFromText(text) {
    return parseProviderJsonObject(text, "Chapter summary provider response did not contain a JSON object.");
}
function normalizeChapterSummary(input) {
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
