import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  ChaptersPlanDraftSchema,
  VolumePlanDraftSchema,
  type ChaptersPlanDraft,
  type VolumePlanDraft
} from "./bookPlan.js";
import { loadLongguConfig } from "./config.js";
import { loadChapterFeedback } from "./feedback.js";
import { renderGenrePromptHints, resolveGenreCard } from "./genreCards.js";
import { loadStateLedger, stateLedgerFiles } from "./state.js";
import { loadBibleContext, pathExists } from "./workspace.js";

const contextPackSchemaVersion = z.literal("longgu.context-pack.v0.7");

export const ContextPrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const ContextSectionSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  reason: z.string().min(1),
  priority: ContextPrioritySchema,
  estimatedTokens: z.number().int().nonnegative(),
  included: z.boolean(),
  content: z.string()
});

export const ContextPackSchema = z.object({
  schemaVersion: contextPackSchemaVersion,
  chapterId: z.string().min(1),
  tokenBudget: z.number().int().positive(),
  estimatedTokens: z.number().int().nonnegative(),
  sections: z.array(ContextSectionSchema),
  includedSectionCount: z.number().int().nonnegative(),
  generatedAt: z.string().datetime()
});

export const ChapterSummarySchema = z
  .object({
    schemaVersion: z.string().optional(),
    chapterId: z.string().min(1),
    title: z.string().optional(),
    summary: z.string().optional(),
    generatedAt: z.string().datetime().optional()
  })
  .passthrough();

export type ContextPriority = z.infer<typeof ContextPrioritySchema>;
export type ContextSection = z.infer<typeof ContextSectionSchema>;
export type ContextPack = z.infer<typeof ContextPackSchema>;
export type ChapterSummary = z.infer<typeof ChapterSummarySchema>;

export interface BuildChapterContextResult {
  pack: ContextPack;
  jsonPath: string;
  markdownPath: string;
}

interface ContextCandidate {
  id: string;
  source: string;
  reason: string;
  priority: ContextPriority;
  content: string;
}

export async function buildChapterContext(input: {
  workspaceDir: string;
  chapterId: string;
  maxTokens?: number;
  now?: Date;
}): Promise<BuildChapterContextResult> {
  const config = await loadLongguConfig(input.workspaceDir);
  const tokenBudget = input.maxTokens ?? config.context?.maxTokens ?? 16000;
  if (!Number.isInteger(tokenBudget) || tokenBudget <= 0) {
    throw new Error("--max-tokens must be a positive integer.");
  }

  const candidates = await collectContextCandidates(input.workspaceDir, input.chapterId);
  const sections = applyTokenBudget(
    candidates.map((candidate) => ({
      ...candidate,
      estimatedTokens: estimateTokens(candidate.content),
      included: true
    })),
    tokenBudget
  );
  const pack = ContextPackSchema.parse({
    schemaVersion: "longgu.context-pack.v0.7",
    chapterId: input.chapterId,
    tokenBudget,
    estimatedTokens: sections.filter((section) => section.included).reduce((sum, section) => sum + section.estimatedTokens, 0),
    sections,
    includedSectionCount: sections.filter((section) => section.included).length,
    generatedAt: (input.now ?? new Date()).toISOString()
  });

  const outputDir = path.join(input.workspaceDir, "context");
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `${input.chapterId}.context.json`);
  const markdownPath = path.join(outputDir, `${input.chapterId}.context.md`);
  await writeFile(jsonPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderContextMarkdown(pack), "utf8");

  return { pack, jsonPath, markdownPath };
}

export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 2);
}

export function applyTokenBudget(sections: ContextSection[], tokenBudget: number): ContextSection[] {
  const next = sections.map((section) => ({ ...section }));
  const removablePriorities: ContextPriority[] = ["low", "medium", "high"];
  for (const priority of removablePriorities) {
    const candidates = next
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => section.included && section.priority === priority)
      .sort(
        (left, right) =>
          contextRetentionScore(left.section) - contextRetentionScore(right.section) ||
          right.section.estimatedTokens - left.section.estimatedTokens
      );

    for (const candidate of candidates) {
      if (includedTokens(next) <= tokenBudget) {
        return next;
      }
      next[candidate.index] = { ...candidate.section, included: false };
    }
  }
  return next;
}

