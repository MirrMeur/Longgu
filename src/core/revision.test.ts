import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import { ChapterAuditSchema } from "./audit.js";
import { createLineDiff, reviseChapter, selectDefaultRevisionMode } from "./revision.js";
import { latestRun } from "./runs.js";

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

describe("chapter revision", () => {
  it("selects default modes from audit severity", () => {
    expect(selectDefaultRevisionMode(createAudit({ severity: "warning" }))).toBe("spot-fix");
    expect(selectDefaultRevisionMode(createAudit({ severity: "critical" }))).toBe("rewrite-scene");
  });

  it("creates a readable line diff", () => {
    expect(createLineDiff("A\nB\n", "A\nC\n")).toContain("- B");
    expect(createLineDiff("A\nB\n", "A\nC\n")).toContain("+ C");
  });

  it("revises a chapter and writes revision history", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-revise-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉站在门口。\n", "utf8");
    await writeAudit(dir, createAudit({ severity: "warning" }));

    const result = await reviseChapter({
      workspaceDir: dir,
      chapterId: "001",
      config: testConfig,
      apiKey: "secret",
      generate: async ({ prompt }) => {
        expect(prompt).toContain("spot-fix");
        expect(prompt).toContain("issue-001");
        expect(prompt).toContain("类型卡：玄幻");
        expect(prompt).toContain("境界");
        return { text: "# 第一章\n\n陆沉扣紧袖口，站在宗门门口。\n" };
      },
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    await expect(readFile(path.join(dir, "chapters", "001.md"), "utf8")).resolves.toContain("扣紧袖口");
    await expect(readFile(path.join(result.revisionDir, "before.md"), "utf8")).resolves.toContain("陆沉站在门口");
    await expect(readFile(path.join(result.revisionDir, "after.md"), "utf8")).resolves.toContain("扣紧袖口");
    await expect(readFile(result.diffPath, "utf8")).resolves.toContain("+ 陆沉扣紧袖口");
    await expect(readFile(path.join(result.revisionDir, "metadata.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.chapter-revision.v0.5\""
    );
    const run = await latestRun(dir);
    expect(run?.metadata.task).toBe("revise");
  });

  it("rejects unchanged provider output", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-revise-unchanged-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n正文。\n", "utf8");
    await writeAudit(dir, createAudit({ severity: "warning" }));

    await expect(
      reviseChapter({
        workspaceDir: dir,
        chapterId: "001",
        config: testConfig,
        apiKey: "secret",
        generate: async () => ({ text: "# 第一章\n\n正文。\n" }),
        now: new Date("2026-06-09T13:00:00.000Z")
      })
    ).rejects.toThrow("identical");
  });

  it("fails when post-audit critical count does not decrease without modifying chapter", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-revise-post-audit-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n旧正文。\n", "utf8");
    await writeAudit(dir, createAudit({ severity: "critical" }));
    const postAuditPath = path.join(dir, "audits", "001.post-audit.json");
    await writeFile(postAuditPath, `${JSON.stringify(createAudit({ severity: "critical" }), null, 2)}\n`, "utf8");

    await expect(
      reviseChapter({
        workspaceDir: dir,
        chapterId: "001",
        postAuditPath,
        config: testConfig,
        apiKey: "secret",
        generate: async () => ({ text: "# 第一章\n\n新正文。\n" }),
        now: new Date("2026-06-09T13:00:00.000Z")
      })
    ).rejects.toThrow("critical count did not decrease");

    await expect(readFile(path.join(dir, "chapters", "001.md"), "utf8")).resolves.toContain("旧正文");
    await expect(stat(path.join(dir, "revisions"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

function createAudit(input: { severity: "critical" | "warning" | "info" }) {
  return ChapterAuditSchema.parse({
    schemaVersion: "longgu.chapter-audit.v0.4",
    chapterId: "001",
    genre: "玄幻",
    status: input.severity === "critical" ? "blocked" : input.severity === "warning" ? "needs-revision" : "passed",
    summary: "测试审计。",
    scores: {
      retention: 6,
      readability: 7,
      aiFlavor: 4,
      scenePressure: 5,
      characterVoice: 6
    },
    contract: {
      status: "complete",
      missing: [],
      startHook: "陆沉被外部压力推到宗门门口。",
      protagonistGoal: "他要进入宗门并保住机会。",
      obstacle: "旁人质疑他的资格。",
      turn: "他发现旧问题必须当场解决。",
      payoff: "章节给出可见状态变化。",
      tailHook: "新的考验即将出现。",
      diagnosis: "测试夹具提供完整章节契约。"
    },
    issues: [
      {
        id: "issue-001",
        severity: input.severity,
        source: "prose",
        dimension: "ai-explanatory-tone",
        location: "第二段",
        reason: "解释感过重。",
        fix: "改成可观察动作。"
      }
    ],
    reviseQueue: input.severity === "warning" ? ["issue-001"] : [],
    blocked: input.severity === "critical",
    sourceFiles: ["chapters/001.md"],
    generatedAt: "2026-06-09T12:00:00.000Z"
  });
}

async function writeAudit(dir: string, audit: unknown): Promise<void> {
  await mkdir(path.join(dir, "audits"), { recursive: true });
  await writeFile(path.join(dir, "audits", "001.audit.json"), `${JSON.stringify(audit, null, 2)}\n`, "utf8");
}
