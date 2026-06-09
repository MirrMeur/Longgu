import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
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
