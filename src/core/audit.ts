import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { LongguConfig, ProviderBackedLongguConfig } from "./config.js";
import { loadLongguConfig, requireProviderBackedConfig } from "./config.js";
import { renderGenrePromptHints, resolveGenreCard } from "./genreCards.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { stateLedgerFiles, loadStateLedger } from "./state.js";
import { pathExists } from "./workspace.js";

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
  "chapter-goal-drift"
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
  const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
  if (!(await pathExists(chapterPath))) {
    throw new Error(`Chapter body is required before audit: chapters/${input.chapterId}.md`);
  }

  const config = input.config ?? (await loadLongguConfig(input.workspaceDir));
  const context = await loadAuditContext({
    workspaceDir: input.workspaceDir,
    chapterId: input.chapterId,
    config,
    chapterPath
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

  let attemptsPath: string | undefined;
  if (rawInput.attempts) {
    attemptsPath = path.join(outputDir, `${input.chapterId}.audit-attempts.json`);
    await writeFile(attemptsPath, `${JSON.stringify(rawInput.attempts, null, 2)}\n`, "utf8");
  }

  return { audit, jsonPath, markdownPath, attemptsPath };
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
  stateText: string;
  genrePrompt: string;
  sourceFiles: string[];
}

async function loadAuditContext(input: {
  workspaceDir: string;
  chapterId: string;
  config: LongguConfig;
  chapterPath: string;
}): Promise<AuditContext> {
  const sourceFiles = [`chapters/${input.chapterId}.md`, "longgu.yaml"];
  const chapterText = await readFile(input.chapterPath, "utf8");
  const chapterPlan = await findChapterPlan(input.workspaceDir, input.chapterId);
  if (chapterPlan) {
    sourceFiles.push(chapterPlan.file);
  }
  const stateSnapshot = await loadStateSnapshot(input.workspaceDir);
  sourceFiles.push(...stateSnapshot.files);
  return {
    chapterId: input.chapterId,
    config: input.config,
    chapterText,
    chapterPlanText: chapterPlan?.content ?? "",
    stateText: stateSnapshot.content,
    genrePrompt: renderGenrePromptHints(resolveGenreCard(input.config.genre)),
    sourceFiles
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

必须检查这些维度：role-ooc, timeline-conflict, setting-conflict, power-resource-collapse, hook-omission, weak-payoff, weak-ending-hook, summary-like-prose, ai-explanatory-tone, cliche-density, information-overreach, chapter-goal-drift。

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
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced?.[1] ?? extractJsonObject(trimmed);
  return RawChapterAuditSchema.parse(JSON.parse(jsonText) as unknown);
}

function extractJsonObject(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Chapter audit extraction failed: provider response did not contain a JSON object.");
  }
  return text.slice(first, last + 1);
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
