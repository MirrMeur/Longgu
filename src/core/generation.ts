import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerateResult } from "../adapters/openaiCompatible.js";
import { ChaptersPlanDraftSchema, type ChaptersPlanDraft } from "./bookPlan.js";
import { loadLongguConfig, type LongguConfig } from "./config.js";
import { buildChapterContext, type ContextPack } from "./context.js";
import { estimateCost, estimateTokens, resolveModelRoute, type ResolvedModelProfile } from "./modelRouting.js";
import { renderChapterPrompt } from "./prompt.js";
import { createRunRecord, finishRunRecord, type RunAttemptMetadata, type RunMetadata } from "./runs.js";

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
  const route = resolveModelRoute(config, "drafting", { important: input.important });
  const contextResult = await buildChapterContext({ workspaceDir: input.workspaceDir, chapterId: input.chapterId });
  const context = contextPackToPromptContext(contextResult.pack);
  const chapterCard = await findChapterCard(input.workspaceDir, input.chapterId);
  const prompt = renderChapterPrompt({ config, chapterId: input.chapterId, context });
  const startedAt = new Date();
  const run = await createRunRecord({
    workspaceDir: input.workspaceDir,
    chapterId: input.chapterId,
    provider: route.primary.profile.provider.name,
    model: route.primary.profile.provider.model,
    startedAt,
    prompt,
    context
  });
  const inputTokens = estimateTokens(prompt);

  try {
    const routed = await generateWithRoute({
      prompt,
      config,
      routeProfiles: [route.primary, ...(route.fallback ? [route.fallback] : [])],
      apiKey: input.apiKey,
      readApiKey: input.readApiKey,
      generate: input.generate
    });
    const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
    await mkdir(path.dirname(chapterPath), { recursive: true });
    const chapterText = normalizeGeneratedChapterHeading(routed.result.text, input.chapterId, chapterCard?.title);
    await writeFile(chapterPath, chapterText, "utf8");
    const outputTokens = estimateTokens(chapterText);
    const finishedAt = new Date();
    const metadata: RunMetadata = {
      id: run.id,
      status: "success",
      chapterId: input.chapterId,
      task: "drafting",
      provider: routed.profile.profile.provider.name,
      model: routed.profile.profile.provider.model,
      modelProfile: routed.profile.id,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      inputFiles: context.map((item) => item.file),
      promptFile: "prompt.md",
      outputFile: "output.md",
      fallbackAttempts: routed.attempts.filter((attempt) => attempt.status === "failed").length,
      inputTokens,
      outputTokens,
      estimatedCost: estimateCost(inputTokens, outputTokens, routed.profile.profile.cost),
      attempts: routed.attempts
    };
    await finishRunRecord({ dir: run.dir, metadata, output: chapterText });
    return { chapterPath, runDir: run.dir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const finishedAt = new Date();
    const metadata: RunMetadata = {
      id: run.id,
      status: "failed",
      chapterId: input.chapterId,
      task: "drafting",
      provider: route.primary.profile.provider.name,
      model: route.primary.profile.provider.model,
      modelProfile: route.primary.id,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      inputFiles: context.map((item) => item.file),
      promptFile: "prompt.md",
      errorFile: "error.txt",
      fallbackAttempts: route.fallback ? 1 : 0,
      inputTokens,
      outputTokens: 0,
      estimatedCost: 0
    };
    await finishRunRecord({ dir: run.dir, metadata, error: message });
    throw new Error(message);
  }
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

async function generateWithRoute(input: {
  prompt: string;
  config: LongguConfig;
  routeProfiles: ResolvedModelProfile[];
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate: GenerateChapterFn;
}): Promise<{ result: GenerateResult; profile: ResolvedModelProfile; attempts: RunAttemptMetadata[] }> {
  const attempts: RunAttemptMetadata[] = [];
  let lastError = "";
  for (const profile of input.routeProfiles) {
    const routedConfig: LongguConfig = { ...input.config, provider: profile.profile.provider };
    const apiKey = input.readApiKey ? input.readApiKey(profile.profile.provider.apiKeyEnv) : input.apiKey;
    if (!apiKey) {
      throw new Error(`API key check failed. Environment variable ${profile.profile.provider.apiKeyEnv} is not set.`);
    }
    try {
      const result = await input.generate({ prompt: input.prompt, config: routedConfig, apiKey });
      attempts.push({
        modelProfile: profile.id,
        provider: profile.profile.provider.name,
        model: profile.profile.provider.model,
        status: "success"
      });
      return { result, profile, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      attempts.push({
        modelProfile: profile.id,
        provider: profile.profile.provider.name,
        model: profile.profile.provider.model,
        status: "failed",
        error: lastError
      });
    }
  }
  throw new Error(lastError || "Provider generation failed.");
}
