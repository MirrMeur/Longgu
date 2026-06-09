import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerateResult } from "../adapters/openaiCompatible.js";
import { ChaptersPlanDraftSchema, type ChaptersPlanDraft } from "./bookPlan.js";
import { loadLongguConfig, type LongguConfig } from "./config.js";
import { buildChapterContext, type ContextPack } from "./context.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { renderChapterPrompt } from "./prompt.js";

export type GenerateChapterFn = (request: {
  prompt: string;
  config: LongguConfig;
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
  const config = await loadLongguConfig(input.workspaceDir);
  const contextResult = await buildChapterContext({ workspaceDir: input.workspaceDir, chapterId: input.chapterId });
  const context = contextPackToPromptContext(contextResult.pack);
  const chapterCard = await findChapterCard(input.workspaceDir, input.chapterId);
  const prompt = renderChapterPrompt({ config, chapterId: input.chapterId, context });
  const routed = await runRoutedTextGeneration({
    workspaceDir: input.workspaceDir,
    task: "drafting",
    subjectId: input.chapterId,
    config,
    prompt,
    context,
    important: input.important,
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate
  });

  const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
  await mkdir(path.dirname(chapterPath), { recursive: true });
  const chapterText = normalizeGeneratedChapterHeading(routed.text, input.chapterId, chapterCard?.title);
  await writeFile(chapterPath, chapterText, "utf8");
  return { chapterPath, runDir: routed.runDir };
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
