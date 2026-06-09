import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { loadLongguConfig } from "./config.js";
import { pathExists, loadBibleContext } from "./workspace.js";

export const BookPlanDraftSchema = z.object({
  schemaVersion: z.literal("longgu.book-plan-draft.v0.2"),
  status: z.literal("draft"),
  title: z.string().min(1),
  genre: z.string().min(1),
  language: z.string().min(1),
  premise: z.object({
    logline: z.string(),
    mainConflict: z.string(),
    sellingPoint: z.string()
  }),
  protagonist: z.object({
    name: z.string(),
    desire: z.string(),
    flaw: z.string(),
    cheat: z.string()
  }),
  coreHook: z.string(),
  conflictLadder: z.array(
    z.object({
      stage: z.string(),
      pressure: z.string(),
      payoff: z.string()
    })
  ),
  powerSystem: z.object({
    rules: z.string(),
    keyResources: z.string(),
    progression: z.string()
  }),
  readerPromises: z.array(z.string()),
  retentionRisks: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string()
    })
  ),
  sourceFiles: z.array(z.string().min(1)).min(1),
  sourceDigest: z.array(
    z.object({
      file: z.string().min(1),
      excerpt: z.string()
    })
  ),
  generatedAt: z.string().datetime()
});

export type BookPlanDraft = z.infer<typeof BookPlanDraftSchema>;

export const VolumePlanDraftSchema = z.object({
  schemaVersion: z.literal("longgu.volume-plan-draft.v0.2"),
  status: z.literal("draft"),
  volumeId: z.string().min(1),
  title: z.string().min(1),
  genre: z.string().min(1),
  bookPlanSource: z.literal("outlines/book.draft.json"),
  volumeGoal: z.string(),
  primaryAntagonist: z.string(),
  conflictEscalation: z.array(
    z.object({
      step: z.string(),
      pressure: z.string(),
      expectedPayoff: z.string()
    })
  ),
  resourceChanges: z.array(
    z.object({
      resource: z.string(),
      from: z.string(),
      to: z.string()
    })
  ),
  keyPayoffs: z.array(z.string()),
  endingHook: z.string(),
  chapterSeedCount: z.number().int().positive(),
  sourceFiles: z.array(z.string().min(1)).min(1),
  sourceDigest: z.array(
    z.object({
      file: z.string().min(1),
      excerpt: z.string()
    })
  ),
  generatedAt: z.string().datetime()
});

export type VolumePlanDraft = z.infer<typeof VolumePlanDraftSchema>;

export const ChaptersPlanDraftSchema = z.object({
  schemaVersion: z.literal("longgu.chapters-plan-draft.v0.2"),
  status: z.literal("draft"),
  volumeId: z.string().min(1),
  title: z.string().min(1),
  genre: z.string().min(1),
  volumePlanSource: z.string().min(1),
  chapterCount: z.number().int().positive(),
  chapters: z.array(
    z.object({
      chapterId: z.string().min(1),
      title: z.string().min(1),
      goal: z.string(),
      conflict: z.string(),
      payoff: z.string(),
      informationGain: z.string(),
      endingHook: z.string()
    })
  ),
  sourceFiles: z.array(z.string().min(1)).min(1),
  sourceDigest: z.array(
    z.object({
      file: z.string().min(1),
      excerpt: z.string()
    })
  ),
  generatedAt: z.string().datetime()
});

export type ChaptersPlanDraft = z.infer<typeof ChaptersPlanDraftSchema>;

