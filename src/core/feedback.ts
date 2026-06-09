import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const ChapterFeedbackEntrySchema = z.object({
  score: z.number().min(0).max(10),
  comment: z.string().min(1),
  createdAt: z.string().datetime()
});

export const ChapterFeedbackFileSchema = z.object({
  schemaVersion: z.literal("longgu.chapter-feedback.v0.10"),
  chapterId: z.string().min(1),
  entries: z.array(ChapterFeedbackEntrySchema).min(1),
  updatedAt: z.string().datetime()
});

export type ChapterFeedbackEntry = z.infer<typeof ChapterFeedbackEntrySchema>;
export type ChapterFeedbackFile = z.infer<typeof ChapterFeedbackFileSchema>;

export async function recordChapterFeedback(input: {
  workspaceDir: string;
  chapterId: string;
  score: number;
  comment: string;
  now?: Date;
}): Promise<{ feedback: ChapterFeedbackFile; outputPath: string }> {
  const outputDir = path.join(input.workspaceDir, "feedback");
  const outputPath = path.join(outputDir, `${input.chapterId}.feedback.json`);
  const now = (input.now ?? new Date()).toISOString();
  const existing = await loadFeedbackFile(outputPath, input.chapterId);
  const feedback = ChapterFeedbackFileSchema.parse({
    schemaVersion: "longgu.chapter-feedback.v0.10",
    chapterId: input.chapterId,
    entries: [
      ...existing,
      {
        score: input.score,
        comment: input.comment,
        createdAt: now
      }
    ],
    updatedAt: now
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(feedback, null, 2)}\n`, "utf8");
  return { feedback, outputPath };
}

export async function loadChapterFeedback(workspaceDir: string, chapterId: string): Promise<{ file: string; feedback: ChapterFeedbackFile }[]> {
  const feedbackDir = path.join(workspaceDir, "feedback");
  const entries = await readdir(feedbackDir).catch(() => []);
  const feedbackItems: { file: string; feedback: ChapterFeedbackFile }[] = [];
  for (const file of entries.filter((entry) => entry.endsWith(".feedback.json")).sort()) {
    const relative = path.join("feedback", file);
    const raw = await readFile(path.join(workspaceDir, relative), "utf8");
    const feedback = ChapterFeedbackFileSchema.parse(JSON.parse(raw) as unknown);
    if (feedback.chapterId.localeCompare(chapterId) <= 0) {
      feedbackItems.push({ file: relative, feedback });
    }
  }
  return feedbackItems;
}

async function loadFeedbackFile(filePath: string, chapterId: string): Promise<ChapterFeedbackEntry[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const feedback = ChapterFeedbackFileSchema.parse(JSON.parse(raw) as unknown);
    if (feedback.chapterId !== chapterId) {
      throw new Error(`Feedback chapterId mismatch: expected ${chapterId}, received ${feedback.chapterId}.`);
    }
    return feedback.entries;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
