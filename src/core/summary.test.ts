import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import { latestRun } from "./runs.js";
import { summarizeChapter } from "./summary.js";

const testConfig = {
  title: "测试小说",
  genre: "玄幻",
  language: "zh-CN",
  provider: {
    name: "openai-compatible",
    baseUrl: "https://api.example.com/v1",
    model: "test-model",
    apiKeyEnv: "TEST_API_KEY",
    temperature: 0.7,
    maxTokens: 1200
  }
};

describe("chapter summary", () => {
  it("generates a summary artifact and model run evidence", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-summary-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章 入门\n\n陆沉得到灵石，黑纹在测试石上裂开。", "utf8");

    const result = await summarizeChapter({
      workspaceDir: dir,
      chapterId: "001",
      config: testConfig,
      apiKey: "secret",
      generate: async ({ prompt }) => {
        expect(prompt).toContain("章节摘要器");
        expect(prompt).toContain("chapters/001.md");
        return {
          text: JSON.stringify({
            schemaVersion: "longgu.chapter-summary.v0.7",
            chapterId: "001",
            title: "第一章 入门",
            summary: "陆沉得到灵石，测试石裂出黑纹。黑纹成为后续禁地线索。",
            generatedAt: "2026-06-09T13:00:00.000Z"
          })
        };
      },
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    expect(result.summary.summary).toContain("禁地线索");
    await expect(readFile(path.join(dir, "summaries", "001.summary.json"), "utf8")).resolves.toContain(
      "longgu.chapter-summary.v0.7"
    );
    const run = await latestRun(dir);
    expect(run?.metadata.task).toBe("summarize");
    expect(run?.metadata.inputFiles).toEqual(["chapters/001.md"]);
  });
});
