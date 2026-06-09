import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerateResult } from "../adapters/openaiCompatible.js";
import { loadLongguConfig, type LongguConfig } from "./config.js";
import { renderChapterPrompt } from "./prompt.js";
import { createRunRecord, finishRunRecord, type RunMetadata } from "./runs.js";
import { loadBibleContext } from "./workspace.js";

export type GenerateChapterFn = (request: {
  prompt: string;
  config: LongguConfig;
  apiKey: string;
}) => Promise<GenerateResult>;

export async function writeChapter(input: {
  workspaceDir: string;
  chapterId: string;
  apiKey: string;
  generate: GenerateChapterFn;
}): Promise<{ chapterPath: string; runDir: string }> {
  const config = await loadLongguConfig(input.workspaceDir);
  const context = await loadBibleContext(input.workspaceDir);
  const prompt = renderChapterPrompt({ config, chapterId: input.chapterId, context });
  const startedAt = new Date();
  const run = await createRunRecord({
    workspaceDir: input.workspaceDir,
    chapterId: input.chapterId,
    provider: config.provider.name,
    model: config.provider.model,
    startedAt,
    prompt,
    context
  });

  try {
    const result = await input.generate({ prompt, config, apiKey: input.apiKey });
    const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
    await mkdir(path.dirname(chapterPath), { recursive: true });
    await writeFile(chapterPath, result.text, "utf8");
    const metadata: RunMetadata = {
      id: run.id,
      status: "success",
      chapterId: input.chapterId,
      provider: config.provider.name,
      model: config.provider.model,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      inputFiles: context.map((item) => item.file),
      promptFile: "prompt.md",
      outputFile: "output.md"
    };
    await finishRunRecord({ dir: run.dir, metadata, output: result.text });
    return { chapterPath, runDir: run.dir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const metadata: RunMetadata = {
      id: run.id,
      status: "failed",
      chapterId: input.chapterId,
      provider: config.provider.name,
      model: config.provider.model,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      inputFiles: context.map((item) => item.file),
      promptFile: "prompt.md",
      errorFile: "error.txt"
    };
    await finishRunRecord({ dir: run.dir, metadata, error: message });
    throw new Error(message);
  }
}
