import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { LongguConfig, ProviderBackedLongguConfig } from "./config.js";
import { loadLongguConfig, requireProviderBackedConfig } from "./config.js";
import { renderGenrePromptHints, resolveGenreCard } from "./genreCards.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { parseProviderJsonObject } from "./providerJson.js";
import { stateLedgerFiles, loadStateLedger } from "./state.js";
import { loadBibleContext, pathExists } from "./workspace.js";

const auditSchemaVersion = z.literal("longgu.chapter-audit.v0.4");

const SeveritySchema = z.enum(["critical", "warning", "info"]);
const CheckerPrioritySchema = z.enum(["P0", "P1", "P2"]);
const IssueSourceSchema = z.enum(["chapter-plan", "prose", "state", "rule"]);
const AuditStatusSchema = z.enum(["passed", "needs-revision", "blocked"]);
const ContractStatusSchema = z.enum(["complete", "incomplete"]);
const ContractFieldSchema = z.enum(["startHook", "protagonistGoal", "obstacle", "turn", "payoff", "tailHook"]);
const AuditDimensionSchema = z.enum([
  "role-ooc",
  "timeline-conflict",
  "setting-conflict",
  "power-resource-collapse",
  "hook-omission",
  "weak-payoff",
  "weak-ending-hook",
  "summary-like-prose",
  "ai-explanatory-tone",
  "cliche-density",
  "information-overreach",
  "chapter-goal-drift",
  "weak-opening-hook",
  "flat-emotional-curve",
  "missing-breath-scene",
  "dialogue-desert",
  "insufficient-cp-chemistry",
  "weak-meme-hook"
]);

const ScoreSchema = z.number().min(0).max(10);

const RawChapterContractSchema = z.object({
  status: ContractStatusSchema.optional(),
  missing: z.array(ContractFieldSchema).optional(),
  startHook: z.string().optional(),
  protagonistGoal: z.string().optional(),
  obstacle: z.string().optional(),
  turn: z.string().optional(),
  payoff: z.string().optional(),
  tailHook: z.string().optional(),
  diagnosis: z.string().optional()
});

const RawAuditIssueSchema = z.object({
  id: z.string().min(1),
  severity: SeveritySchema.optional(),
  checkerPriority: CheckerPrioritySchema.optional(),
  source: IssueSourceSchema,
  dimension: AuditDimensionSchema,
  location: z.string().min(1),
  reason: z.string().min(1),
  fix: z.string().min(1)
});

export const RawChapterAuditSchema = z.object({
  schemaVersion: auditSchemaVersion.optional(),
  chapterId: z.string().min(1),
  genre: z.string().min(1),
  summary: z.string().min(1),
  scores: z.object({
    retention: ScoreSchema,
    readability: ScoreSchema,
    aiFlavor: ScoreSchema,
    scenePressure: ScoreSchema,
    characterVoice: ScoreSchema
  }),
  contract: RawChapterContractSchema.optional(),
  issues: z.array(RawAuditIssueSchema),
  sourceFiles: z.array(z.string().min(1)).default([])
});

const ChapterAuditIssueSchema = RawAuditIssueSchema.extend({
  severity: SeveritySchema
});

const ChapterContractSchema = z.object({
  status: ContractStatusSchema,
  missing: z.array(ContractFieldSchema),
  startHook: z.string().min(1),
  protagonistGoal: z.string().min(1),
  obstacle: z.string().min(1),
  turn: z.string().min(1),
  payoff: z.string().min(1),
  tailHook: z.string().min(1),
  diagnosis: z.string().min(1)
});

export const ChapterAuditSchema = z.object({
  schemaVersion: auditSchemaVersion,
  chapterId: z.string().min(1),
  genre: z.string().min(1),
  status: AuditStatusSchema,
  summary: z.string().min(1),
  scores: RawChapterAuditSchema.shape.scores,
  issues: z.array(ChapterAuditIssueSchema),
  contract: ChapterContractSchema,
  reviseQueue: z.array(z.string().min(1)),
  blocked: z.boolean(),
  sourceFiles: z.array(z.string().min(1)),
  generatedAt: z.string().datetime()
});

export type RawChapterAudit = z.infer<typeof RawChapterAuditSchema>;
export type ChapterAudit = z.infer<typeof ChapterAuditSchema>;
export type ChapterAuditIssue = z.infer<typeof ChapterAuditIssueSchema>;
export type ChapterContract = z.infer<typeof ChapterContractSchema>;

