import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import { auditChapter, ChapterAuditSchema, normalizeCheckerPriority } from "./audit.js";

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

describe("chapter audit", () => {
  it("maps checker priorities to Longgu severity", () => {
    expect(normalizeCheckerPriority("P0")).toBe("critical");
    expect(normalizeCheckerPriority("P1")).toBe("warning");
    expect(normalizeCheckerPriority("P2")).toBe("info");
  });

  it("normalizes provided raw audit input and writes JSON and Markdown artifacts", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-input-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉站在宗门门口。\n", "utf8");
    await mkdir(path.join(dir, "audits"), { recursive: true });
    const inputPath = path.join(dir, "audits", "001.raw-audit.json");
    await writeFile(
      inputPath,
      `${JSON.stringify(
        {
          schemaVersion: "longgu.chapter-audit.v0.4",
          chapterId: "001",
          genre: "玄幻",
          summary: "章节目标偏弱，但没有阻断问题。",
          scores: {
            retention: 6,
            readability: 7,
            aiFlavor: 4,
            scenePressure: 5,
            characterVoice: 6
          },
          issues: [
            {
              id: "issue-001",
              checkerPriority: "P1",
              source: "chapter-plan",
              dimension: "chapter-goal-drift",
              location: "全章",
              reason: "章节目标没有形成明确推进。",
              fix: "补一个具体选择或外部压力。"
            }
          ]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await auditChapter({
      workspaceDir: dir,
      chapterId: "001",
      inputPath,
      config: testConfig,
      now: new Date("2026-06-09T12:00:00.000Z")
    });

    expect(result.audit.status).toBe("needs-revision");
    expect(result.audit.blocked).toBe(false);
    expect(result.audit.reviseQueue).toEqual(["issue-001"]);
    expect(result.audit.issues[0]?.severity).toBe("warning");
    expect(ChapterAuditSchema.parse(JSON.parse(await readFile(result.jsonPath, "utf8")) as unknown).schemaVersion).toBe(
      "longgu.chapter-audit.v0.4"
    );
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("Chapter Audit 001");
  });

  it("marks critical issues as blocked", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-blocked-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n正文。\n", "utf8");

    const result = await auditChapter({
      workspaceDir: dir,
      chapterId: "001",
      config: testConfig,
      apiKey: "secret",
      generate: async () => ({
        text: JSON.stringify({
          schemaVersion: "longgu.chapter-audit.v0.4",
          chapterId: "001",
          genre: "玄幻",
          summary: "存在时间线冲突。",
          scores: {
            retention: 5,
            readability: 6,
            aiFlavor: 5,
            scenePressure: 4,
            characterVoice: 5
          },
          issues: [
            {
              id: "issue-critical",
              checkerPriority: "P0",
              source: "state",
              dimension: "timeline-conflict",
              location: "中段",
              reason: "角色位置与状态账本冲突。",
              fix: "调整地点或先沉淀状态变化。"
            }
          ]
        })
      }),
      now: new Date("2026-06-09T12:00:00.000Z")
    });

    expect(result.audit.status).toBe("blocked");
    expect(result.audit.blocked).toBe(true);
    expect(result.audit.reviseQueue).toEqual([]);
  });

  it("retries provider audit extraction once after invalid output", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-retry-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n正文。\n", "utf8");
    let calls = 0;

    const result = await auditChapter({
      workspaceDir: dir,
      chapterId: "001",
      config: testConfig,
      apiKey: "secret",
      generate: async ({ prompt }) => {
        calls += 1;
        if (calls === 1) {
          return { text: "not json" };
        }
        expect(prompt).toContain("上一次审计输出被拒绝");
        return {
          text: JSON.stringify({
            schemaVersion: "longgu.chapter-audit.v0.4",
            chapterId: "001",
            genre: "玄幻",
            summary: "没有明显问题。",
            scores: {
              retention: 8,
              readability: 8,
              aiFlavor: 2,
              scenePressure: 7,
              characterVoice: 7
            },
            issues: []
          })
        };
      },
      now: new Date("2026-06-09T12:00:00.000Z")
    });

    expect(calls).toBe(2);
    expect(result.audit.status).toBe("passed");
    await expect(readFile(result.attemptsPath ?? "", "utf8")).resolves.toContain("\"accepted\": false");
  });

  it("does not write final artifacts when provider retry is exhausted", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-retry-fail-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n正文。\n", "utf8");

    await expect(
      auditChapter({
        workspaceDir: dir,
        chapterId: "001",
        config: testConfig,
        apiKey: "secret",
        generate: async () => ({ text: "not json" }),
        now: new Date("2026-06-09T12:00:00.000Z")
      })
    ).rejects.toThrow("Chapter audit extraction failed after retry");

    await expect(stat(path.join(dir, "audits", "001.audit.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
