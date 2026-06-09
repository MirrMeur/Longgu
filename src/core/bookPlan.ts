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

export async function loadBookPlanDraft(filePath: string): Promise<BookPlanDraft> {
  const raw = await readFile(filePath, "utf8");
  return BookPlanDraftSchema.parse(JSON.parse(raw) as unknown);
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
