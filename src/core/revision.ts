import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { LongguConfig } from "./config.js";
import { loadLongguConfig } from "./config.js";
import { ChapterAuditSchema, type ChapterAudit, type ChapterAuditIssue } from "./audit.js";
import { renderGenrePromptHints, resolveGenreCard } from "./genreCards.js";
import { runRoutedTextGeneration } from "./modelExecution.js";
import { stateLedgerFiles, loadStateLedger } from "./state.js";
import { pathExists } from "./workspace.js";

export const RevisionModeSchema = z.enum(["spot-fix", "polish", "rewrite-scene", "rewrite-chapter"]);
const revisionSchemaVersion = z.literal("longgu.chapter-revision.v0.5");

export const ChapterRevisionMetadataSchema = z.object({
  schemaVersion: revisionSchemaVersion,
  chapterId: z.string().min(1),
  mode: RevisionModeSchema,
  auditFile: z.string().min(1),
  selectedIssueIds: z.array(z.string().min(1)),
  preCriticalCount: z.number().int().nonnegative(),
  postCriticalCount: z.number().int().nonnegative().optional(),
  criticalCountDecreased: z.boolean().optional(),
  revisedAt: z.string().datetime(),
  revisionDir: z.string().min(1)
});

export type RevisionMode = z.infer<typeof RevisionModeSchema>;
export type ChapterRevisionMetadata = z.infer<typeof ChapterRevisionMetadataSchema>;

export type GenerateChapterRevisionFn = (request: {
  prompt: string;
  config: LongguConfig;
  apiKey: string;
}) => Promise<{ text: string }>;

export interface ChapterRevisionResult {
  revisionDir: string;
  metadata: ChapterRevisionMetadata;
  diffPath: string;
  chapterPath: string;
}