function contextRetentionScore(section: ContextSection): number {
  let score = 0;
  if (section.id.startsWith("previous-chapter-")) {
    score += 30;
  }
  if (section.id.startsWith("feedback-")) {
    score += 25;
  }
  if (section.id.startsWith("summary-")) {
    score += 10;
  }
  if (/"status"\s*:\s*"(active|opened|delayed)"/.test(section.content)) {
    score += 20;
  }
  return score;
}

async function collectContextCandidates(workspaceDir: string, chapterId: string): Promise<ContextCandidate[]> {
  const config = await loadLongguConfig(workspaceDir);
  const chapterPlan = await findChapterPlan(workspaceDir, chapterId);
  const volumePlan = chapterPlan ? await findVolumePlan(workspaceDir, chapterPlan.plan.volumeId) : null;
  const summaries = await loadChapterSummaries(workspaceDir, chapterId);
  const previousChapters = await loadPreviousChapterBodies(workspaceDir, chapterId);
  const feedbackSections = await loadFeedbackSections(workspaceDir, chapterId);
  const bibleSections = await loadBibleSections(workspaceDir);
  const stateSections = await loadStateSections(workspaceDir);
  const styleSection = await loadStyleSection(workspaceDir);
  const genreCard = resolveGenreCard(config.genre);
  const candidates: ContextCandidate[] = [];

  if (chapterPlan) {
    candidates.push({
      id: "chapter-card",
      source: chapterPlan.file,
      reason: `当前章节 ${chapterId} 的章节卡，包含本章目标、冲突、爽点、信息增量和章尾钩子。`,
      priority: "critical",
      content: JSON.stringify(chapterPlan.chapter, null, 2)
    });
  }

  if (volumePlan) {
    candidates.push({
      id: "volume-plan",
      source: volumePlan.file,
      reason: `章节 ${chapterId} 属于分卷 ${volumePlan.plan.volumeId}，分卷目标用于约束本章推进方向。`,
      priority: "high",
      content: JSON.stringify(
        {
          volumeId: volumePlan.plan.volumeId,
          title: volumePlan.plan.title,
          volumeGoal: volumePlan.plan.volumeGoal,
          primaryAntagonist: volumePlan.plan.primaryAntagonist,
          conflictEscalation: volumePlan.plan.conflictEscalation,
          resourceChanges: volumePlan.plan.resourceChanges,
          keyPayoffs: volumePlan.plan.keyPayoffs,
          endingHook: volumePlan.plan.endingHook
        },
        null,
        2
      )
    });
  }

  candidates.push({
    id: "genre-card",
    source: `genre-cards/${genreCard.id}`,
    reason: `项目类型为 ${config.genre}，类型卡提供本章上下文筛选和写作约束。`,
    priority: "high",
    content: renderGenrePromptHints(genreCard)
  });

  if (styleSection) {
    candidates.push(styleSection);
  }

  candidates.push(...bibleSections);
  candidates.push(...stateSections);
  candidates.push(...summaries);
  candidates.push(...previousChapters);
  candidates.push(...feedbackSections);
  return candidates;
}

async function findChapterPlan(
  workspaceDir: string,
  chapterId: string
): Promise<{ file: string; plan: ChaptersPlanDraft; chapter: ChaptersPlanDraft["chapters"][number] } | null> {
  const outlinesDir = path.join(workspaceDir, "outlines");
  const entries = await readdir(outlinesDir).catch(() => []);
  for (const file of entries.filter((entry) => entry.startsWith("chapters-") && entry.endsWith(".draft.json")).sort()) {
    const relative = path.join("outlines", file);
    const raw = await readFile(path.join(workspaceDir, relative), "utf8");
    const plan = ChaptersPlanDraftSchema.parse(JSON.parse(raw) as unknown);
    const chapter = plan.chapters.find((entry) => entry.chapterId === chapterId);
    if (chapter) {
      return { file: relative, plan, chapter };
    }
  }
  return null;
}

