import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createPlanningStateFixture } from "../test/testUtils.js";
import { buildChapterContext, ContextPackSchema } from "./context.js";

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
    expect(result.pack.includedSectionCount).toBeGreaterThan(0);
    expect(result.pack.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["chapter-card", "volume-plan", "genre-card", "style-constraints", "state-truth", "summary-000"])
    );
    expect(result.pack.sections.find((section) => section.id === "chapter-card")).toMatchObject({
      priority: "critical",
      included: true
    });
    expect(result.pack.sections.find((section) => section.id === "state-truth")).toMatchObject({
      priority: "critical",
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
    const stateTruth = result.pack.sections.find((section) => section.id === "state-truth");
    const summary = result.pack.sections.find((section) => section.id === "summary-000");

    expect(chapterCard?.included).toBe(true);
    expect(stateTruth?.included).toBe(true);
    expect(summary?.included).toBe(false);
    expect(result.pack.estimatedTokens).toBeGreaterThan(result.pack.tokenBudget);
  });
});
