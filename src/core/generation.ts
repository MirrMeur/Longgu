import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerateResult } from "../adapters/openaiCompatible.js";
import { ChaptersPlanDraftSchema, type ChaptersPlanDraft } from "./bookPlan.js";
import { loadLongguConfig, requireProviderBackedConfig, type ProviderBackedLongguConfig, type LongguConfig } from "./config.js";
import { buildChapterContext, type ContextPack } from "./context.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { estimateTokens } from "./modelRouting.js";
import { renderChapterPrompt } from "./prompt.js";
import { createRunRecord, finishRunRecord } from "./runs.js";

export type GenerateChapterFn = (request: {
  prompt: string;
  config: ProviderBackedLongguConfig;
  apiKey: string;
}) => Promise<GenerateResult>;

export async function writeChapter(input: {
  workspaceDir: string;
  chapterId: string;
  apiKey?: string;
  important?: boolean;
  readApiKey?: (envName: string) => string;
  generate: GenerateChapterFn;
}): Promise<{ chapterPath: string; runDir: string }> {
  const draftInput = await prepareChapterDraftingInput(input.workspaceDir, input.chapterId);
  const config = requireProviderBackedConfig(draftInput.config);
  const routed = await runRoutedTextGeneration({
    workspaceDir: input.workspaceDir,
    task: "drafting",
    subjectId: input.chapterId,
    config,
    prompt: draftInput.prompt,
    context: draftInput.context,
    important: input.important,
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate
  });

  const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
  await mkdir(path.dirname(chapterPath), { recursive: true });
  const chapterText = normalizeGeneratedChapterHeading(routed.text, input.chapterId, draftInput.chapterTitle);
  await writeFile(chapterPath, chapterText, "utf8");
  return { chapterPath, runDir: routed.runDir };
}

export async function exportHostChapterPrompt(input: {
  workspaceDir: string;
  chapterId: string;
}): Promise<{ promptPath: string; contextJsonPath: string; contextMarkdownPath: string }> {
  const draftInput = await prepareChapterDraftingInput(input.workspaceDir, input.chapterId);
  const outputDir = path.join(input.workspaceDir, "host-prompts");
  await mkdir(outputDir, { recursive: true });
  const promptPath = path.join(outputDir, `${input.chapterId}.prompt.md`);
  await writeFile(promptPath, draftInput.prompt, "utf8");
  return {
    promptPath,
    contextJsonPath: draftInput.contextJsonPath,
    contextMarkdownPath: draftInput.contextMarkdownPath
  };
}

export async function importHostChapterDraft(input: {
  workspaceDir: string;
  chapterId: string;
  inputPath: string;
  now?: Date;
}): Promise<{ chapterPath: string; runDir: string }> {
  const startedAt = input.now ?? new Date();
  const draftInput = await prepareChapterDraftingInput(input.workspaceDir, input.chapterId);
  const sourcePath = resolveWorkspacePath(input.workspaceDir, input.inputPath);
  const rawDraft = await readFile(sourcePath, "utf8");
  const chapterText = normalizeGeneratedChapterHeading(rawDraft, input.chapterId, draftInput.chapterTitle);
  const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
  await mkdir(path.dirname(chapterPath), { recursive: true });
  await writeFile(chapterPath, chapterText, "utf8");

  const run = await createRunRecord({
    workspaceDir: input.workspaceDir,
    chapterId: input.chapterId,
    provider: "host-llm",
    model: "host-llm",
    startedAt,
    prompt: draftInput.prompt,
    context: draftInput.context
  });
  const finishedAt = new Date();
  await finishRunRecord({
    dir: run.dir,
    output: chapterText,
    metadata: {
      id: run.id,
      status: "success",
      chapterId: input.chapterId,
      task: "drafting",
      provider: "host-llm",
      model: "host-llm",
      modelProfile: "host",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      inputFiles: draftInput.context.map((item) => item.file),
      promptFile: "prompt.md",
      outputFile: "output.md",
      fallbackAttempts: 0,
      inputTokens: estimateTokens(draftInput.prompt),
      outputTokens: estimateTokens(chapterText),
      estimatedCost: 0,
      attempts: [
        {
          modelProfile: "host",
          provider: "host-llm",
          model: "host-llm",
          status: "success"
        }
      ]
    }
  });
  return { chapterPath, runDir: run.dir };
}

async function prepareChapterDraftingInput(
  workspaceDir: string,
  chapterId: string
): Promise<{
  config: LongguConfig;
  context: { file: string; content: string }[];
  prompt: string;
  chapterTitle?: string;
  contextJsonPath: string;
  contextMarkdownPath: string;
}> {
  const config = await loadLongguConfig(workspaceDir);
  const contextResult = await buildChapterContext({ workspaceDir, chapterId });
  const context = contextPackToPromptContext(contextResult.pack);
  const chapterCard = await findChapterCard(workspaceDir, chapterId);
  const prompt = renderChapterPrompt({ config, chapterId, context });
  return {
    config,
    context,
    prompt,
    chapterTitle: chapterCard?.title,
    contextJsonPath: contextResult.jsonPath,
    contextMarkdownPath: contextResult.markdownPath
  };
}

function contextPackToPromptContext(pack: ContextPack): { file: string; content: string }[] {
  return pack.sections
    .filter((section) => section.included)
    .map((section) => ({
      file: section.source,
      content: section.content
    }));
}

async function findChapterCard(
  workspaceDir: string,
  chapterId: string
): Promise<ChaptersPlanDraft["chapters"][number] | null> {
  const outlinesDir = path.join(workspaceDir, "outlines");
  const entries = await readdir(outlinesDir).catch(() => []);
  for (const file of entries.filter((entry) => entry.startsWith("chapters-") && entry.endsWith(".draft.json")).sort()) {
    const raw = await readFile(path.join(outlinesDir, file), "utf8");
    const plan = ChaptersPlanDraftSchema.parse(JSON.parse(raw) as unknown);
    const chapter = plan.chapters.find((entry) => entry.chapterId === chapterId);
    if (chapter) {
      return chapter;
    }
  }
  return null;
}

function normalizeGeneratedChapterHeading(text: string, chapterId: string, plannedTitle?: string): string {
  if (!plannedTitle) {
    return text;
  }

  const body = text.replace(/^\s*# .*(?:\r?\n|$)/, "").trimStart();
  const normalized = `# 第${chapterId}章 ${plannedTitle}`;
  return body ? `${normalized}\n\n${body}` : `${normalized}\n`;
}

function resolveWorkspacePath(workspaceDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(workspaceDir, inputPath);
}