async function findVolumePlan(
  workspaceDir: string,
  volumeId: string
): Promise<{ file: string; plan: VolumePlanDraft } | null> {
  const relative = path.join("outlines", `volume-${volumeId}.draft.json`);
  const filePath = path.join(workspaceDir, relative);
  if (!(await pathExists(filePath))) {
    return null;
  }
  const raw = await readFile(filePath, "utf8");
  return { file: relative, plan: VolumePlanDraftSchema.parse(JSON.parse(raw) as unknown) };
}

async function loadChapterSummaries(workspaceDir: string, chapterId: string): Promise<ContextCandidate[]> {
  const summariesDir = path.join(workspaceDir, "summaries");
  const entries = await readdir(summariesDir).catch(() => []);
  const summaries: { file: string; summary: ChapterSummary }[] = [];
  for (const file of entries.filter((entry) => entry.endsWith(".summary.json")).sort()) {
    const relative = path.join("summaries", file);
    const raw = await readFile(path.join(workspaceDir, relative), "utf8");
    const summary = ChapterSummarySchema.parse(JSON.parse(raw) as unknown);
    if (summary.chapterId !== chapterId) {
      summaries.push({ file: relative, summary });
    }
  }

  return summaries
    .sort((left, right) => compareSummaryRecency(right.summary, left.summary))
    .slice(0, 8)
    .map(({ file, summary }) => ({
      id: `summary-${summary.chapterId}`,
      source: file,
      reason: `历史章节 ${summary.chapterId} 的摘要，用于保持近期剧情连续性。`,
      priority: "low",
      content: JSON.stringify(summary, null, 2)
    }));
}

async function loadBibleSections(workspaceDir: string): Promise<ContextCandidate[]> {
  const bibleContext = await loadBibleContext(workspaceDir).catch(() => []);
  return bibleContext
    .filter((item) => item.file !== path.join("bible", "style.md"))
    .map((item) => ({
      id: `bible-${path.basename(item.file, ".md")}`,
      source: item.file,
      reason: `${item.file} 是 V0.1 基础项目资料，提供当前章节生成的底层设定。`,
      priority: "medium",
      content: item.content
    }));
}

async function loadPreviousChapterBodies(workspaceDir: string, chapterId: string): Promise<ContextCandidate[]> {
  const chaptersDir = path.join(workspaceDir, "chapters");
  const entries = await readdir(chaptersDir).catch(() => []);
  const chapters: { chapterId: string; file: string; content: string }[] = [];
  for (const file of entries
    .filter((entry) => entry.endsWith(".md"))
    .sort((left, right) => compareChapterIds(stripMarkdownExtension(left), stripMarkdownExtension(right)))) {
    const existingChapterId = file.slice(0, -".md".length);
    if (existingChapterId === chapterId || compareChapterIds(existingChapterId, chapterId) >= 0) {
      continue;
    }
    const relative = path.join("chapters", file);
    chapters.push({
      chapterId: existingChapterId,
      file: relative,
      content: await readFile(path.join(workspaceDir, relative), "utf8")
    });
  }

  return chapters
    .sort((left, right) => compareChapterIds(right.chapterId, left.chapterId))
    .slice(0, 2)
    .map((chapter) => ({
      id: `previous-chapter-${chapter.chapterId}`,
      source: chapter.file,
      reason: `历史章节 ${chapter.chapterId} 的正文，用于让当前章节从近期结尾自然衔接，避免重复开场。`,
      priority: "low",
      content: chapter.content
    }));
}

function stripMarkdownExtension(file: string): string {
  return file.slice(0, -".md".length);
}

