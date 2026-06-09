import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace, createRoutingFixtureWorkspace } from "../test/testUtils.js";
import { latestRun } from "./runs.js";
import { writeChapter } from "./generation.js";

describe("writeChapter", () => {
  it("writes a chapter and successful run record with a fake provider", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-"));
    await createFixtureWorkspace(dir);

    const result = await writeChapter({
      workspaceDir: dir,
      chapterId: "001",
      apiKey: "secret",
      generate: async ({ prompt }) => ({ text: `# 第一章\n\n${prompt.includes("陆沉") ? "陆沉入局。" : "正文"}` })
    });

    await expect(readFile(path.join(dir, "chapters", "001.md"), "utf8")).resolves.toContain("陆沉入局");
    expect(result.runDir).toContain("runs");
    const run = await latestRun(dir);
    expect(run?.metadata.status).toBe("success");
    expect(run?.metadata.outputFile).toBe("output.md");
    expect(run?.metadata.task).toBe("drafting");
    expect(run?.metadata.modelProfile).toBe("default");
    expect(run?.metadata.inputTokens).toBeGreaterThan(0);
    expect(run?.metadata.outputTokens).toBeGreaterThan(0);
    expect(run?.metadata.estimatedCost).toBe(0);
  });

  it("falls back to the configured drafting fallback model", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-fallback-"));
    await createRoutingFixtureWorkspace(dir);
    const models: string[] = [];

    await writeChapter({
      workspaceDir: dir,
      chapterId: "001",
      readApiKey: (envName) => `${envName}-secret`,
      generate: async ({ config }) => {
        models.push(config.provider.model);
        if (config.provider.model === "fast-model") {
          throw new Error("fast failed");
        }
        return { text: "# 第一章\n\n强模型接管。" };
      }
    });

    expect(models).toEqual(["fast-model", "strong-model"]);
    const run = await latestRun(dir);
    expect(run?.metadata.status).toBe("success");
    expect(run?.metadata.modelProfile).toBe("strong");
    expect(run?.metadata.fallbackAttempts).toBe(1);
    expect(run?.metadata.attempts?.map((attempt) => attempt.status)).toEqual(["failed", "success"]);
    expect(run?.metadata.estimatedCost).toBeGreaterThan(0);
  });

  it("uses important drafting route when requested", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-important-"));
    await createRoutingFixtureWorkspace(dir);

    await writeChapter({
      workspaceDir: dir,
      chapterId: "001",
      important: true,
      readApiKey: (envName) => `${envName}-secret`,
      generate: async ({ config }) => ({ text: `# 第一章\n\n${config.provider.model}` })
    });

    const run = await latestRun(dir);
    expect(run?.metadata.modelProfile).toBe("strong");
    await expect(readFile(path.join(dir, "chapters", "001.md"), "utf8")).resolves.toContain("strong-model");
  });

  it("persists a failed run record when fake provider fails", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-"));
    await createFixtureWorkspace(dir);

    await expect(
      writeChapter({
        workspaceDir: dir,
        chapterId: "001",
        apiKey: "secret",
        generate: async () => {
          throw new Error("fake provider failed");
        }
      })
    ).rejects.toThrow("fake provider failed");

    const run = await latestRun(dir);
    expect(run?.metadata.status).toBe("failed");
    expect(run?.metadata.errorFile).toBe("error.txt");
    await expect(readFile(path.join(run?.dir ?? "", "error.txt"), "utf8")).resolves.toContain("fake provider failed");
  });
});
