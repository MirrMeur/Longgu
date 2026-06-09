import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import {
  BookPlanDraftSchema,
  ChapterPlanAuditSchema,
  ChaptersPlanDraftSchema,
  VolumePlanDraftSchema,
  auditChapterPlan,
  createBookPlanDraft,
  createChaptersPlanDraft,
  createVolumePlanDraft,
  loadBookPlanDraft,
  loadChaptersPlanDraft,
  loadVolumePlanDraft
} from "./bookPlan.js";
import { latestRun } from "./runs.js";

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

  it("creates a model-backed book draft and records a planning run", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-book-model-"));
    await createFixtureWorkspace(dir);

    const result = await createBookPlanDraft({
      workspaceDir: dir,
      model: true,
      apiKey: "secret",
      generate: async ({ prompt }) => {
        expect(prompt).toContain("longgu.book-plan-draft.v0.2");
        return {
          text: JSON.stringify({
            schemaVersion: "longgu.book-plan-draft.v0.2",
            status: "draft",
            title: "测试小说",
            genre: "玄幻",
            language: "zh-CN",
            premise: {
              logline: "负债少年靠异常灵根翻身。",
              mainConflict: "陆沉与扣资源的宗门执事对抗。",
              sellingPoint: "每章都有资源逆转。"
            },
            protagonist: {
              name: "陆沉",
              desire: "还债并查清灵根异常",
              flaw: "不信任宗门",
              cheat: "异常灵根"
            },
            coreHook: "测试石裂黑纹",
            conflictLadder: [{ stage: "opening", pressure: "欠债入门", payoff: "测试逆转" }],
            powerSystem: { rules: "灵石驱动修炼", keyResources: "灵石", progression: "外门到内门" },
            readerPromises: ["查清黑纹", "夺回资源"],
            retentionRisks: [{ risk: "解释过多", mitigation: "用场景冲突交代规则" }],
            sourceFiles: ["longgu.yaml", "bible/premise.md"],
            sourceDigest: [{ file: "bible/premise.md", excerpt: "少年负债入宗门。" }],
            generatedAt: "2026-06-09T12:00:00.000Z"
          })
        };
      },
      now: new Date("2026-06-09T12:00:00.000Z")
    });

    expect(result.draft.coreHook).toBe("测试石裂黑纹");
    expect(result.runDir).toContain("runs");
    const run = await latestRun(dir);
    expect(run?.metadata.task).toBe("planning");
    expect(run?.metadata.modelProfile).toBe("default");
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

describe("createChaptersPlanDraft", () => {
  it("creates validated chapter cards from the volume draft", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-chapters-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({
      workspaceDir: dir,
      now: new Date("2026-06-09T01:00:00.000Z")
    });
    await createVolumePlanDraft({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T03:00:00.000Z")
    });

    const result = await createChaptersPlanDraft({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T05:00:00.000Z")
    });

    expect(result.outputPath).toBe(path.join(dir, "outlines", "chapters-001.draft.json"));
    expect(result.overwritten).toBe(false);
    expect(result.draft.schemaVersion).toBe("longgu.chapters-plan-draft.v0.2");
    expect(result.draft.status).toBe("draft");
    expect(result.draft.volumeId).toBe("001");
    expect(result.draft.genre).toBe("玄幻");
    expect(result.draft.volumePlanSource).toBe("outlines/volume-001.draft.json");
    expect(result.draft.chapterCount).toBe(12);
    expect(result.draft.chapters).toHaveLength(12);
    expect(result.draft.chapters[0]).toMatchObject({
      chapterId: "001-001",
      title: expect.stringContaining("第001章"),
      goal: expect.stringContaining("测试小说 第001卷"),
      conflict: expect.any(String),
      payoff: expect.any(String),
      informationGain: expect.any(String),
      endingHook: expect.any(String)
    });
    for (const chapter of result.draft.chapters) {
      expect(chapter.title).not.toBe("");
      expect(chapter.goal).not.toBe("");
      expect(chapter.conflict).not.toBe("");
      expect(chapter.payoff).not.toBe("");
      expect(chapter.informationGain).not.toBe("");
      expect(chapter.endingHook).not.toBe("");
    }
    expect(result.draft.sourceFiles).toContain("outlines/volume-001.draft.json");

    const saved = await loadChaptersPlanDraft(result.outputPath);
    expect(ChaptersPlanDraftSchema.parse(saved).generatedAt).toBe("2026-06-09T05:00:00.000Z");
  });

  it("requires a volume draft before chapter planning", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-chapters-"));
    await createFixtureWorkspace(dir);

    await expect(createChaptersPlanDraft({ workspaceDir: dir, volumeId: "001" })).rejects.toThrow(
      "Run longgu plan volume --id 001"
    );
  });

  it("refuses to overwrite an existing chapters draft without force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-chapters-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    await createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" });
    const draftPath = path.join(dir, "outlines", "chapters-001.draft.json");
    await writeFile(draftPath, "{\"kept\":true}\n", "utf8");

    await expect(createChaptersPlanDraft({ workspaceDir: dir, volumeId: "001" })).rejects.toThrow("already exists");
    await expect(readFile(draftPath, "utf8")).resolves.toBe("{\"kept\":true}\n");
  });

  it("replaces an existing chapters draft with force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-chapters-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    await createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" });
    const draftPath = path.join(dir, "outlines", "chapters-001.draft.json");
    await writeFile(draftPath, "{\"old\":true}\n", "utf8");

    const result = await createChaptersPlanDraft({
      workspaceDir: dir,
      volumeId: "001",
      force: true,
      now: new Date("2026-06-09T06:00:00.000Z")
    });

    expect(result.overwritten).toBe(true);
    await expect(readFile(draftPath, "utf8")).resolves.toContain("\"schemaVersion\"");
    const saved = await loadChaptersPlanDraft(draftPath);
    expect(saved.generatedAt).toBe("2026-06-09T06:00:00.000Z");
  });

  it("rejects unsafe volume ids", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-plan-chapters-"));
    await createFixtureWorkspace(dir);

    await expect(createChaptersPlanDraft({ workspaceDir: dir, volumeId: "../001" })).rejects.toThrow(
      "Plan id must contain"
    );
  });
});