export type GenerateChapterAuditFn = (request: {
  prompt: string;
  config: ProviderBackedLongguConfig;
  apiKey: string;
}) => Promise<{ text: string }>;

export interface ChapterAuditAttempt {
  attempt: number;
  prompt: string;
  runDir?: string;
  output?: string;
  error?: string;
  accepted: boolean;
}

export interface ChapterAuditResult {
  audit: ChapterAudit;
  jsonPath: string;
  markdownPath: string;
  guidedMarkdownPath?: string;
  attemptsPath?: string;
}

export async function auditChapter(input: {
  workspaceDir: string;
  chapterId: string;
  inputPath?: string;
  config?: LongguConfig;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateChapterAuditFn;
  now?: Date;
}): Promise<ChapterAuditResult> {
  const chapter = await resolveChapterBody(input.workspaceDir, input.chapterId);
  if (!chapter) {
    throw new Error(`Chapter body is required before audit: chapters/${input.chapterId}.md or 07_正文/第${input.chapterId}章.md`);
  }

  const config = input.config ?? (await loadLongguConfig(input.workspaceDir));
  const context = await loadAuditContext({
    workspaceDir: input.workspaceDir,
    chapterId: input.chapterId,
    config,
    chapterPath: chapter.path,
    chapterSource: chapter.source
  });
  const rawInput = input.inputPath
    ? await loadRawAudit(path.isAbsolute(input.inputPath) ? input.inputPath : path.join(input.workspaceDir, input.inputPath))
    : await generateRawAudit({
        workspaceDir: input.workspaceDir,
        context,
        config: requireProviderBackedConfig(config),
        apiKey: input.apiKey,
        readApiKey: input.readApiKey,
        generate: input.generate
      });

  const audit = normalizeChapterAudit({
    raw: rawInput.raw,
    chapterId: input.chapterId,
    genre: config.genre,
    sourceFiles: context.sourceFiles,
    now: input.now ?? new Date()
  });
  const outputDir = path.join(input.workspaceDir, "audits");
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `${input.chapterId}.audit.json`);
  const markdownPath = path.join(outputDir, `${input.chapterId}.audit.md`);
  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderAuditMarkdown(audit), "utf8");
  const guidedMarkdownPath = await writeGuidedAuditMarkdown(input.workspaceDir, audit);

  let attemptsPath: string | undefined;
  if (rawInput.attempts) {
    attemptsPath = path.join(outputDir, `${input.chapterId}.audit-attempts.json`);
    await writeFile(attemptsPath, `${JSON.stringify(rawInput.attempts, null, 2)}\n`, "utf8");
  }

  return { audit, jsonPath, markdownPath, guidedMarkdownPath, attemptsPath };
}

export function normalizeChapterAudit(input: {
  raw: RawChapterAudit;
  chapterId: string;
  genre: string;
  sourceFiles: string[];
  now: Date;
}): ChapterAudit {
  if (input.raw.chapterId !== input.chapterId) {
    throw new Error(`Chapter audit chapterId mismatch: expected ${input.chapterId}, received ${input.raw.chapterId}.`);
  }

  const issues = input.raw.issues.map((issue) => ({
    ...issue,
    severity: issue.severity ?? normalizeCheckerPriority(issue.checkerPriority)
  }));
  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const warningIds = issues.filter((issue) => issue.severity === "warning").map((issue) => issue.id);
  const status = hasCritical ? "blocked" : warningIds.length > 0 ? "needs-revision" : "passed";

  return ChapterAuditSchema.parse({
    schemaVersion: "longgu.chapter-audit.v0.4",
    chapterId: input.chapterId,
    genre: input.raw.genre || input.genre,
    status,
    summary: input.raw.summary,
    scores: input.raw.scores,
    issues,
    contract: normalizeChapterContract(input.raw.contract),
    reviseQueue: hasCritical ? [] : warningIds,
    blocked: hasCritical,
    sourceFiles: uniqueStrings([...input.sourceFiles, ...input.raw.sourceFiles]),
    generatedAt: input.now.toISOString()
  });
}

const chapterContractFields = ["startHook", "protagonistGoal", "obstacle", "turn", "payoff", "tailHook"] as const;

