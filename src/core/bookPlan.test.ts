import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import { BookPlanDraftSchema, createBookPlanDraft, loadBookPlanDraft } from "./bookPlan.js";

describe("createBookPlanDraft", () => {
  it("creates a validated book draft from config and bible context", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-book-"));
    await createFixtureWorkspace(dir);

    const result = await createBookPlanDraft({
      workspaceDir: dir,
      now: new Date("2026-06-09T01:00:00.000Z")
    });

    expect(result.outputPath).toBe(path.join(dir, "outlines", "book.draft.json"));
    expect(result.overwritten).toBe(false);
    expect(result.draft.schemaVersion).toBe("longgu.book-plan-draft.v0.2");
    expect(result.draft.status).toBe("draft");
    expect(result.draft.title).toBe("测试小说");
    expect(result.draft.genre).toBe("玄幻");
    expect(result.draft.sourceFiles).toEqual([
      "longgu.yaml",
      "bible/characters.md",
      "bible/premise.md",
      "bible/style.md",
      "bible/world.md"
    ]);
    expect(result.draft.sourceDigest.find((item) => item.file === "bible/premise.md")?.excerpt).toContain(
      "少年负债入宗门"
    );

    const saved = await loadBookPlanDraft(result.outputPath);
    expect(BookPlanDraftSchema.parse(saved).generatedAt).toBe("2026-06-09T01:00:00.000Z");
  });

  it("refuses to overwrite an existing draft without force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-book-"));
    await createFixtureWorkspace(dir);
    const draftPath = path.join(dir, "outlines", "book.draft.json");
    await writeFile(draftPath, "{\"kept\":true}\n", "utf8");

    await expect(createBookPlanDraft({ workspaceDir: dir })).rejects.toThrow("already exists");
    await expect(readFile(draftPath, "utf8")).resolves.toBe("{\"kept\":true}\n");
  });

  it("replaces an existing draft with force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-book-"));
    await createFixtureWorkspace(dir);
    const draftPath = path.join(dir, "outlines", "book.draft.json");
    await writeFile(draftPath, "{\"old\":true}\n", "utf8");

    const result = await createBookPlanDraft({
      workspaceDir: dir,
      force: true,
      now: new Date("2026-06-09T02:00:00.000Z")
    });

    expect(result.overwritten).toBe(true);
    await expect(readFile(draftPath, "utf8")).resolves.toContain("\"schemaVersion\"");
    const saved = await loadBookPlanDraft(draftPath);
    expect(saved.generatedAt).toBe("2026-06-09T02:00:00.000Z");
  });
});
