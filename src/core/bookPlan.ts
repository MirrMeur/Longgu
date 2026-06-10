import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { loadLongguConfig, type LongguConfig } from "./config.js";
import { runRoutedTextGeneration, type GenerateTextFn } from "./modelExecution.js";
import { parseProviderJsonObject } from "./providerJson.js";
import { pathExists, loadBibleContext } from "./workspace.js";

const planningJsonMissingMessage = "Planning generation failed: provider response did not contain a JSON object.";

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
      endingHook: z.string(),
      targetWords: z.number().int().positive().optional()
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

const VolumePlanAuditSeveritySchema = z.enum(["critical", "warning", "info"]);
const VolumePlanAuditStatusSchema = z.enum(["passed", "needs-revision", "blocked"]);
const VolumePlanAuditFieldSchema = z.enum([
  "volumeGoal",
  "primaryAntagonist",
  "conflictEscalation",
  "step",
  "pressure",
  "expectedPayoff",
  "keyPayoffs",
  "endingHook",
  "chapterSeedCount"
]);

export const VolumePlanAuditIssueSchema = z.object({
  id: z.string().min(1),
  severity: VolumePlanAuditSeveritySchema,
  field: VolumePlanAuditFieldSchema,
  step: z.string().min(1).optional(),
  reason: z.string().min(1),
  fix: z.string().min(1)
});

export const VolumePlanAuditSchema = z.object({
  schemaVersion: z.literal("longgu.volume-plan-audit.v0.2"),
  volumeId: z.string().min(1),
  status: VolumePlanAuditStatusSchema,
  blocked: z.boolean(),
  summary: z.string().min(1),
  issues: z.array(VolumePlanAuditIssueSchema),
  sourceFiles: z.array(z.string().min(1)),
  generatedAt: z.string().datetime()
});

export type VolumePlanAudit = z.infer<typeof VolumePlanAuditSchema>;
export type VolumePlanAuditIssue = z.infer<typeof VolumePlanAuditIssueSchema>;

const ChapterPlanAuditSeveritySchema = z.enum(["critical", "warning", "info"]);
const ChapterPlanAuditStatusSchema = z.enum(["passed", "needs-revision", "blocked"]);
const ChapterPlanAuditFieldSchema = z.enum([
  "chapterCount",
  "goal",
  "conflict",
  "payoff",
  "informationGain",
  "endingHook"
]);

export const ChapterPlanAuditIssueSchema = z.object({
  id: z.string().min(1),
  severity: ChapterPlanAuditSeveritySchema,
  chapterId: z.string().min(1).optional(),
  field: ChapterPlanAuditFieldSchema,
  reason: z.string().min(1),
  fix: z.string().min(1)
});

export const ChapterPlanAuditSchema = z.object({
  schemaVersion: z.literal("longgu.chapter-plan-audit.v0.2"),
  volumeId: z.string().min(1),
  status: ChapterPlanAuditStatusSchema,
  blocked: z.boolean(),
  summary: z.string().min(1),
  issues: z.array(ChapterPlanAuditIssueSchema),
  sourceFiles: z.array(z.string().min(1)),
  generatedAt: z.string().datetime()
});

export type ChapterPlanAudit = z.infer<typeof ChapterPlanAuditSchema>;
export type ChapterPlanAuditIssue = z.infer<typeof ChapterPlanAuditIssueSchema>;

const VolumePlanAuditInputSchema = VolumePlanDraftSchema.extend({
  chapterSeedCount: z.number().int()
});

type VolumePlanAuditInput = z.infer<typeof VolumePlanAuditInputSchema>;

export async function createBookPlanDraft(input: {
  workspaceDir: string;
  force?: boolean;
  scaffold?: boolean;
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
  const scaffold = input.scaffold ? scaffoldBookPlan(seed, context) : seed;
  const modelResult = input.model
    ? await generatePlanningDraft({
        workspaceDir: input.workspaceDir,
        subjectId: "plan-book",
        config,
        kind: "book",
        prompt: renderPlanningPrompt({
          kind: "book",
          schemaVersion: "longgu.book-plan-draft.v0.2",
          seed: scaffold,
          context: contextToPromptContext(sourceFiles, context),
          instruction: "完善全书规格，补足核心钩子、冲突阶梯、力量体系、读者承诺和留存风险。"
        }),
        context: contextToPromptContext(sourceFiles, context),
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
      })
    : undefined;
  const draft = modelResult ? BookPlanDraftSchema.parse(parseProviderJsonObject(modelResult.text, planningJsonMissingMessage)) : scaffold;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists, runDir: modelResult?.runDir };
}