const chapterContractFieldLabels: Record<(typeof chapterContractFields)[number], string> = {
  startHook: "开头压力/钩子",
  protagonistGoal: "主角当章目标",
  obstacle: "阻力",
  turn: "转折",
  payoff: "可见兑现",
  tailHook: "章尾钩子"
};

function normalizeChapterContract(raw?: z.infer<typeof RawChapterContractSchema>): ChapterContract {
  const explicitMissing = raw?.missing ?? [];
  const values = Object.fromEntries(
    chapterContractFields.map((field) => [field, normalizeContractText(raw?.[field])])
  ) as Record<(typeof chapterContractFields)[number], string>;
  const missing = chapterContractFields.filter(
    (field) => explicitMissing.includes(field) || isMissingContractValue(values[field])
  );
  const status = missing.length > 0 || raw?.status === "incomplete" ? "incomplete" : "complete";
  const missingLabels = missing.map((field) => chapterContractFieldLabels[field]).join("、");

  return ChapterContractSchema.parse({
    status,
    missing,
    startHook: missing.includes("startHook") ? "未评估" : values.startHook,
    protagonistGoal: missing.includes("protagonistGoal") ? "未评估" : values.protagonistGoal,
    obstacle: missing.includes("obstacle") ? "未评估" : values.obstacle,
    turn: missing.includes("turn") ? "未评估" : values.turn,
    payoff: missing.includes("payoff") ? "未评估" : values.payoff,
    tailHook: missing.includes("tailHook") ? "未评估" : values.tailHook,
    diagnosis:
      normalizeContractText(raw?.diagnosis) ||
      (missing.length > 0 ? `章节契约缺少：${missingLabels}。` : "章节契约完整。")
  });
}

function normalizeContractText(value?: string): string {
  return value?.trim() ?? "";
}

function isMissingContractValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "未评估" || normalized === "n/a" || normalized === "na" || normalized === "unknown";
}

export function normalizeCheckerPriority(priority?: "P0" | "P1" | "P2"): "critical" | "warning" | "info" {
  switch (priority) {
    case "P0":
      return "critical";
    case "P1":
      return "warning";
    case "P2":
    case undefined:
      return "info";
  }
}

type RawAuditInput = { raw: RawChapterAudit; attempts?: ChapterAuditAttempt[] };

async function loadRawAudit(inputPath: string): Promise<RawAuditInput> {
  const raw = await readFile(inputPath, "utf8");
  return { raw: RawChapterAuditSchema.parse(JSON.parse(raw) as unknown) };
}

async function generateRawAudit(input: {
  workspaceDir: string;
  context: AuditContext;
  config: ProviderBackedLongguConfig;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateChapterAuditFn;
}): Promise<{ raw: RawChapterAudit; attempts: ChapterAuditAttempt[] }> {
  if ((!input.apiKey && !input.readApiKey) || !input.generate) {
    throw new Error("Chapter audit requires provider config and API key when --input is not provided.");
  }

  let prompt = renderAuditPrompt(input.context);
  const runContext = await loadRunContextFiles(input.workspaceDir, input.context.sourceFiles);
  const attempts: ChapterAuditAttempt[] = [];
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = await runRoutedTextGeneration({
      workspaceDir: input.workspaceDir,
      task: "audit",
      subjectId: input.context.chapterId,
      config: input.config,
      prompt,
      context: runContext,
      apiKey: input.apiKey,
      readApiKey: input.readApiKey,
      generate: input.generate
    });
    try {
      const raw = parseRawAuditFromText(result.text);
      attempts.push({ attempt, prompt, runDir: result.runDir, output: result.text, accepted: true });
      return { raw, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      attempts.push({ attempt, prompt, runDir: result.runDir, output: result.text, error: lastError, accepted: false });
      prompt = renderAuditRetryPrompt({ context: input.context, previousOutput: result.text, error: lastError });
    }
  }

  throw new Error(`Chapter audit extraction failed after retry: ${lastError}`);
}

async function loadRunContextFiles(workspaceDir: string, files: string[]): Promise<{ file: string; content: string }[]> {
  return Promise.all(
    files.map(async (file) => ({
      file,
      content: await readFile(path.join(workspaceDir, file), "utf8")
    }))
  );
}

