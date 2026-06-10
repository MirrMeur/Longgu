import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { loadBibleContext } from "./workspace.js";

const pacingSchemaVersion = z.literal("longgu.pacing.v0.11");

export const ChapterPacingSchema = z.object({
  chapterId: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  dialogueDensity: z.number().min(0).max(1),
  actionDensity: z.number().min(0).max(1),
  descriptionDensity: z.number().min(0).max(1),
  emotionalIntensity: z.number().min(0).max(10),
  hasCliffhanger: z.boolean(),
  payoffCueCount: z.number().int().nonnegative(),
  cpScreentime: z.number().int().nonnegative()
});

export const PacingReportSchema = z.object({
  schemaVersion: pacingSchemaVersion,
  chapterIds: z.array(z.string().min(1)),
  cliffhangerDensity: z.number().min(0).max(1),
  emotionalCurve: z.array(z.object({ chapterId: z.string().min(1), intensity: z.number().min(0).max(10) })),
  payoffInterval: z.number().nullable(),
  fatigueRisk: z.array(z.string()),
  cpScreentime: z.array(z.object({ chapterId: z.string().min(1), sceneCount: z.number().int().nonnegative() })),
  chapters: z.array(ChapterPacingSchema),
  generatedAt: z.string().datetime()
});

export type ChapterPacing = z.infer<typeof ChapterPacingSchema>;
export type PacingReport = z.infer<typeof PacingReportSchema>;

export async function analyzePacing(input: {
  workspaceDir: string;
  from: string;
  to: string;
  now?: Date;
}): Promise<{ report: PacingReport; jsonPath: string; markdownPath: string }> {
  const chapterIds = await resolveChapterRange(input.workspaceDir, input.from, input.to);
  const characterNames = await loadCharacterNames(input.workspaceDir);
  const chapters: ChapterPacing[] = [];
  for (const chapterId of chapterIds) {
    const text = await readFile(path.join(input.workspaceDir, "chapters", `${chapterId}.md`), "utf8");
    chapters.push(analyzeChapterPacing(chapterId, text, characterNames));
  }
  const payoffChapters = chapters.map((chapter, index) => (chapter.payoffCueCount > 0 ? index : -1)).filter((index) => index >= 0);
  const payoffInterval =
    payoffChapters.length < 2
      ? null
      : payoffChapters.slice(1).reduce((sum, index, offset) => sum + index - payoffChapters[offset], 0) /
        (payoffChapters.length - 1);
  const report = PacingReportSchema.parse({
    schemaVersion: "longgu.pacing.v0.11",
    chapterIds,
    cliffhangerDensity: chapters.length ? chapters.filter((chapter) => chapter.hasCliffhanger).length / chapters.length : 0,
    emotionalCurve: chapters.map((chapter) => ({ chapterId: chapter.chapterId, intensity: chapter.emotionalIntensity })),
    payoffInterval,
    fatigueRisk: detectFatigueRisk(chapters),
    cpScreentime: chapters.map((chapter) => ({ chapterId: chapter.chapterId, sceneCount: chapter.cpScreentime })),
    chapters,
    generatedAt: (input.now ?? new Date()).toISOString()
  });
  const outputDir = path.join(input.workspaceDir, "pacing");
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `${input.from}-${input.to}.pacing.json`);
  const markdownPath = path.join(outputDir, `${input.from}-${input.to}.pacing.md`);
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, renderPacingMarkdown(report), "utf8");
  return { report, jsonPath, markdownPath };
}

export function analyzeChapterPacing(chapterId: string, text: string, characterNames: string[] = []): ChapterPacing {
  const body = stripHeading(text);
  const wordCount = countWords(body);
  const dialogueChars = totalMatchLength(body, /[「“][^」”]{1,160}[」”]/gu);
  const actionChars = totalMatchLength(body, /(冲|杀|撞|夺|追|逃|砸|斩|扣住|推开|逼近|站起|转身)/gu);
  const descriptionChars = totalMatchLength(body, /(看见|望着|仿佛|像是|沉默|心里|想起|意识到|空气|夜色|屋内)/gu);
  const dialogueDensity = ratio(dialogueChars, Math.max(body.length, 1));
  const actionDensity = ratio(actionChars * 8, Math.max(body.length, 1));
  const descriptionDensity = ratio(descriptionChars * 8, Math.max(body.length, 1));
  const emotionalIntensity = clamp(Math.round((dialogueDensity * 25 + actionDensity * 35 + payoffCueCount(body) * 1.2 + cliffhangerScore(body)) * 10) / 10);
  return ChapterPacingSchema.parse({
    chapterId,
    wordCount,
    dialogueDensity,
    actionDensity,
    descriptionDensity,
    emotionalIntensity,
    hasCliffhanger: cliffhangerScore(body) > 0,
    payoffCueCount: payoffCueCount(body),
    cpScreentime: countCpScenes(body, characterNames)
  });
}