export async function auditChapterPlan(input: {
  workspaceDir: string;
  volumeId: string;
  now?: Date;
}): Promise<{ audit: ChapterPlanAudit; jsonPath: string; markdownPath: string }> {
  const volumeId = normalizePlanId(input.volumeId);
  const planSource = `outlines/chapters-${volumeId}.draft.json`;
  const planPath = path.join(input.workspaceDir, planSource);
  if (!(await pathExists(planPath))) {
    throw new Error(`Chapters plan draft is required before audit: ${planSource}`);
  }

  const plan = await loadChaptersPlanDraft(planPath);
  const issues = collectChapterPlanIssues(plan);
  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const hasWarning = issues.some((issue) => issue.severity === "warning");
  const audit = ChapterPlanAuditSchema.parse({
    schemaVersion: "longgu.chapter-plan-audit.v0.2",
    volumeId,
    status: hasCritical ? "blocked" : hasWarning ? "needs-revision" : "passed",
    blocked: hasCritical,
    summary:
      issues.length === 0
        ? `Volume ${volumeId} chapter plan is ready for drafting.`
        : `Volume ${volumeId} chapter plan has ${issues.length} readiness issue(s).`,
    issues,
    sourceFiles: [planSource],
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  const outputDir = path.join(input.workspaceDir, "audits");
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `chapters-${volumeId}.plan-audit.json`);
  const markdownPath = path.join(outputDir, `chapters-${volumeId}.plan-audit.md`);
  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderChapterPlanAuditMarkdown(audit), "utf8");
  return { audit, jsonPath, markdownPath };
}

export async function auditVolumePlan(input: {
  workspaceDir: string;
  volumeId: string;
  now?: Date;
}): Promise<{ audit: VolumePlanAudit; jsonPath: string; markdownPath: string }> {
  const volumeId = normalizePlanId(input.volumeId);
  const planSource = `outlines/volume-${volumeId}.draft.json`;
  const planPath = path.join(input.workspaceDir, planSource);
  if (!(await pathExists(planPath))) {
    throw new Error(`Volume plan draft is required before audit: ${planSource}`);
  }

  const plan = await loadVolumePlanAuditInput(planPath);
  const issues = collectVolumePlanIssues(plan);
  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const hasWarning = issues.some((issue) => issue.severity === "warning");
  const audit = VolumePlanAuditSchema.parse({
    schemaVersion: "longgu.volume-plan-audit.v0.2",
    volumeId,
    status: hasCritical ? "blocked" : hasWarning ? "needs-revision" : "passed",
    blocked: hasCritical,
    summary:
      issues.length === 0
        ? `Volume ${volumeId} plan is ready for chapter planning.`
        : `Volume ${volumeId} plan has ${issues.length} readiness issue(s).`,
    issues,
    sourceFiles: [planSource],
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  const outputDir = path.join(input.workspaceDir, "audits");
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `volume-${volumeId}.plan-audit.json`);
  const markdownPath = path.join(outputDir, `volume-${volumeId}.plan-audit.md`);
  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderVolumePlanAuditMarkdown(audit), "utf8");
  return { audit, jsonPath, markdownPath };
}

export async function createVolumePlanDraft(input: {
  workspaceDir: string;
  volumeId: string;
  force?: boolean;
  scaffold?: boolean;
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
  const scaffold = input.scaffold ? scaffoldVolumePlan(seed, bookPlan) : seed;
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
          seed: scaffold,
          context,
          instruction: "基于全书规格完善该分卷目标、反派压力、冲突阶梯、资源变化、关键爽点和卷尾钩子。"
        }),
        context,
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
      })
    : undefined;
  const draft = modelResult ? VolumePlanDraftSchema.parse(parseProviderJsonObject(modelResult.text, planningJsonMissingMessage)) : scaffold;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists, runDir: modelResult?.runDir };
}