interface AuditContext {
  chapterId: string;
  config: LongguConfig;
  chapterText: string;
  chapterPlanText: string;
  guidedText: string;
  stateText: string;
  genrePrompt: string;
  payoffRecipesText: string;
  marketText: string;
  sourceFiles: string[];
}

async function loadAuditContext(input: {
  workspaceDir: string;
  chapterId: string;
  config: LongguConfig;
  chapterPath: string;
  chapterSource: string;
}): Promise<AuditContext> {
  const sourceFiles = [input.chapterSource, "longgu.yaml"];
  const chapterText = await readFile(input.chapterPath, "utf8");
  const chapterPlan = await findChapterPlan(input.workspaceDir, input.chapterId);
  if (chapterPlan) {
    sourceFiles.push(chapterPlan.file);
  }
  const guidedSnapshot = await loadGuidedAuditSnapshot(input.workspaceDir, input.chapterId);
  sourceFiles.push(...guidedSnapshot.files);
  const stateSnapshot = await loadStateSnapshot(input.workspaceDir);
  sourceFiles.push(...stateSnapshot.files);
  const payoffRecipes = await loadPayoffRecipes(input.workspaceDir);
  if (payoffRecipes) {
    sourceFiles.push(payoffRecipes.file);
  }
  return {
    chapterId: input.chapterId,
    config: input.config,
    chapterText,
    chapterPlanText: [chapterPlan?.content, guidedSnapshot.content].filter(Boolean).join("\n\n"),
    guidedText: guidedSnapshot.content,
    stateText: stateSnapshot.content,
    genrePrompt: renderGenrePromptHints(resolveGenreCard(input.config.genre)),
    payoffRecipesText: payoffRecipes?.content ?? "",
    marketText: renderAuditMarketText(input.config),
    sourceFiles
  };
}

async function resolveChapterBody(workspaceDir: string, chapterId: string): Promise<{ path: string; source: string } | null> {
  const candidates = [
    { source: path.join("chapters", `${chapterId}.md`), path: path.join(workspaceDir, "chapters", `${chapterId}.md`) },
    { source: path.join("07_正文", `第${chapterId}章.md`), path: path.join(workspaceDir, "07_正文", `第${chapterId}章.md`) }
  ];
  for (const candidate of candidates) {
    if (await pathExists(candidate.path)) {
      return candidate;
    }
  }
  return null;
}

async function loadGuidedAuditSnapshot(workspaceDir: string, chapterId: string): Promise<{ files: string[]; content: string }> {
  const files = [
    "已确认决定.md",
    path.join("01_立项设定", "读者承诺.md"),
    path.join("02_设定圣经", "故事核心.md"),
    path.join("02_设定圣经", "世界设定.md"),
    path.join("02_设定圣经", "角色设定", "主角.md"),
    path.join("03_大纲", "全书大纲.md"),
    path.join("03_大纲", "分卷大纲.md"),
    path.join("04_伏笔与期待", "伏笔账本.md"),
    path.join("04_伏笔与期待", "读者期待.md"),
    path.join("05_前情与状态", "近期前情.md"),
    path.join("05_前情与状态", "角色状态.md"),
    path.join("05_前情与状态", "世界状态.md"),
    path.join("05_前情与状态", "关系状态.md"),
    path.join("05_前情与状态", "未解决问题.md"),
    path.join("05_前情与状态", "连续性风险.md"),
    path.join("06_章节规划", `第${chapterId}章_规划.md`)
  ];
  const existing: { file: string; content: string }[] = [];
  for (const file of files) {
    const filePath = path.join(workspaceDir, file);
    if (await pathExists(filePath)) {
      existing.push({ file, content: await readFile(filePath, "utf8") });
    }
  }
  return {
    files: existing.map((item) => item.file),
    content: existing.map((item) => `## ${item.file}\n\n${item.content.trim()}`).join("\n\n")
  };
}

async function findChapterPlan(workspaceDir: string, chapterId: string): Promise<{ file: string; content: string } | null> {
  const outlinesDir = path.join(workspaceDir, "outlines");
  const entries = await readdir(outlinesDir).catch(() => []);
  for (const file of entries.filter((entry) => entry.startsWith("chapters-") && entry.endsWith(".draft.json")).sort()) {
    const relative = path.join("outlines", file);
    const raw = await readFile(path.join(workspaceDir, relative), "utf8");
    if (raw.includes(`"chapterId": "${chapterId}"`)) {
      return { file: relative, content: raw };
    }
  }
  return null;
}