export async function reviseChapter(input: {
  workspaceDir: string;
  chapterId: string;
  mode?: RevisionMode;
  inputPath?: string;
  postAuditPath?: string;
  config?: LongguConfig;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateChapterRevisionFn;
  now?: Date;
}): Promise<ChapterRevisionResult> {
  const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
  if (!(await pathExists(chapterPath))) {
    throw new Error(`Chapter body is required before revision: chapters/${input.chapterId}.md`);
  }
  const auditPath = path.join(input.workspaceDir, "audits", `${input.chapterId}.audit.json`);
  if (!(await pathExists(auditPath))) {
    throw new Error(`Chapter audit is required before revision: audits/${input.chapterId}.audit.json`);
  }

  const config = input.config ?? (await loadLongguConfig(input.workspaceDir));
  const before = await readFile(chapterPath, "utf8");
  const audit = await loadChapterAudit(auditPath);
  const selectedIssues = selectRevisionIssues(audit);
  const mode = input.mode ?? selectDefaultRevisionMode(audit);
  const stateSnapshot = await loadStateSnapshot(input.workspaceDir);
  const genrePrompt = renderGenrePromptHints(resolveGenreCard(config.genre));
  const prompt = renderRevisionPrompt({ chapterId: input.chapterId, before, audit, selectedIssues, mode, stateSnapshot, genrePrompt });
  const revisionInput = await resolveRevisionInput({
    workspaceDir: input.workspaceDir,
    inputPath: input.inputPath,
    prompt,
    config,
    chapterId: input.chapterId,
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate
  });
  const after = normalizeRevisedMarkdown(revisionInput.text);

  if (!after.trim()) {
    throw new Error("Chapter revision failed: provider returned an empty chapter.");
  }
  if (after === before) {
    throw new Error("Chapter revision failed: provider output is identical to the current chapter.");
  }

  const preCriticalCount = countCritical(audit);
  const postAudit = input.postAuditPath
    ? await loadChapterAudit(path.isAbsolute(input.postAuditPath) ? input.postAuditPath : path.join(input.workspaceDir, input.postAuditPath))
    : undefined;
  const postCriticalCount = postAudit ? countCritical(postAudit) : undefined;
  if (preCriticalCount > 0 && postCriticalCount !== undefined && postCriticalCount >= preCriticalCount) {
    throw new Error(
      `Chapter revision failed: post-audit critical count did not decrease (${preCriticalCount} -> ${postCriticalCount}).`
    );
  }

  const revisedAt = input.now ?? new Date();
  const revisionDir = path.join(
    input.workspaceDir,
    "revisions",
    input.chapterId,
    revisedAt.toISOString().replace(/[:.]/g, "-")
  );
  const metadata = ChapterRevisionMetadataSchema.parse({
    schemaVersion: "longgu.chapter-revision.v0.5",
    chapterId: input.chapterId,
    mode,
    auditFile: path.relative(input.workspaceDir, auditPath),
    selectedIssueIds: selectedIssues.map((issue) => issue.id),
    preCriticalCount,
    postCriticalCount,
    criticalCountDecreased: postCriticalCount === undefined ? undefined : postCriticalCount < preCriticalCount,
    revisedAt: revisedAt.toISOString(),
    revisionDir: path.relative(input.workspaceDir, revisionDir)
  });
  const diff = createLineDiff(before, after);

  await mkdir(revisionDir, { recursive: true });
  await writeFile(path.join(revisionDir, "before.md"), before, "utf8");
  await writeFile(path.join(revisionDir, "after.md"), after, "utf8");
  await writeFile(path.join(revisionDir, "diff.md"), diff, "utf8");
  await writeFile(path.join(revisionDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  await writeFile(path.join(revisionDir, "prompt.md"), prompt, "utf8");
  await writeFile(path.join(revisionDir, "model-output.md"), revisionInput.text, "utf8");
  await writeFile(chapterPath, after, "utf8");

  return { revisionDir, metadata, diffPath: path.join(revisionDir, "diff.md"), chapterPath };
}

export function selectDefaultRevisionMode(audit: ChapterAudit): RevisionMode {
  return audit.issues.some((issue) => issue.severity === "critical") ? "rewrite-scene" : "spot-fix";
}

export function createLineDiff(before: string, after: string): string {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  const max = Math.max(beforeLines.length, afterLines.length);
  const lines: string[] = ["# Revision Diff", ""];
  for (let index = 0; index < max; index += 1) {
    const oldLine = beforeLines[index];
    const newLine = afterLines[index];
    if (oldLine === newLine) {
      continue;
    }
    if (oldLine !== undefined) {
      lines.push(`- ${oldLine}`);
    }
    if (newLine !== undefined) {
      lines.push(`+ ${newLine}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

async function loadChapterAudit(auditPath: string): Promise<ChapterAudit> {
  const raw = await readFile(auditPath, "utf8");
  return ChapterAuditSchema.parse(JSON.parse(raw) as unknown);
}

async function resolveRevisionInput(input: {
  workspaceDir: string;
  inputPath?: string;
  prompt: string;
  config: LongguConfig;
  chapterId: string;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate?: GenerateChapterRevisionFn;
}): Promise<{ text: string }> {
  if (input.inputPath) {
    const revisionPath = path.isAbsolute(input.inputPath) ? input.inputPath : path.join(input.workspaceDir, input.inputPath);
    return { text: await readFile(revisionPath, "utf8") };
  }
  if ((!input.apiKey && !input.readApiKey) || !input.generate) {
    throw new Error("Chapter revision requires provider config and API key when --input is not provided.");
  }
  return runRoutedTextGeneration({
    workspaceDir: input.workspaceDir,
    task: "revise",
    subjectId: input.chapterId,
    config: input.config,
    prompt: input.prompt,
    context: [{ file: `chapters/${input.chapterId}.md`, content: "" }],
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate
  });
}

function selectRevisionIssues(audit: ChapterAudit): ChapterAuditIssue[] {
  const critical = audit.issues.filter((issue) => issue.severity === "critical");
  if (critical.length > 0) {
    return critical;
  }
  const warnings = audit.issues.filter((issue) => issue.severity === "warning");
  if (warnings.length > 0) {
    return warnings;
  }
  return audit.issues.filter((issue) => issue.severity === "info");
}

function countCritical(audit: ChapterAudit): number {
  return audit.issues.filter((issue) => issue.severity === "critical").length;
}

function normalizeRevisedMarkdown(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:md|markdown)?\s*([\s\S]*?)\s*```$/i);
  return `${(fenced?.[1] ?? trimmed).trim()}\n`;
}

async function loadStateSnapshot(workspaceDir: string): Promise<string> {
  const ledgers: Record<string, unknown> = {};
  for (const file of stateLedgerFiles) {
    const statePath = path.join(workspaceDir, "state", file);
    if (await pathExists(statePath)) {
      ledgers[file] = await loadStateLedger(workspaceDir, file);
    }
  }
  return JSON.stringify(ledgers, null, 2);
}

function renderRevisionPrompt(input: {
  chapterId: string;
  before: string;
  audit: ChapterAudit;
  selectedIssues: ChapterAuditIssue[];
  mode: RevisionMode;
  stateSnapshot: string;
  genrePrompt: string;
}): string {
  return `你是龙骨 Longgu 的 V0.5 章节定点修订器。请根据审计问题修订章节，只输出完整修订后的 Markdown 正文，不要解释。

修订模式：${input.mode}

模式要求：
- spot-fix：只修复审计指出的问题片段，避免整章重写。
- polish：润色表达和节奏，但不改变剧情事实。
- rewrite-scene：重写问题所在场景，保留章节目标和状态事实。
- rewrite-chapter：整章重写，但不得破坏状态账本和既有设定。

必须遵守：
- 不得修改状态账本事实。
- 不得引入与审计无关的大剧情改动。
- 修复后章节应保留 Markdown 正文格式。

状态账本约束：
${input.stateSnapshot}

类型卡修订约束：
${input.genrePrompt}

审计摘要：
${JSON.stringify(
  {
    chapterId: input.audit.chapterId,
    status: input.audit.status,
    scores: input.audit.scores,
    selectedIssues: input.selectedIssues
  },
  null,
  2
)}

当前章节 chapters/${input.chapterId}.md：
${input.before}

只输出完整修订后的 Markdown 正文：`;
}
