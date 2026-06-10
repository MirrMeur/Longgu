import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createPlanningStateFixture } from "../test/testUtils.js";
import { applyTokenBudget, buildChapterContext, ContextPackSchema, type ContextSection } from "./context.js";

describe("chapter context builder", () => {
  it("builds reviewable JSON and Markdown context artifacts", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-"));
    await createPlanningStateFixture(dir);

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "001",
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    expect(result.pack.schemaVersion).toBe("longgu.context-pack.v0.7");
    expect(result.pack.chapterId).toBe("001");
    expect(result.pack.tokenBudget).toBe(16000);
    expect(result.pack.includedSectionCount).toBeGreaterThan(0);
    expect(result.pack.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining([
        "chapter-card",
        "volume-plan",
        "genre-card",
        "style-constraints",
        "bible-premise",
        "bible-characters",
        "bible-world",
        "state-truth-summary",
        "state-truth",
        "summary-000"
      ])
    );
    expect(result.pack.sections.find((section) => section.id === "chapter-card")).toMatchObject({
      priority: "critical",
      included: true
    });
    expect(result.pack.sections.find((section) => section.id === "state-truth-summary")).toMatchObject({
      priority: "critical",
      included: true
    });
    expect(result.pack.sections.find((section) => section.id === "state-truth")).toMatchObject({
      priority: "high",
      included: true
    });

    const writtenJson = ContextPackSchema.parse(JSON.parse(await readFile(result.jsonPath, "utf8")) as unknown);
    expect(writtenJson.schemaVersion).toBe("longgu.context-pack.v0.7");
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("## chapter-card");
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("Source: outlines/chapters-001.draft.json");
  });

  it("trims lower-priority sections before critical sections", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-budget-"));
    await createPlanningStateFixture(dir);

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "001",
      maxTokens: 10,
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    const chapterCard = result.pack.sections.find((section) => section.id === "chapter-card");
    const stateTruthSummary = result.pack.sections.find((section) => section.id === "state-truth-summary");
    const stateTruth = result.pack.sections.find((section) => section.id === "state-truth");
    const summary = result.pack.sections.find((section) => section.id === "summary-000");

    expect(chapterCard?.included).toBe(true);
    expect(stateTruthSummary).toMatchObject({ priority: "critical", included: true });
    expect(stateTruth?.priority).toBe("high");
    expect(stateTruth?.included).toBe(false);
    expect(summary?.included).toBe(false);
    expect(result.pack.estimatedTokens).toBeGreaterThan(result.pack.tokenBudget);
  });

  it("trims lower retention sections before larger recent chapter context at the same priority", () => {
    const sections: ContextSection[] = [
      {
        id: "chapter-card",
        source: "outlines/chapters-001.draft.json",
        reason: "current chapter",
        priority: "critical",
        estimatedTokens: 5,
        included: true,
        content: "critical"
      },
      {
        id: "previous-chapter-001-009",
        source: "chapters/001-009.md",
        reason: "recent previous chapter",
        priority: "low",
        estimatedTokens: 40,
        included: true,
        content: "recent chapter body"
      },
      {
        id: "summary-000",
        source: "summaries/000.summary.json",
        reason: "old summary",
        priority: "low",
        estimatedTokens: 4,
        included: true,
        content: "old summary"
      }
    ];

    const result = applyTokenBudget(sections, 45);

    expect(result.find((section) => section.id === "previous-chapter-001-009")?.included).toBe(true);
    expect(result.find((section) => section.id === "summary-000")?.included).toBe(false);
  });

  it("uses configured context budget when no CLI override is provided", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-config-budget-"));
    await createPlanningStateFixture(dir);
    const configPath = path.join(dir, "longgu.yaml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace("maxTokens: 16000", "maxTokens: 24000"), "utf8");

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "001",
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    expect(result.pack.tokenBudget).toBe(24000);
  });

  it("uses explicit max token override before config defaults", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-override-budget-"));
    await createPlanningStateFixture(dir);
    const configPath = path.join(dir, "longgu.yaml");
    const config = await readFile(configPath, "utf8");
    await writeFile(configPath, config.replace("maxTokens: 16000", "maxTokens: 24000"), "utf8");

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "001",
      maxTokens: 200,
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    expect(result.pack.tokenBudget).toBe(200);
  });

  it("includes previous chapter bodies but excludes the target chapter body", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-previous-chapter-"));
    await createPlanningStateFixture(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第001章 第一章 入门\n\n陆沉拿到测试资格。", "utf8");
    await writeFile(path.join(dir, "chapters", "002.md"), "# 第002章 第二章 黑纹\n\n这章旧稿不应进入自己的上下文。", "utf8");

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "002",
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    const previous = result.pack.sections.find((section) => section.id === "previous-chapter-001");
    expect(previous).toMatchObject({
      source: "chapters/001.md",
      priority: "low",
      included: true
    });
    expect(previous?.content).toContain("陆沉拿到测试资格");
    expect(result.pack.sections.find((section) => section.id === "previous-chapter-002")).toBeUndefined();
  });

  it("uses natural chapter ordering for cross-volume previous chapter bodies", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-natural-chapter-order-"));
    await createPlanningStateFixture(dir);
    await writeFile(path.join(dir, "chapters", "v9-005.md"), "# 第九卷 第五章\n\n上一卷尾声。", "utf8");
    await writeFile(path.join(dir, "chapters", "v10-001.md"), "# 第十卷 第一章\n\n目标章旧稿不应进入自己的上下文。", "utf8");

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "v10-001",
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    const previous = result.pack.sections.find((section) => section.id === "previous-chapter-v9-005");
    expect(previous).toMatchObject({
      source: "chapters/v9-005.md",
      priority: "low",
      included: true
    });
    expect(previous?.content).toContain("上一卷尾声");
    expect(result.pack.sections.find((section) => section.id === "previous-chapter-v10-001")).toBeUndefined();
  });

  it("includes human feedback in context packs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-feedback-"));
    await createPlanningStateFixture(dir);
    await mkdir(path.join(dir, "feedback"), { recursive: true });
    await writeFile(
      path.join(dir, "feedback", "001.feedback.json"),
      `${JSON.stringify(
        {
          schemaVersion: "longgu.chapter-feedback.v0.10",
          chapterId: "001",
          entries: [{ score: 6, comment: "情节推进太慢", createdAt: "2026-06-09T10:00:00.000Z" }],
          updatedAt: "2026-06-09T10:00:00.000Z"
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "002",
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    const feedback = result.pack.sections.find((section) => section.id === "feedback-001");
    expect(feedback).toMatchObject({ source: "feedback/001.feedback.json", priority: "medium", included: true });
    expect(feedback?.content).toContain("情节推进太慢");
  });

  it("writes a human-readable brief with market and payoff recipe context", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-context-brief-"));
    await createPlanningStateFixture(dir);
    await writeFile(
      path.join(dir, "longgu.yaml"),
      `title: 测试小说
genre: 玄幻
language: zh-CN
context:
  maxTokens: 16000
market:
  platform: fanqie
  targetAudience: male-25-35
  updateCadence: daily
`,
      "utf8"
    );
    await writeFile(path.join(dir, "bible", "payoff-recipes.md"), "# 爽点配方\n\n每章至少一个反差打脸。\n", "utf8");

    const result = await buildChapterContext({
      workspaceDir: dir,
      chapterId: "001",
      humanReadable: true,
      now: new Date("2026-06-09T13:00:00.000Z")
    });

    expect(result.briefPath).toBe(path.join(dir, "context", "001.brief.md"));
    const brief = await readFile(result.briefPath!, "utf8");
    expect(brief).toContain("## 本章目标");
    expect(brief).toContain("反差打脸");
    expect(brief).toContain("platform: fanqie");
    expect(brief).not.toContain("Token budget");
  });
});