async function loadStateSnapshot(workspaceDir: string): Promise<{ files: string[]; content: string }> {
  const files: string[] = [];
  const ledgers: Record<string, unknown> = {};
  for (const file of stateLedgerFiles) {
    const statePath = path.join(workspaceDir, "state", file);
    if (await pathExists(statePath)) {
      ledgers[file] = await loadStateLedger(workspaceDir, file);
      files.push(path.join("state", file));
    }
  }
  return { files, content: JSON.stringify(ledgers, null, 2) };
}

function renderAuditPrompt(context: AuditContext): string {
  return `你是龙骨 Longgu 的 V0.4 章节质量审计器。请基于中文商业网文标准审计章节，只输出 JSON，不要输出 Markdown，不要解释。

必须输出 schemaVersion 为 "longgu.chapter-audit.v0.4" 的 JSON。字段包括 chapterId, genre, summary, scores, contract, issues, sourceFiles。

severity 可以直接写 critical/warning/info；也可以使用 checkerPriority P0/P1/P2，Longgu 会映射为 critical/warning/info。

必须检查这些维度：role-ooc, timeline-conflict, setting-conflict, power-resource-collapse, hook-omission, weak-payoff, weak-ending-hook, summary-like-prose, ai-explanatory-tone, cliche-density, information-overreach, chapter-goal-drift, weak-opening-hook, flat-emotional-curve, missing-breath-scene, dialogue-desert, insufficient-cp-chemistry, weak-meme-hook。

prose scores 必须包含 retention, readability, aiFlavor, scenePressure, characterVoice，范围 0-10。

contract 必须检查章节契约：Because [开头压力/钩子], protagonist tries to [主角当章目标], but [阻力], so [转折], ending with [章尾钩子]。
contract 字段必须包含 status, missing, startHook, protagonistGoal, obstacle, turn, payoff, tailHook, diagnosis。
如果 startHook/protagonistGoal/obstacle/turn/payoff/tailHook 任一项缺失或空泛，status 写 incomplete，missing 写缺失字段 id，并在 issues 中添加对应 weak-payoff、weak-ending-hook、hook-omission 或 chapter-goal-drift 问题。
如果章节契约完整，status 写 complete，missing 写 []。

项目：
${JSON.stringify({ title: context.config.title, genre: context.config.genre, language: context.config.language }, null, 2)}

章节规划：
${context.chapterPlanText || "未找到章节规划。"}

类型卡规则：
${context.genrePrompt}

市场约束：
${context.marketText || "未配置市场适配。"}

爽点配方：
${context.payoffRecipesText || "未提供 bible/payoff-recipes.md。"}

状态账本：
${context.stateText || "未初始化状态账本。"}

章节正文 chapters/${context.chapterId}.md：
${context.chapterText}

只输出 JSON：`;
}

function renderAuditRetryPrompt(input: { context: AuditContext; previousOutput: string; error: string }): string {
  return `${renderAuditPrompt(input.context)}

上一次审计输出被拒绝，原因：
${input.error}

上一次输出：
${input.previousOutput}

请重新输出修正后的 JSON。只输出 JSON：`;
}

function parseRawAuditFromText(text: string): RawChapterAudit {
  return RawChapterAuditSchema.parse(
    parseProviderJsonObject(text, "Chapter audit extraction failed: provider response did not contain a JSON object.")
  );
}

async function loadPayoffRecipes(workspaceDir: string): Promise<{ file: string; content: string } | null> {
  const context = await loadBibleContext(workspaceDir).catch(() => []);
  return context.find((item) => item.file === path.join("bible", "payoff-recipes.md")) ?? null;
}

function renderAuditMarketText(config: LongguConfig): string {
  if (!config.market) {
    return "";
  }
  const platformRules: Record<string, string> = {
    fanqie: "番茄：前 3 章定生死，强开篇钩子、高频爽点、短平快兑现。",
    qidian: "起点：可铺设定，但每章需要信息增量、智商博弈或阶段期待。",
    feilu: "飞卢：脑洞密度和爽点频率优先，章首承接上一章爆点。",
    zongheng: "纵横：强调主线压力、人物动机和阶段性升级。"
  };
  return [
    `platform=${config.market.platform ?? "unspecified"}`,
    `targetAudience=${config.market.targetAudience ?? "unspecified"}`,
    `updateCadence=${config.market.updateCadence ?? "unspecified"}`,
    config.market.platform ? platformRules[config.market.platform] : "按通用中文男频商业网文审计。"
  ].join("\n");
}

