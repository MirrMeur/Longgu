import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import {
  BookPlanDraftSchema,
  VolumePlanDraftSchema,
  createBookPlanDraft,
  createVolumePlanDraft,
  loadBookPlanDraft,
  loadVolumePlanDraft
} from "./bookPlan.js";

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

describe("createVolumePlanDraft", () => {
  it("creates a validated volume draft from the book draft", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-volume-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({
      workspaceDir: dir,
      now: new Date("2026-06-09T01:00:00.000Z")
    });

    const result = await createVolumePlanDraft({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T03:00:00.000Z")
    });

    expect(result.outputPath).toBe(path.join(dir, "outlines", "volume-001.draft.json"));
    expect(result.overwritten).toBe(false);
    expect(result.draft.schemaVersion).toBe("longgu.volume-plan-draft.v0.2");
    expect(result.draft.status).toBe("draft");
    expect(result.draft.volumeId).toBe("001");
    expect(result.draft.title).toBe("测试小说 第001卷");
    expect(result.draft.genre).toBe("玄幻");
    expect(result.draft.bookPlanSource).toBe("outlines/book.draft.json");
    expect(result.draft.sourceFiles).toContain("outlines/book.draft.json");
    expect(result.draft.sourceFiles).toContain("longgu.yaml");
    expect(result.draft.conflictEscalation).toHaveLength(3);
    expect(result.draft.chapterSeedCount).toBe(12);

    const saved = await loadVolumePlanDraft(result.outputPath);
    expect(VolumePlanDraftSchema.parse(saved).generatedAt).toBe("2026-06-09T03:00:00.000Z");
  });

  it("requires a book draft before volume planning", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-volume-"));
    await createFixtureWorkspace(dir);

    await expect(createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" })).rejects.toThrow(
      "Run longgu plan book"
    );
  });

  it("refuses to overwrite an existing volume draft without force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-volume-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    const draftPath = path.join(dir, "outlines", "volume-001.draft.json");
    await writeFile(draftPath, "{\"kept\":true}\n", "utf8");

    await expect(createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" })).rejects.toThrow("already exists");
    await expect(readFile(draftPath, "utf8")).resolves.toBe("{\"kept\":true}\n");
  });

  it("replaces an existing volume draft with force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-volume-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    const draftPath = path.join(dir, "outlines", "volume-001.draft.json");
    await writeFile(draftPath, "{\"old\":true}\n", "utf8");

    const result = await createVolumePlanDraft({
      workspaceDir: dir,
      volumeId: "001",
      force: true,
      now: new Date("2026-06-09T04:00:00.000Z")
    });

    expect(result.overwritten).toBe(true);
    await expect(readFile(draftPath, "utf8")).resolves.toContain("\"schemaVersion\"");
    const saved = await loadVolumePlanDraft(draftPath);
    expect(saved.generatedAt).toBe("2026-06-09T04:00:00.000Z");
  });

  it("rejects unsafe volume ids", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-volume-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });

    await expect(createVolumePlanDraft({ workspaceDir: dir, volumeId: "../001" })).rejects.toThrow(
      "Plan id must contain"
    );
  });
});
