import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerateResult } from "../adapters/openaiCompatible.js";
import { loadLongguConfig, type LongguConfig } from "./config.js";
import { estimateCost, estimateTokens, resolveModelRoute, type ResolvedModelProfile } from "./modelRouting.js";
import { renderChapterPrompt } from "./prompt.js";
import { createRunRecord, finishRunRecord, type RunAttemptMetadata, type RunMetadata } from "./runs.js";
import { loadBibleContext } from "./workspace.js";

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
  const context = await loadBibleContext(input.workspaceDir);
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
    await writeFile(chapterPath, routed.result.text, "utf8");
    const outputTokens = estimateTokens(routed.result.text);
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
    await finishRunRecord({ dir: run.dir, metadata, output: routed.result.text });
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