export async function createBookPlanDraft(input: {
  workspaceDir: string;
  force?: boolean;
  now?: Date;
}): Promise<{ draft: BookPlanDraft; outputPath: string; overwritten: boolean }> {
  const outputPath = path.join(input.workspaceDir, "outlines", "book.draft.json");
  const exists = await pathExists(outputPath);
  if (exists && !input.force) {
    throw new Error("Book plan draft already exists. Re-run with --force to replace outlines/book.draft.json.");
  }

  const config = await loadLongguConfig(input.workspaceDir);
  const context = await loadBibleContext(input.workspaceDir);
  const sourceFiles = ["longgu.yaml", ...context.map((item) => item.file)];
  const draft = BookPlanDraftSchema.parse({
    schemaVersion: "longgu.book-plan-draft.v0.2",
    status: "draft",
    title: config.title,
    genre: config.genre,
    language: config.language,
    premise: {
      logline: pickLabeledLine(context, "premise.md", ["一句话卖点", "logline"]),
      mainConflict: pickLabeledLine(context, "premise.md", ["主线矛盾", "main conflict"]),
      sellingPoint: pickLabeledLine(context, "premise.md", ["读者承诺", "selling point"])
    },
    protagonist: {
      name: pickLabeledLine(context, "characters.md", ["姓名", "主角"]),
      desire: pickLabeledLine(context, "characters.md", ["欲望"]),
      flaw: pickLabeledLine(context, "characters.md", ["弱点"]),
      cheat: pickLabeledLine(context, "characters.md", ["金手指"])
    },
    coreHook: "",
    conflictLadder: [
      { stage: "opening", pressure: "", payoff: "" },
      { stage: "middle", pressure: "", payoff: "" },
      { stage: "finale", pressure: "", payoff: "" }
    ],
    powerSystem: {
      rules: pickLabeledLine(context, "world.md", ["世界基础规则", "rules"]),
      keyResources: pickLabeledLine(context, "world.md", ["核心资源", "resource"]),
      progression: ""
    },
    readerPromises: [],
    retentionRisks: [],
    sourceFiles,
    sourceDigest: context.map((item) => ({
      file: item.file,
      excerpt: compactExcerpt(item.content)
    })),
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists };
}

export async function createVolumePlanDraft(input: {
  workspaceDir: string;
  volumeId: string;
  force?: boolean;
  now?: Date;
}): Promise<{ draft: VolumePlanDraft; outputPath: string; overwritten: boolean }> {
  const volumeId = normalizePlanId(input.volumeId);
  const bookPlanPath = path.join(input.workspaceDir, "outlines", "book.draft.json");
  if (!(await pathExists(bookPlanPath))) {
    throw new Error("Book plan draft is required. Run longgu plan book before longgu plan volume.");
  }

  const outputPath = path.join(input.workspaceDir, "outlines", `volume-${volumeId}.draft.json`);
  const exists = await pathExists(outputPath);
  if (exists && !input.force) {
    throw new Error(
      `Volume plan draft already exists. Re-run with --force to replace outlines/volume-${volumeId}.draft.json.`
    );
  }

  const bookPlan = await loadBookPlanDraft(bookPlanPath);
  const draft = VolumePlanDraftSchema.parse({
    schemaVersion: "longgu.volume-plan-draft.v0.2",
    status: "draft",
    volumeId,
    title: `${bookPlan.title} 第${volumeId}卷`,
    genre: bookPlan.genre,
    bookPlanSource: "outlines/book.draft.json",
    volumeGoal: "",
    primaryAntagonist: "",
    conflictEscalation: [
      { step: "opening", pressure: "", expectedPayoff: "" },
      { step: "middle", pressure: "", expectedPayoff: "" },
      { step: "climax", pressure: "", expectedPayoff: "" }
    ],
    resourceChanges: [],
    keyPayoffs: [],
    endingHook: "",
    chapterSeedCount: 12,
    sourceFiles: ["outlines/book.draft.json", ...bookPlan.sourceFiles],
    sourceDigest: [
      {
        file: "outlines/book.draft.json",
        excerpt: compactExcerpt(JSON.stringify(bookPlan))
      },
      ...bookPlan.sourceDigest
    ],
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists };
}

export async function createChaptersPlanDraft(input: {
  workspaceDir: string;
  volumeId: string;
  force?: boolean;
  now?: Date;
}): Promise<{ draft: ChaptersPlanDraft; outputPath: string; overwritten: boolean }> {
  const volumeId = normalizePlanId(input.volumeId);
  const volumePlanSource = `outlines/volume-${volumeId}.draft.json`;
  const volumePlanPath = path.join(input.workspaceDir, volumePlanSource);
  if (!(await pathExists(volumePlanPath))) {
    throw new Error(`Volume plan draft is required. Run longgu plan volume --id ${volumeId} before longgu plan chapters.`);
  }

  const outputPath = path.join(input.workspaceDir, "outlines", `chapters-${volumeId}.draft.json`);
  const exists = await pathExists(outputPath);
  if (exists && !input.force) {
    throw new Error(
      `Chapters plan draft already exists. Re-run with --force to replace outlines/chapters-${volumeId}.draft.json.`
    );
  }

  const volumePlan = await loadVolumePlanDraft(volumePlanPath);
  const draft = ChaptersPlanDraftSchema.parse({
    schemaVersion: "longgu.chapters-plan-draft.v0.2",
    status: "draft",
    volumeId,
    title: `${volumePlan.title} 章节规划`,
    genre: volumePlan.genre,
    volumePlanSource,
    chapterCount: volumePlan.chapterSeedCount,
    chapters: Array.from({ length: volumePlan.chapterSeedCount }, (_, index) => {
      const chapterNumber = String(index + 1).padStart(3, "0");
      return {
        chapterId: `${volumeId}-${chapterNumber}`,
        title: `第${chapterNumber}章`,
        goal: "",
        conflict: "",
        payoff: "",
        informationGain: "",
        endingHook: ""
      };
    }),
    sourceFiles: [volumePlanSource, ...volumePlan.sourceFiles],
    sourceDigest: [
      {
        file: volumePlanSource,
        excerpt: compactExcerpt(JSON.stringify(volumePlan))
      },
      ...volumePlan.sourceDigest
    ],
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists };
}

export async function loadBookPlanDraft(filePath: string): Promise<BookPlanDraft> {
  const raw = await readFile(filePath, "utf8");
  return BookPlanDraftSchema.parse(JSON.parse(raw) as unknown);
}

export async function loadVolumePlanDraft(filePath: string): Promise<VolumePlanDraft> {
  const raw = await readFile(filePath, "utf8");
  return VolumePlanDraftSchema.parse(JSON.parse(raw) as unknown);
}

export async function loadChaptersPlanDraft(filePath: string): Promise<ChaptersPlanDraft> {
  const raw = await readFile(filePath, "utf8");
  return ChaptersPlanDraftSchema.parse(JSON.parse(raw) as unknown);
}

function normalizePlanId(value: string): string {
  const id = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) {
    throw new Error("Plan id must contain only letters, numbers, underscores, or hyphens.");
  }
  return id;
}

function pickLabeledLine(
  context: { file: string; content: string }[],
  fileName: string,
  labels: string[]
): string {
  const item = context.find((entry) => entry.file.endsWith(fileName));
  if (!item) {
    return "";
  }

  for (const line of item.content.split(/\r?\n/)) {
    const trimmed = line.trim();
    for (const label of labels) {
      const pattern = new RegExp(`^(?:[-*]\\s*)?${escapeRegExp(label)}\\s*[：:]\\s*(.*)$`, "i");
      const match = trimmed.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  return "";
}

function compactExcerpt(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 240);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