function compareChapterIds(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  const leftParts = splitNaturalParts(left);
  const rightParts = splitNaturalParts(right);
  const length = Math.min(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index];
    const rightPart = rightParts[index];
    const bothNumeric = leftPart.kind === "number" && rightPart.kind === "number";
    if (bothNumeric && leftPart.value !== rightPart.value) {
      return leftPart.value - rightPart.value;
    }
    if (!bothNumeric && leftPart.raw !== rightPart.raw) {
      return leftPart.raw.localeCompare(rightPart.raw);
    }
  }

  if (leftParts.length !== rightParts.length) {
    return leftParts.length - rightParts.length;
  }
  return left.localeCompare(right);
}

function splitNaturalParts(input: string): { kind: "number" | "text"; raw: string; value: number }[] {
  return (input.match(/\d+|\D+/g) ?? [input]).map((raw) => {
    if (/^\d+$/.test(raw)) {
      return { kind: "number", raw, value: Number(raw) };
    }
    return { kind: "text", raw, value: Number.NaN };
  });
}

async function loadFeedbackSections(workspaceDir: string, chapterId: string): Promise<ContextCandidate[]> {
  const feedbackItems = await loadChapterFeedback(workspaceDir, chapterId);
  return feedbackItems.slice(-5).map(({ file, feedback }) => ({
    id: `feedback-${feedback.chapterId}`,
    source: file,
    reason: `章节 ${feedback.chapterId} 的人工反馈，用于避免重复质量问题并延续用户偏好。`,
    priority: "medium",
    content: JSON.stringify(feedback, null, 2)
  }));
}

async function loadStateSections(workspaceDir: string): Promise<ContextCandidate[]> {
  const sections: ContextCandidate[] = [];
  for (const file of stateLedgerFiles) {
    const statePath = path.join(workspaceDir, "state", file);
    if (!(await pathExists(statePath))) {
      continue;
    }
    const ledger = await loadStateLedger(workspaceDir, file);
    sections.push({
      id: `state-${ledger.ledger}`,
      source: path.join("state", file),
      reason: `${ledger.ledger} 状态账本是长篇一致性的硬约束，不能因预算裁剪丢失。`,
      priority: "critical",
      content: JSON.stringify(ledger, null, 2)
    });
  }
  return sections;
}

async function loadStyleSection(workspaceDir: string): Promise<ContextCandidate | null> {
  const relative = path.join("bible", "style.md");
  const filePath = path.join(workspaceDir, relative);
  if (!(await pathExists(filePath))) {
    return null;
  }
  return {
    id: "style-constraints",
    source: relative,
    reason: "项目文风约束用于限制本章表达、叙事视角和禁用表达。",
    priority: "medium",
    content: await readFile(filePath, "utf8")
  };
}

function compareSummaryRecency(left: ChapterSummary, right: ChapterSummary): number {
  const leftTime = left.generatedAt ? Date.parse(left.generatedAt) : 0;
  const rightTime = right.generatedAt ? Date.parse(right.generatedAt) : 0;
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return left.chapterId.localeCompare(right.chapterId);
}

function renderContextMarkdown(pack: ContextPack): string {
  const included = pack.sections.filter((section) => section.included);
  const sections = included.length
    ? included
        .map(
          (section) => `## ${section.id}

- Source: ${section.source}
- Priority: ${section.priority}
- Reason: ${section.reason}
- Estimated tokens: ${section.estimatedTokens}

\`\`\`text
${section.content.trim()}
\`\`\``
        )
        .join("\n\n")
    : "No context sections included.";

  return `# Context Pack ${pack.chapterId}

- Schema: ${pack.schemaVersion}
- Token budget: ${pack.tokenBudget}
- Estimated tokens: ${pack.estimatedTokens}
- Included sections: ${pack.includedSectionCount}/${pack.sections.length}
- Generated at: ${pack.generatedAt}

${sections}
`;
}

function includedTokens(sections: ContextSection[]): number {
  return sections.filter((section) => section.included).reduce((sum, section) => sum + section.estimatedTokens, 0);
}