async function resolveChapterRange(workspaceDir: string, from: string, to: string): Promise<string[]> {
  const chaptersDir = path.join(workspaceDir, "chapters");
  const entries = (await readdir(chaptersDir).catch(() => []))
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => entry.slice(0, -".md".length))
    .filter((id) => compareChapterIds(id, from) >= 0 && compareChapterIds(id, to) <= 0)
    .sort(compareChapterIds);
  if (entries.length === 0) {
    throw new Error(`No chapters found between ${from} and ${to}.`);
  }
  return entries;
}

async function loadCharacterNames(workspaceDir: string): Promise<string[]> {
  const context = await loadBibleContext(workspaceDir).catch(() => []);
  const characters = context.find((item) => item.file.endsWith("characters.md"))?.content ?? "";
  return [...new Set(characters.match(/[\u4e00-\u9fa5]{2,4}/gu) ?? [])].slice(0, 8);
}

function countCpScenes(text: string, characterNames: string[]): number {
  if (characterNames.length < 2) {
    return 0;
  }
  const [left, right] = characterNames;
  return text.split(/\n\s*\n/).filter((scene) => scene.includes(left) && scene.includes(right)).length;
}

function detectFatigueRisk(chapters: ChapterPacing[]): string[] {
  const risks: string[] = [];
  for (let index = 2; index < chapters.length; index += 1) {
    const window = chapters.slice(index - 2, index + 1);
    if (window.every((chapter) => chapter.emotionalIntensity >= 8)) {
      risks.push(`${window.map((chapter) => chapter.chapterId).join(", ")} 连续高强度，可能缺少喘息场。`);
    }
    if (window.every((chapter) => chapter.emotionalIntensity <= 3)) {
      risks.push(`${window.map((chapter) => chapter.chapterId).join(", ")} 连续低强度，可能缺少推进和爽点。`);
    }
  }
  return risks;
}

function renderPacingMarkdown(report: PacingReport): string {
  const rows = report.chapters
    .map(
      (chapter) =>
        `| ${chapter.chapterId} | ${chapter.wordCount} | ${chapter.emotionalIntensity} | ${chapter.hasCliffhanger ? "yes" : "no"} | ${chapter.payoffCueCount} | ${chapter.cpScreentime} |`
    )
    .join("\n");
  return `# Pacing Report ${report.chapterIds[0]}-${report.chapterIds.at(-1)}

- Cliffhanger density: ${report.cliffhangerDensity.toFixed(2)}
- Payoff interval: ${report.payoffInterval === null ? "n/a" : report.payoffInterval.toFixed(2)}
- Fatigue risks: ${report.fatigueRisk.length}

| Chapter | Words | Emotion | Cliffhanger | Payoff Cues | CP Scenes |
| --- | ---: | ---: | --- | ---: | ---: |
${rows}

## Fatigue Risk

${report.fatigueRisk.length ? report.fatigueRisk.map((risk) => `- ${risk}`).join("\n") : "- None."}
`;
}

function stripHeading(text: string): string {
  return text.replace(/^#.*$/gm, "").trim();
}

function countWords(text: string): number {
  return (text.match(/[\u4e00-\u9fff]/gu)?.length ?? 0) + (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0);
}

function cliffhangerScore(text: string): number {
  const tail = text.slice(-300);
  return /(？|\?|忽然|竟然|下一刻|门外|身后|黑影|真相|代价|来不及|没想到|亮起|裂开|封场)/u.test(tail) ? 1 : 0;
}

function payoffCueCount(text: string): number {
  return text.match(/(打脸|反转|赢|夺回|突破|晋升|奖励|兑现|真相|跪下|震住|压住|扬名|翻盘)/gu)?.length ?? 0;
}

function totalMatchLength(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].reduce((sum, match) => sum + match[0].length, 0);
}

function ratio(value: number, total: number): number {
  return Math.max(0, Math.min(1, value / total));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(10, value));
}

function compareChapterIds(left: string, right: string): number {
  const leftParts = left.match(/\d+|\D+/g) ?? [left];
  const rightParts = right.match(/\d+|\D+/g) ?? [right];
  const length = Math.min(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index];
    const rightPart = rightParts[index];
    if (/^\d+$/.test(leftPart) && /^\d+$/.test(rightPart)) {
      const diff = Number(leftPart) - Number(rightPart);
      if (diff !== 0) {
        return diff;
      }
    } else if (leftPart !== rightPart) {
      return leftPart.localeCompare(rightPart);
    }
  }
  return leftParts.length - rightParts.length || left.localeCompare(right);
}
