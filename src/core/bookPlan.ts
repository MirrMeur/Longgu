import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { loadLongguConfig, type LongguConfig } from "./config.js";
import { runRoutedTextGeneration, type GenerateTextFn } from "./modelExecution.js";
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
  model?: boolean;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateTextFn;
  now?: Date;
}): Promise<{ draft: BookPlanDraft; outputPath: string; overwritten: boolean; runDir?: string }> {
  const outputPath = path.join(input.workspaceDir, "outlines", "book.draft.json");
  const exists = await pathExists(outputPath);
  if (exists && !input.force) {
    throw new Error("Book plan draft already exists. Re-run with --force to replace outlines/book.draft.json.");
  }

  const config = await loadLongguConfig(input.workspaceDir);
  const context = await loadBibleContext(input.workspaceDir);
  const sourceFiles = ["longgu.yaml", ...context.map((item) => item.file)];
  const seed = BookPlanDraftSchema.parse({
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
  const modelResult = input.model
    ? await generatePlanningDraft({
        workspaceDir: input.workspaceDir,
        subjectId: "plan-book",
        config,
        kind: "book",
        prompt: renderPlanningPrompt({
          kind: "book",
          schemaVersion: "longgu.book-plan-draft.v0.2",
          seed,
          context: contextToPromptContext(sourceFiles, context),
          instruction: "完善全书规格，补足核心钩子、冲突阶梯、力量体系、读者承诺和留存风险。"
        }),
        context: contextToPromptContext(sourceFiles, context),
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
      })
    : undefined;
  const draft = modelResult ? BookPlanDraftSchema.parse(parseJsonObject(modelResult.text)) : seed;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists, runDir: modelResult?.runDir };
}

export async function createVolumePlanDraft(input: {
  workspaceDir: string;
  volumeId: string;
  force?: boolean;
  model?: boolean;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateTextFn;
  now?: Date;
}): Promise<{ draft: VolumePlanDraft; outputPath: string; overwritten: boolean; runDir?: string }> {
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
  const seed = VolumePlanDraftSchema.parse({
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
  const config = await loadLongguConfig(input.workspaceDir);
  const context = [
    { file: "outlines/book.draft.json", content: JSON.stringify(bookPlan, null, 2) },
    ...bookPlan.sourceDigest.map((item) => ({ file: item.file, content: item.excerpt }))
  ];
  const modelResult = input.model
    ? await generatePlanningDraft({
        workspaceDir: input.workspaceDir,
        subjectId: `plan-volume-${volumeId}`,
        config,
        kind: "volume",
        prompt: renderPlanningPrompt({
          kind: "volume",
          schemaVersion: "longgu.volume-plan-draft.v0.2",
          seed,
          context,
          instruction: "基于全书规格完善该分卷目标、反派压力、冲突阶梯、资源变化、关键爽点和卷尾钩子。"
        }),
        context,
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
      })
    : undefined;
  const draft = modelResult ? VolumePlanDraftSchema.parse(parseJsonObject(modelResult.text)) : seed;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists, runDir: modelResult?.runDir };
}

export async function createChaptersPlanDraft(input: {
  workspaceDir: string;
  volumeId: string;
  force?: boolean;
  model?: boolean;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateTextFn;
  now?: Date;
}): Promise<{ draft: ChaptersPlanDraft; outputPath: string; overwritten: boolean; runDir?: string }> {
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
  const seed = ChaptersPlanDraftSchema.parse({
    schemaVersion: "longgu.chapters-plan-draft.v0.2",
    status: "draft",
    volumeId,
    title: `${volumePlan.title} 章节规划`,
    genre: volumePlan.genre,
    volumePlanSource,
    chapterCount: volumePlan.chapterSeedCount,
    chapters: createChapterCards(volumePlan),
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
  const config = await loadLongguConfig(input.workspaceDir);
  const context = [
    { file: volumePlanSource, content: JSON.stringify(volumePlan, null, 2) },
    ...volumePlan.sourceDigest.map((item) => ({ file: item.file, content: item.excerpt }))
  ];
  const modelResult = input.model
    ? await generatePlanningDraft({
        workspaceDir: input.workspaceDir,
        subjectId: `plan-chapters-${volumeId}`,
        config,
        kind: "chapters",
        prompt: renderPlanningPrompt({
          kind: "chapters",
          schemaVersion: "longgu.chapters-plan-draft.v0.2",
          seed,
          context,
          instruction: "基于分卷规划生成完整章节卡，每章必须具备目标、冲突、爽点、信息增量和章尾钩子。"
        }),
        context,
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
      })
    : undefined;
  const draft = modelResult ? ChaptersPlanDraftSchema.parse(parseJsonObject(modelResult.text)) : seed;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists, runDir: modelResult?.runDir };
}

async function generatePlanningDraft(input: {
  workspaceDir: string;
  subjectId: string;
  config: LongguConfig;
  kind: string;
  prompt: string;
  context: { file: string; content: string }[];
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateTextFn;
}): Promise<{ text: string; runDir: string }> {
  if (!input.generate) {
    throw new Error(`Model-backed ${input.kind} planning requires a provider generator.`);
  }
  const result = await runRoutedTextGeneration({
    workspaceDir: input.workspaceDir,
    task: "planning",
    subjectId: input.subjectId,
    config: input.config,
    prompt: input.prompt,
    context: input.context,
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate
  });
  return { text: result.text, runDir: result.runDir };
}

function renderPlanningPrompt(input: {
  kind: string;
  schemaVersion: string;
  seed: unknown;
  context: { file: string; content: string }[];
  instruction: string;
}): string {
  return `你是龙骨 Longgu 的规划器。请只输出一个 JSON 对象，不要输出 Markdown，不要解释。

目标：${input.instruction}

必须遵守：
- schemaVersion 固定为 "${input.schemaVersion}"
- status 固定为 "draft"
- 保留 seed 中的稳定字段和 sourceFiles/sourceDigest
- 不要删减必填字段
- 所有可编辑规划字段尽量补成具体、可执行、可审查的内容

当前 seed：
${JSON.stringify(input.seed, null, 2)}

输入上下文：
${JSON.stringify(input.context, null, 2)}

只输出 ${input.kind} draft JSON：`;
}

function contextToPromptContext(
  sourceFiles: string[],
  context: { file: string; content: string }[]
): { file: string; content: string }[] {
  return sourceFiles.map((file) => ({
    file,
    content: file === "longgu.yaml" ? "loaded from config" : context.find((item) => item.file === file)?.content ?? ""
  }));
}

function createChapterCards(volumePlan: VolumePlanDraft): ChaptersPlanDraft["chapters"] {
  return Array.from({ length: volumePlan.chapterSeedCount }, (_, index) => {
    const chapterNumber = String(index + 1).padStart(3, "0");
    const stage = resolveConflictStage(volumePlan, index);
    const resourceChange = volumePlan.resourceChanges[index % Math.max(volumePlan.resourceChanges.length, 1)];
    const keyPayoff = volumePlan.keyPayoffs[index % Math.max(volumePlan.keyPayoffs.length, 1)];
    const finalChapter = index === volumePlan.chapterSeedCount - 1;
    return {
      chapterId: `${volumePlan.volumeId}-${chapterNumber}`,
      title: `第${chapterNumber}章 ${stage.step}推进`,
      goal: `${volumePlan.volumeGoal || volumePlan.title}：完成第 ${index + 1} 个推进节点。`,
      conflict: stage.pressure || `${volumePlan.primaryAntagonist || "对手势力"}制造阻力，逼主角做出选择。`,
      payoff: stage.expectedPayoff || keyPayoff || "让主角获得一次明确进展，并兑现本章爽点。",
      informationGain: resourceChange
        ? `${resourceChange.resource} 从「${resourceChange.from}」变化到「${resourceChange.to}」，暴露新的规则或代价。`
        : `${volumePlan.primaryAntagonist || "对手"}的真实压力来源进一步显露。`,
      endingHook: finalChapter
        ? volumePlan.endingHook || "卷尾钩子抛出下一阶段更高压力。"
        : `章尾留下与「${volumePlan.endingHook || volumePlan.volumeGoal || volumePlan.title}」相关的升级信号。`
    };
  });
}

function resolveConflictStage(volumePlan: VolumePlanDraft, index: number): VolumePlanDraft["conflictEscalation"][number] {
  if (volumePlan.conflictEscalation.length === 0) {
    return { step: "阶段", pressure: "", expectedPayoff: "" };
  }
  const stageIndex = Math.min(volumePlan.conflictEscalation.length - 1, Math.floor((index / volumePlan.chapterSeedCount) * volumePlan.conflictEscalation.length));
  return volumePlan.conflictEscalation[stageIndex];
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

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced?.[1] ?? extractJsonObject(trimmed);
  return JSON.parse(jsonText) as unknown;
}

function extractJsonObject(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Planning generation failed: provider response did not contain a JSON object.");
  }
  return text.slice(first, last + 1);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
