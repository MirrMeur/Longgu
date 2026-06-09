import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRunRecord, finishRunRecord, latestRun } from "./runs.js";

describe("runs", () => {
  it("persists and reads the latest run metadata", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-runs-"));
    const startedAt = new Date("2026-06-09T00:00:00.000Z");
    const run = await createRunRecord({
      workspaceDir: dir,
      chapterId: "001",
      provider: "openai-compatible",
      model: "test-model",
      startedAt,
      prompt: "write",
      context: [{ file: "bible/premise.md", content: "premise" }]
    });

    await finishRunRecord({
      dir: run.dir,
      output: "chapter",
      metadata: {
        id: run.id,
        status: "success",
        chapterId: "001",
        provider: "openai-compatible",
        model: "test-model",
        startedAt: startedAt.toISOString(),
        finishedAt: startedAt.toISOString(),
        inputFiles: ["bible/premise.md"],
        promptFile: "prompt.md",
        outputFile: "output.md"
      }
    });

    const latest = await latestRun(dir);

    expect(latest?.metadata.status).toBe("success");
    expect(latest?.metadata.chapterId).toBe("001");
  });
});