export async function createChaptersPlanDraft(input: {
  workspaceDir: string;
  volumeId: string;
  force?: boolean;
  scaffold?: boolean;
  skipVolumeAudit?: boolean;
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
  if (!input.skipVolumeAudit) {
    await assertVolumePlanAuditPassed(input.workspaceDir, volumeId);
  }

  const outputPath = path.join(input.workspaceDir, "outlines", `chapters-${volumeId}.draft.json`);
  const exists = await pathExists(outputPath);
  if (exists && !input.force) {
    throw new Error(
      `Chapters plan draft already exists. Re-run with --force to replace outlines/chapters-${volumeId}.draft.json.`
    );
  }

  const volumePlan = await loadVolumePlanDraft(volumePlanPath);
  const config = await loadLongguConfig(input.workspaceDir);
  const seed = ChaptersPlanDraftSchema.parse({
    schemaVersion: "longgu.chapters-plan-draft.v0.2",
    status: "draft",
    volumeId,
    title: `${volumePlan.title} 章节规划`,
    genre: volumePlan.genre,
    volumePlanSource,
    chapterCount: volumePlan.chapterSeedCount,
    chapters: createChapterCards(volumePlan, input.scaffold ? config.drafting?.targetWords : undefined),
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
  const draft = modelResult ? ChaptersPlanDraftSchema.parse(parseProviderJsonObject(modelResult.text, planningJsonMissingMessage)) : seed;

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return { draft, outputPath, overwritten: exists, runDir: modelResult?.runDir };
}

async function assertVolumePlanAuditPassed(workspaceDir: string, volumeId: string): Promise<void> {
  const auditSource = `audits/volume-${volumeId}.plan-audit.json`;
  const auditPath = path.join(workspaceDir, auditSource);
  if (!(await pathExists(auditPath))) {
    throw new Error(
      `Volume plan audit is required before chapter planning for volume ${volumeId}. Run longgu audit volume-plan --id ${volumeId}, or pass --skip-volume-audit.`
    );
  }

  const raw = await readFile(auditPath, "utf8");
  const audit = VolumePlanAuditSchema.parse(JSON.parse(raw) as unknown);
  if (audit.volumeId !== volumeId || audit.status !== "passed" || audit.blocked) {
    throw new Error(
      `Volume plan audit has not passed for volume ${volumeId}. Review audits/volume-${volumeId}.plan-audit.md, fix outlines/volume-${volumeId}.draft.json, rerun longgu audit volume-plan --id ${volumeId}, or pass --skip-volume-audit.`
    );
  }
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

function createChapterCards(volumePlan: VolumePlanDraft, targetWords?: number): ChaptersPlanDraft["chapters"] {
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
        : `章尾留下与「${volumePlan.endingHook || volumePlan.volumeGoal || volumePlan.title}」相关的升级信号。`,
      targetWords
    };
  });
}

function scaffoldBookPlan(seed: BookPlanDraft, context: { file: string; content: string }[]): BookPlanDraft {
  const premise = contextText(context, "premise.md");
  const characters = contextText(context, "characters.md");
  const world = contextText(context, "world.md");
  const all = [premise, characters, world].join("\n");
  const protagonistName = seed.protagonist.name || pickLabeledValue(characters, ["姓名", "主角"]) || firstChineseName(characters);
  const sellingPoint = seed.premise.sellingPoint || pickLabeledValue(premise, ["读者承诺", "卖点"]) || firstMeaningfulLine(premise);
  return BookPlanDraftSchema.parse({
    ...seed,
    premise: {
      logline: seed.premise.logline || firstMeaningfulLine(premise) || `${protagonistName || "主角"}卷入核心冲突并完成逆转。`,
      mainConflict: seed.premise.mainConflict || pickLabeledValue(premise, ["主线矛盾", "冲突"]) || "主角目标与外部压迫持续升级。",
      sellingPoint: sellingPoint || "每章提供可见进展、压力反转和章尾钩子。"
    },
    protagonist: {
      name: protagonistName || "主角",
      desire: seed.protagonist.desire || pickLabeledValue(characters, ["欲望", "目标"]) || "摆脱当前困境并获得更高位置。",
      flaw: seed.protagonist.flaw || pickLabeledValue(characters, ["弱点", "缺陷"]) || "对关键规则了解不足。",
      cheat: seed.protagonist.cheat || pickLabeledValue(characters, ["金手指", "能力"]) || pickLabeledValue(world, ["核心资源"]) || "隐藏优势尚未完全暴露。"
    },
    coreHook: seed.coreHook || sellingPoint || firstMeaningfulLine(all) || "主角被低估后用隐藏优势完成反转。",
    conflictLadder: [
      { stage: "opening", pressure: "低位压迫和资源短缺逼主角入局。", payoff: "主角拿到第一份可见机会。" },
      { stage: "middle", pressure: "对手升级规则和舆论压力。", payoff: "主角公开完成一次反转。" },
      { stage: "finale", pressure: "更高层级势力介入并抬高代价。", payoff: "主角赢下阶段目标并抛出下一卷问题。" }
    ],
    powerSystem: {
      rules: seed.powerSystem.rules || pickLabeledValue(world, ["世界基础规则", "规则"]) || "能力、资源和身份位置共同决定冲突结果。",
      keyResources: seed.powerSystem.keyResources || pickLabeledValue(world, ["核心资源", "资源"]) || "资源、情报、身份认可。",
      progression: seed.powerSystem.progression || "从自保到公开证明，再到掌握主动权。"
    },
    readerPromises: seed.readerPromises.length > 0 ? seed.readerPromises : [sellingPoint || "主角会持续完成可见逆转。"],
    retentionRisks:
      seed.retentionRisks.length > 0
        ? seed.retentionRisks
        : [{ risk: "设定解释过多导致推进变慢。", mitigation: "把规则说明压进冲突、选择和爽点兑现里。" }]
  });
}

function scaffoldVolumePlan(seed: VolumePlanDraft, bookPlan: BookPlanDraft): VolumePlanDraft {
  const pressure = bookPlan.conflictLadder[0]?.pressure || bookPlan.premise.mainConflict || "阶段对手持续施压。";
  const payoff = bookPlan.conflictLadder[0]?.payoff || bookPlan.readerPromises[0] || "主角完成第一次公开逆转。";
  return VolumePlanDraftSchema.parse({
    ...seed,
    volumeGoal: seed.volumeGoal || `${bookPlan.protagonist.name}围绕「${bookPlan.coreHook}」拿到阶段性胜利。`,
    primaryAntagonist: seed.primaryAntagonist || "掌握资源和规则解释权的阶段对手",
    conflictEscalation: [
      { step: "opening", pressure, expectedPayoff: payoff },
      { step: "middle", pressure: "对手加码资源封锁和公开质疑。", expectedPayoff: "主角用新信息或能力完成反制。" },
      { step: "climax", pressure: "更高层级压力逼主角付出代价。", expectedPayoff: "主角赢下阶段目标并暴露更大隐患。" }
    ],
    resourceChanges:
      seed.resourceChanges.length > 0
        ? seed.resourceChanges
        : [{ resource: bookPlan.powerSystem.keyResources || "关键资源", from: "匮乏", to: "取得第一份可用筹码" }],
    keyPayoffs: seed.keyPayoffs.length > 0 ? seed.keyPayoffs : [payoff, "公开打破低估", "获得下一阶段资格或线索"],
    endingHook: seed.endingHook || "胜利背后出现更高层级的注视和新问题。"
  });
}

function contextText(context: { file: string; content: string }[], basename: string): string {
  return context.find((item) => item.file.endsWith(basename))?.content ?? "";
}

function pickLabeledValue(text: string, labels: string[]): string {
  for (const label of labels) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\s*[：:]\\s*([^\\n]+)`, "u");
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) {
      return value.replace(/^[-\s]+/, "");
    }
  }
  return "";
}

function firstMeaningfulLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find((line) => line.length >= 6 && !line.endsWith("：") && !line.endsWith(":")) ?? ""
  );
}

function firstChineseName(text: string): string {
  const match = text.match(/[\u4e00-\u9fa5]{2,4}/u);
  return match?.[0] ?? "";
}

function collectChapterPlanIssues(plan: ChaptersPlanDraft): ChapterPlanAuditIssue[] {
  const issues: ChapterPlanAuditIssue[] = [];
  if (plan.chapterCount !== plan.chapters.length) {
    issues.push(
      ChapterPlanAuditIssueSchema.parse({
        id: "chapter-count-mismatch",
        severity: "critical",
        field: "chapterCount",
        reason: `Declared chapterCount ${plan.chapterCount} does not match ${plan.chapters.length} chapter card(s).`,
        fix: "Regenerate or edit the chapter plan so chapterCount matches the actual chapter card count."
      })
    );
  }

  for (const chapter of plan.chapters) {
    for (const field of chapterReadinessFields) {
      const value = chapter[field];
      if (isWeakChapterPlanField(value)) {
        issues.push(
          ChapterPlanAuditIssueSchema.parse({
            id: `${chapter.chapterId}-${field}-weak`,
            severity: "warning",
            chapterId: chapter.chapterId,
            field,
            reason: `${field} is missing, placeholder-like, or too generic to guide drafting.`,
            fix: `Rewrite ${field} with a concrete pressure, action, payoff, information change, or next-scene question.`
          })
        );
      }
    }
  }

  for (let index = 1; index < plan.chapters.length; index += 1) {
    const previous = plan.chapters[index - 1];
    const current = plan.chapters[index];
    for (const field of repeatedChapterFields) {
      if (normalizePlanText(previous[field]) === normalizePlanText(current[field])) {
        issues.push(
          ChapterPlanAuditIssueSchema.parse({
            id: `${current.chapterId}-${field}-repeated`,
            severity: "warning",
            chapterId: current.chapterId,
            field,
            reason: `${field} repeats the previous chapter, which weakens escalation and page-turning momentum.`,
            fix: `Vary ${field} by changing the arena, tactic, cost, witness, payoff, or tail-hook question.`
          })
        );
      }
    }
  }

  return issues.sort((left, right) => left.id.localeCompare(right.id));
}

function collectVolumePlanIssues(plan: VolumePlanAuditInput): VolumePlanAuditIssue[] {
  const issues: VolumePlanAuditIssue[] = [];

  for (const field of volumeReadinessFields) {
    const value = plan[field];
    if (isWeakPlanField(value)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `${field}-weak`,
          severity: "warning",
          field,
          reason: `${field} is missing, placeholder-like, or too generic to define a visible volume promise.`,
          fix: `Rewrite ${field} with a concrete target, opponent pressure, public consequence, or next-volume question.`
        })
      );
    }
  }

  if (plan.conflictEscalation.length < 3) {
    issues.push(
      VolumePlanAuditIssueSchema.parse({
        id: "conflictEscalation-too-short",
        severity: "critical",
        field: "conflictEscalation",
        reason: `Volume plan has ${plan.conflictEscalation.length} conflict escalation step(s), but at least 3 are required for entry, complication, and climax pressure.`,
        fix: "Add at least three escalation steps with distinct pressure and expected payoff."
      })
    );
  }

  if (plan.chapterSeedCount <= 0) {
    issues.push(
      VolumePlanAuditIssueSchema.parse({
        id: "chapterSeedCount-non-positive",
        severity: "critical",
        field: "chapterSeedCount",
        reason: `chapterSeedCount must be positive before chapter planning, but received ${plan.chapterSeedCount}.`,
        fix: "Set chapterSeedCount to the intended positive chapter count for this volume."
      })
    );
  }

  if (plan.keyPayoffs.length === 0) {
    issues.push(
      VolumePlanAuditIssueSchema.parse({
        id: "keyPayoffs-empty",
        severity: "warning",
        field: "keyPayoffs",
        reason: "Volume plan has no key payoff, so chapter planning cannot distribute visible reader rewards.",
        fix: "Add at least one concrete key payoff such as a status shift, resource reversal, public win, reveal, or costly breakthrough."
      })
    );
  }

  plan.keyPayoffs.forEach((payoff, index) => {
    if (isWeakPlanField(payoff)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `keyPayoffs-${index + 1}-weak`,
          severity: "warning",
          field: "keyPayoffs",
          step: String(index + 1),
          reason: "A key payoff is missing, placeholder-like, or too generic to anchor reader reward.",
          fix: "Rewrite the payoff as a visible status, resource, relationship, information, or threat change."
        })
      );
    }
  });

  plan.conflictEscalation.forEach((stage, index) => {
    const stepLabel = stage.step || String(index + 1);
    if (isWeakPlanLabel(stage.step)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `conflictEscalation-${index + 1}-step-weak`,
          severity: "warning",
          field: "step",
          step: stepLabel,
          reason: "Escalation step is missing or placeholder-like.",
          fix: "Name the story movement, such as entry pressure, midpoint complication, false win, climax, or aftershock."
        })
      );
    }
    if (isWeakPlanField(stage.pressure)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `conflictEscalation-${index + 1}-pressure-weak`,
          severity: "warning",
          field: "pressure",
          step: stepLabel,
          reason: "Escalation pressure is missing, placeholder-like, or too generic to force protagonist action.",
          fix: "Rewrite pressure with a concrete antagonist move, deadline, public judgment, resource loss, or personal cost."
        })
      );
    }
    if (isWeakPlanField(stage.expectedPayoff)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `conflictEscalation-${index + 1}-expectedPayoff-weak`,
          severity: "warning",
          field: "expectedPayoff",
          step: stepLabel,
          reason: "Escalation payoff is missing, placeholder-like, or too generic to promise reader reward.",
          fix: "Rewrite payoff as a visible win, loss with information, status shift, resource change, reveal, or sharper hook."
        })
      );
    }
  });

  for (let index = 1; index < plan.conflictEscalation.length; index += 1) {
    const previous = plan.conflictEscalation[index - 1];
    const current = plan.conflictEscalation[index];
    if (normalizePlanText(previous.pressure) === normalizePlanText(current.pressure)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `conflictEscalation-${index + 1}-pressure-repeated`,
          severity: "warning",
          field: "pressure",
          step: current.step || String(index + 1),
          reason: "Escalation pressure repeats the previous step, so the volume does not climb.",
          fix: "Vary the pressure by changing enemy intelligence, public visibility, resource scarcity, time limit, personal stake, or cost."
        })
      );
    }
    if (normalizePlanText(previous.expectedPayoff) === normalizePlanText(current.expectedPayoff)) {
      issues.push(
        VolumePlanAuditIssueSchema.parse({
          id: `conflictEscalation-${index + 1}-expectedPayoff-repeated`,
          severity: "warning",
          field: "expectedPayoff",
          step: current.step || String(index + 1),
          reason: "Escalation payoff repeats the previous step, weakening payoff rhythm.",
          fix: "Vary the payoff by changing status, resource, information, relationship, or future threat."
        })
      );
    }
  }

  return issues.sort((left, right) => left.id.localeCompare(right.id));
}

const volumeReadinessFields = ["volumeGoal", "primaryAntagonist", "endingHook"] as const;
const chapterReadinessFields = ["goal", "conflict", "payoff", "informationGain", "endingHook"] as const;
const repeatedChapterFields = ["goal", "payoff", "endingHook"] as const;

const placeholderPatterns = [
  "todo",
  "tbd",
  "placeholder",
  "未定",
  "待定",
  "补充",
  "暂无",
  "空",
  "n/a",
  "随便",
  "推进剧情",
  "继续发展",
  "发生冲突",
  "制造阻力",
  "留下悬念",
  "获得进展",
  "变强",
  "成长",
  "探索世界",
  "埋伏笔",
  "敌人出现",
  "主角获胜",
  "爽点",
  "反派施压",
  "升级"
];

function isWeakChapterPlanField(value: string): boolean {
  return isWeakPlanField(value);
}

function isWeakPlanField(value: string): boolean {
  const normalized = normalizePlanText(value);
  if (normalized.length < 6) {
    return true;
  }
  return placeholderPatterns.some((pattern) => normalized.includes(normalizePlanText(pattern)));
}

function isWeakPlanLabel(value: string): boolean {
  const normalized = normalizePlanText(value);
  if (normalized.length < 2) {
    return true;
  }
  return placeholderPatterns.some((pattern) => normalized.includes(normalizePlanText(pattern)));
}

function normalizePlanText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function renderVolumePlanAuditMarkdown(audit: VolumePlanAudit): string {
  const issues = audit.issues.length
    ? audit.issues
        .map(
          (issue) =>
            `- [${issue.severity}] ${issue.id}${issue.step ? ` (${issue.step}/${issue.field})` : ` (${issue.field})`}\n  - Reason: ${issue.reason}\n  - Fix: ${issue.fix}`
        )
        .join("\n")
    : "- No issues.";
  return `# Volume Plan Audit ${audit.volumeId}

- Status: ${audit.status}
- Blocked: ${audit.blocked}
- Summary: ${audit.summary}
- Source files: ${audit.sourceFiles.join(", ")}

## Issues

${issues}
`;
}

function renderChapterPlanAuditMarkdown(audit: ChapterPlanAudit): string {
  const issues = audit.issues.length
    ? audit.issues
        .map(
          (issue) =>
            `- [${issue.severity}] ${issue.id}${issue.chapterId ? ` (${issue.chapterId}/${issue.field})` : ` (${issue.field})`}\n  - Reason: ${issue.reason}\n  - Fix: ${issue.fix}`
        )
        .join("\n")
    : "- No issues.";
  return `# Chapter Plan Audit ${audit.volumeId}

- Status: ${audit.status}
- Blocked: ${audit.blocked}
- Summary: ${audit.summary}
- Source files: ${audit.sourceFiles.join(", ")}

## Issues

${issues}
`;
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

async function loadVolumePlanAuditInput(filePath: string): Promise<VolumePlanAuditInput> {
  const raw = await readFile(filePath, "utf8");
  return VolumePlanAuditInputSchema.parse(JSON.parse(raw) as unknown);
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
