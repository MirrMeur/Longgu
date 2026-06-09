import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createFixtureWorkspace,
  createHostOnlyFixtureWorkspace,
  createPlanningStateFixture,
  createRoutingFixtureWorkspace
} from "../test/testUtils.js";
import { latestRun } from "./runs.js";
import { exportHostChapterPrompt, importHostChapterDraft, writeChapter } from "./generation.js";

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

  it("renders drafting prompt from the context pack", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-context-pack-"));
    await createPlanningStateFixture(dir);
    await writeFile(path.join(dir, "chapters", "000.md"), "# 序章\n\n陆沉欠下三枚灵石。", "utf8");
    let capturedPrompt = "";

    await writeChapter({
      workspaceDir: dir,
      chapterId: "001",
      apiKey: "secret",
      generate: async ({ prompt }) => {
        capturedPrompt = prompt;
        return { text: "# 模型标题\n\n陆沉入局。" };
      }
    });

    expect(capturedPrompt).toContain("outlines/chapters-001.draft.json");
    expect(capturedPrompt).toContain("陆沉拿到入门测试资格");
    expect(capturedPrompt).toContain("chapters/000.md");
    expect(capturedPrompt).toContain("陆沉欠下三枚灵石");
    await expect(readFile(path.join(dir, "context", "001.context.json"), "utf8")).resolves.toContain("previous-chapter-000");
    const run = await latestRun(dir);
    expect(run?.metadata.inputFiles).toEqual(
      expect.arrayContaining(["outlines/chapters-001.draft.json", "chapters/000.md"])
    );
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

  it("replaces provider heading with the planned chapter title", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-title-"));
    await createPlanningStateFixture(dir);

    await writeChapter({
      workspaceDir: dir,
      chapterId: "001",
      apiKey: "secret",
      generate: async () => ({ text: "# 模型生成的标题\n\n陆沉入门测试。" })
    });

    const chapter = await readFile(path.join(dir, "chapters", "001.md"), "utf8");
    expect(chapter).toBe("# 第001章 第一章 入门\n\n陆沉入门测试。");
  });

  it("uses the full compound chapter id in the planned heading", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-compound-title-"));
    await createFixtureWorkspace(dir);
    await writeFile(
      path.join(dir, "outlines", "chapters-001.draft.json"),
      `${JSON.stringify(
        {
          schemaVersion: "longgu.chapters-plan-draft.v0.2",
          status: "draft",
          volumeId: "001",
          title: "第一卷 章节规划",
          genre: "玄幻",
          volumePlanSource: "outlines/volume-001.draft.json",
          chapterCount: 1,
          chapters: [
            {
              chapterId: "001-002",
              title: "第二章 黑纹",
              goal: "",
              conflict: "",
              payoff: "",
              informationGain: "",
              endingHook: ""
            }
          ],
          sourceFiles: ["outlines/volume-001.draft.json"],
          sourceDigest: [{ file: "outlines/volume-001.draft.json", excerpt: "" }],
          generatedAt: "2026-06-09T12:00:00.000Z"
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    await writeChapter({
      workspaceDir: dir,
      chapterId: "001-002",
      apiKey: "secret",
      generate: async () => ({ text: "# 第001章 错误标题\n\n第二章正文。" })
    });

    const chapter = await readFile(path.join(dir, "chapters", "001-002.md"), "utf8");
    expect(chapter).toBe("# 第001-002章 第二章 黑纹\n\n第二章正文。");
  });

  it("keeps provider output unchanged when no matching chapter card exists", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-write-no-plan-title-"));
    await createFixtureWorkspace(dir);

    await writeChapter({
      workspaceDir: dir,
      chapterId: "999",
      apiKey: "secret",
      generate: async () => ({ text: "# 模型标题\n\n未规划章节。" })
    });

    await expect(readFile(path.join(dir, "chapters", "999.md"), "utf8")).resolves.toBe("# 模型标题\n\n未规划章节。");
  });

  it("exports a host LLM chapter prompt without provider config", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-host-prompt-"));
    await createHostOnlyFixtureWorkspace(dir);

    const result = await exportHostChapterPrompt({ workspaceDir: dir, chapterId: "001" });

    expect(result.promptPath).toContain(path.join("host-prompts", "001.prompt.md"));
    await expect(readFile(result.promptPath, "utf8")).resolves.toContain("请开始写第 001 章");
    await expect(readFile(result.contextJsonPath, "utf8")).resolves.toContain("\"schemaVersion\": \"longgu.context-pack.v0.7\"");
  });

  it("imports a host LLM draft and records zero-cost host metadata", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-host-import-"));
    await createPlanningStateFixture(dir);
    await writeFile(
      path.join(dir, "longgu.yaml"),
      `title: 测试小说
genre: 玄幻
language: zh-CN
context:
  maxTokens: 16000
`,
      "utf8"
    );
    await mkdir(path.join(dir, "drafts"), { recursive: true });
    await writeFile(path.join(dir, "drafts", "001.md"), "# 宿主标题\n\n陆沉从宿主模型正文入局。", "utf8");

    const result = await importHostChapterDraft({
      workspaceDir: dir,
      chapterId: "001",
      inputPath: "drafts/001.md"
    });

    await expect(readFile(result.chapterPath, "utf8")).resolves.toBe("# 第001章 第一章 入门\n\n陆沉从宿主模型正文入局。");
    const run = await latestRun(dir);
    expect(run?.metadata.provider).toBe("host-llm");
    expect(run?.metadata.modelProfile).toBe("host");
    expect(run?.metadata.estimatedCost).toBe(0);
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