describe("auditChapterPlan", () => {
  it("passes a ready chapter plan and writes audit artifacts", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-chapter-plan-pass-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    await createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" });
    const planResult = await createChaptersPlanDraft({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T05:00:00.000Z")
    });
    const readyPlan = {
      ...planResult.draft,
      chapters: planResult.draft.chapters.map((chapter, index) => ({
        ...chapter,
        goal: `陆沉在第 ${index + 1} 个公开测试节点争取一枚可见资源。`,
        conflict: `执事安排第 ${index + 1} 个更苛刻条件，逼陆沉暴露底牌。`,
        payoff: `陆沉完成第 ${index + 1} 次资源翻盘，并让旁观者改变判断。`,
        informationGain: `读者得知黑纹在第 ${index + 1} 次共鸣中会消耗灵石。`,
        endingHook: `第 ${index + 1} 个高阶人物注意到黑纹异常，提出新的公开要求。`
      }))
    };
    await writeFile(planResult.outputPath, `${JSON.stringify(readyPlan, null, 2)}\n`, "utf8");

    const result = await auditChapterPlan({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T06:00:00.000Z")
    });

    expect(result.audit.status).toBe("passed");
    expect(result.audit.blocked).toBe(false);
    expect(result.audit.issues).toEqual([]);
    expect(ChapterPlanAuditSchema.parse(JSON.parse(await readFile(result.jsonPath, "utf8")) as unknown).schemaVersion).toBe(
      "longgu.chapter-plan-audit.v0.2"
    );
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("Chapter Plan Audit 001");
  });

  it("flags weak chapter card fields and repeated adjacent hooks", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-chapter-plan-warn-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    await createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" });
    const planResult = await createChaptersPlanDraft({ workspaceDir: dir, volumeId: "001" });
    const weakPlan = {
      ...planResult.draft,
      chapters: [
        {
          ...planResult.draft.chapters[0],
          goal: "待定",
          conflict: "发生冲突",
          endingHook: "同一个尾钩"
        },
        {
          ...planResult.draft.chapters[1],
          endingHook: "同一个尾钩"
        },
        ...planResult.draft.chapters.slice(2)
      ]
    };
    await writeFile(planResult.outputPath, `${JSON.stringify(weakPlan, null, 2)}\n`, "utf8");

    const result = await auditChapterPlan({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T06:00:00.000Z")
    });

    expect(result.audit.status).toBe("needs-revision");
    expect(result.audit.blocked).toBe(false);
    expect(result.audit.issues.map((issue) => issue.id)).toContain("001-001-goal-weak");
    expect(result.audit.issues.map((issue) => issue.id)).toContain("001-001-conflict-weak");
    expect(result.audit.issues.map((issue) => issue.id)).toContain("001-002-endingHook-repeated");
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("goal is missing");
  });

  it("blocks chapter count mismatches", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-chapter-plan-block-"));
    await createFixtureWorkspace(dir);
    await createBookPlanDraft({ workspaceDir: dir });
    await createVolumePlanDraft({ workspaceDir: dir, volumeId: "001" });
    const planResult = await createChaptersPlanDraft({ workspaceDir: dir, volumeId: "001" });
    await writeFile(
      planResult.outputPath,
      `${JSON.stringify({ ...planResult.draft, chapterCount: planResult.draft.chapterCount + 1 }, null, 2)}\n`,
      "utf8"
    );

    const result = await auditChapterPlan({
      workspaceDir: dir,
      volumeId: "001",
      now: new Date("2026-06-09T06:00:00.000Z")
    });

    expect(result.audit.status).toBe("blocked");
    expect(result.audit.blocked).toBe(true);
    expect(result.audit.issues.find((issue) => issue.id === "chapter-count-mismatch")).toMatchObject({
      id: "chapter-count-mismatch",
      severity: "critical",
      field: "chapterCount"
    });
  });

  it("requires a chapter plan before auditing", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-audit-chapter-plan-missing-"));
    await createFixtureWorkspace(dir);

    await expect(auditChapterPlan({ workspaceDir: dir, volumeId: "001" })).rejects.toThrow(
      "Chapters plan draft is required before audit"
    );
  });
});