async function writeGuidedAuditMarkdown(workspaceDir: string, audit: ChapterAudit): Promise<string | undefined> {
  const outputDir = path.join(workspaceDir, "08_AI审稿");
  if (!(await pathExists(outputDir))) {
    return undefined;
  }
  await mkdir(outputDir, { recursive: true });
  const markdownPath = path.join(outputDir, `第${audit.chapterId}章_审稿.md`);
  await writeFile(markdownPath, renderGuidedAuditMarkdown(audit), "utf8");
  return markdownPath;
}

function renderGuidedAuditMarkdown(audit: ChapterAudit): string {
  const issueList = audit.issues.length
    ? audit.issues.map((issue) => `- [${issue.severity}] ${issue.location}：${issue.reason}\n  - 建议：${issue.fix}`).join("\n")
    : "- 暂无问题。";
  return `# 第${audit.chapterId}章_审稿

> AI 审稿只提供建议。作者可直接修改正文、设定或本审稿文件，最终决定以作者为准。

## 总评

${audit.summary}

## 章节规划符合度

- 状态：${audit.contract.status}
- 诊断：${audit.contract.diagnosis}
- 缺失：${audit.contract.missing.length ? audit.contract.missing.join("、") : "无"}

## 读者期待

- Retention: ${audit.scores.retention}/10
- Scene Pressure: ${audit.scores.scenePressure}/10
- 爽点/兑现：${audit.contract.payoff}
- 章尾钩子：${audit.contract.tailHook}

## 伏笔检查

${audit.issues.filter((issue) => issue.dimension.includes("hook") || issue.source === "state").length ? audit.issues.filter((issue) => issue.dimension.includes("hook") || issue.source === "state").map((issue) => `- ${issue.reason}`).join("\n") : "- 未发现明显伏笔问题。"}

## 连续性检查

${audit.issues.filter((issue) => issue.dimension.includes("conflict") || issue.dimension === "information-overreach").length ? audit.issues.filter((issue) => issue.dimension.includes("conflict") || issue.dimension === "information-overreach").map((issue) => `- ${issue.reason}`).join("\n") : "- 未发现明显连续性问题。"}

## 角色一致性

${audit.issues.filter((issue) => issue.dimension === "role-ooc").length ? audit.issues.filter((issue) => issue.dimension === "role-ooc").map((issue) => `- ${issue.reason}`).join("\n") : "- 未发现明显角色一致性问题。"}

## 建议修改

${issueList}
`;
}

function renderAuditMarkdown(audit: ChapterAudit): string {
  const issues = audit.issues.length
    ? audit.issues
        .map(
          (issue) =>
            `- [${issue.severity}] ${issue.id} (${issue.source}/${issue.dimension})\n  - Location: ${issue.location}\n  - Reason: ${issue.reason}\n  - Fix: ${issue.fix}`
        )
        .join("\n")
    : "- No issues.";
  return `# Chapter Audit ${audit.chapterId}

- Status: ${audit.status}
- Blocked: ${audit.blocked}
- Genre: ${audit.genre}
- Summary: ${audit.summary}

## Scores

- Retention: ${audit.scores.retention}/10
- Readability: ${audit.scores.readability}/10
- AI Flavor: ${audit.scores.aiFlavor}/10
- Scene Pressure: ${audit.scores.scenePressure}/10
- Character Voice: ${audit.scores.characterVoice}/10

## Chapter Contract

- Status: ${audit.contract.status}
- Missing: ${audit.contract.missing.length ? audit.contract.missing.join(", ") : "None"}
- Start Hook: ${audit.contract.startHook}
- Protagonist Goal: ${audit.contract.protagonistGoal}
- Obstacle: ${audit.contract.obstacle}
- Turn: ${audit.contract.turn}
- Payoff: ${audit.contract.payoff}
- Tail Hook: ${audit.contract.tailHook}
- Diagnosis: ${audit.contract.diagnosis}

## Issues

${issues}

## Revise Queue

${audit.reviseQueue.length ? audit.reviseQueue.map((id) => `- ${id}`).join("\n") : "- Empty."}
`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort();
}
