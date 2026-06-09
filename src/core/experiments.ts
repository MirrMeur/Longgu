import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ChapterAuditSchema } from "./audit.js";
import type { LongguConfig } from "./config.js";
import { loadLongguConfig } from "./config.js";
import { runRoutedTextGeneration, type GenerateTextFn } from "./modelExecution.js";
import type { RunMetadata } from "./runs.js";
import { pathExists } from "./workspace.js";

const experimentSchemaVersion = z.literal("longgu.experiment.v0.9");
const variantSchemaVersion = z.literal("longgu.experiment-variant.v0.9");
const scoreSchemaVersion = z.literal("longgu.experiment-score.v0.9");
const compareSchemaVersion = z.literal("longgu.experiment-compare.v0.9");

export const ExperimentSortKeySchema = z.enum(["payoff", "hook", "ai-flavor", "setting-conflict", "cost"]);

export const ExperimentManifestSchema = z.object({
  schemaVersion: experimentSchemaVersion,
  id: z.string().min(1),
  goal: z.string().min(1),
  createdAt: z.string().datetime(),
  variants: z.array(z.string().min(1)).default([])
});

export const ExperimentVariantMetadataSchema = z.object({
  schemaVersion: variantSchemaVersion,
  experimentId: z.string().min(1),
  variantId: z.string().min(1),
  modelProfile: z.string().min(1).default("manual"),
  sourceInput: z.string().min(1),
  outputFile: z.literal("output.md"),
  registeredAt: z.string().datetime(),
  runId: z.string().min(1).optional(),
  auditFile: z.string().min(1).optional(),
  estimatedCost: z.number().min(0).optional()
});

export const ExperimentScoreSchema = z.object({
  schemaVersion: scoreSchemaVersion,
  payoff: z.number().min(0).max(10),
  hook: z.number().min(0).max(10),
  aiFlavor: z.number().min(0).max(10),
  settingConflict: z.number().min(0).max(10).default(0),
  note: z.string().default(""),
  scoredAt: z.string().datetime()
});

export const ExperimentCompareItemSchema = z.object({
  variantId: z.string().min(1),
  modelProfile: z.string().min(1),
  outputFile: z.string().min(1),
  payoff: z.number().min(0).max(10).optional(),
  hook: z.number().min(0).max(10).optional(),
  aiFlavor: z.number().min(0).max(10).optional(),
  settingConflict: z.number().min(0).max(10).optional(),
  auditRetention: z.number().min(0).max(10).optional(),
  auditAiFlavor: z.number().min(0).max(10).optional(),
  issueCount: z.number().int().nonnegative().optional(),
  criticalCount: z.number().int().nonnegative().optional(),
  estimatedCost: z.number().min(0).optional(),
  note: z.string().optional()
});

export const ExperimentCompareSchema = z.object({
  schemaVersion: compareSchemaVersion,
  experimentId: z.string().min(1),
  sort: ExperimentSortKeySchema,
  generatedAt: z.string().datetime(),
  variants: z.array(ExperimentCompareItemSchema)
});

export type ExperimentSortKey = z.infer<typeof ExperimentSortKeySchema>;
export type ExperimentManifest = z.infer<typeof ExperimentManifestSchema>;
export type ExperimentVariantMetadata = z.infer<typeof ExperimentVariantMetadataSchema>;
export type ExperimentScore = z.infer<typeof ExperimentScoreSchema>;
export type ExperimentCompare = z.infer<typeof ExperimentCompareSchema>;

export async function createExperiment(input: {
  workspaceDir: string;
  id: string;
  goal: string;
  now?: Date;
}): Promise<{ manifest: ExperimentManifest; manifestPath: string }> {
  const experimentId = normalizeExperimentId(input.id);
  const manifestPath = path.join(input.workspaceDir, "experiments", experimentId, "manifest.json");
  if (await pathExists(manifestPath)) {
    throw new Error(`Experiment already exists: experiments/${experimentId}/manifest.json`);
  }

  const manifest = ExperimentManifestSchema.parse({
    schemaVersion: "longgu.experiment.v0.9",
    id: experimentId,
    goal: input.goal,
    createdAt: (input.now ?? new Date()).toISOString(),
    variants: []
  });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeJson(manifestPath, manifest);
  return { manifest, manifestPath };
}

export async function registerExperimentVariant(input: {
  workspaceDir: string;
  experimentId: string;
  variantId: string;
  inputPath: string;
  modelProfile?: string;
  runId?: string;
  auditFile?: string;
  estimatedCost?: number;
  now?: Date;
}): Promise<{ metadata: ExperimentVariantMetadata; variantDir: string; outputPath: string; metadataPath: string }> {
  const experimentId = normalizeExperimentId(input.experimentId);
  const variantId = normalizeExperimentId(input.variantId);
  const manifest = await loadManifest(input.workspaceDir, experimentId);
  const variantDir = path.join(input.workspaceDir, "experiments", experimentId, "variants", variantId);
  const outputPath = path.join(variantDir, "output.md");
  const metadataPath = path.join(variantDir, "metadata.json");
  const sourcePath = path.isAbsolute(input.inputPath) ? input.inputPath : path.join(input.workspaceDir, input.inputPath);
  if (!(await pathExists(sourcePath))) {
    throw new Error(`Experiment variant input not found: ${input.inputPath}`);
  }

  await mkdir(variantDir, { recursive: true });
  await copyFile(sourcePath, outputPath);
  const metadata = ExperimentVariantMetadataSchema.parse({
    schemaVersion: "longgu.experiment-variant.v0.9",
    experimentId,
    variantId,
    modelProfile: input.modelProfile ?? "manual",
    sourceInput: path.relative(input.workspaceDir, sourcePath),
    outputFile: "output.md",
    registeredAt: (input.now ?? new Date()).toISOString(),
    runId: input.runId,
    auditFile: input.auditFile,
    estimatedCost: input.estimatedCost
  });
  await writeJson(metadataPath, metadata);

  if (!manifest.variants.includes(variantId)) {
    manifest.variants.push(variantId);
    manifest.variants.sort();
    await writeJson(path.join(input.workspaceDir, "experiments", experimentId, "manifest.json"), manifest);
  }

  return { metadata, variantDir, outputPath, metadataPath };
}

export async function generateExperimentVariant(input: {
  workspaceDir: string;
  experimentId: string;
  variantId: string;
  promptPath: string;
  config?: LongguConfig;
  apiKey?: string;
  readApiKey?: (envName: string) => string;
  generate: GenerateTextFn;
  now?: Date;
}): Promise<{ metadata: ExperimentVariantMetadata; variantDir: string; outputPath: string; metadataPath: string; runDir: string }> {
  const experimentId = normalizeExperimentId(input.experimentId);
  const variantId = normalizeExperimentId(input.variantId);
  const manifest = await loadManifest(input.workspaceDir, experimentId);
  const promptPath = path.isAbsolute(input.promptPath) ? input.promptPath : path.join(input.workspaceDir, input.promptPath);
  if (!(await pathExists(promptPath))) {
    throw new Error(`Experiment prompt not found: ${input.promptPath}`);
  }
  const prompt = await readFile(promptPath, "utf8");
  const config = input.config ?? (await loadLongguConfig(input.workspaceDir));
  const run = await runRoutedTextGeneration({
    workspaceDir: input.workspaceDir,
    task: "experiment",
    subjectId: `experiment-${experimentId}-${variantId}`,
    config,
    prompt,
    context: [{ file: path.relative(input.workspaceDir, promptPath), content: prompt }],
    apiKey: input.apiKey,
    readApiKey: input.readApiKey,
    generate: input.generate,
    startedAt: input.now
  });

  const variantDir = path.join(input.workspaceDir, "experiments", experimentId, "variants", variantId);
  const outputPath = path.join(variantDir, "output.md");
  const metadataPath = path.join(variantDir, "metadata.json");
  await mkdir(variantDir, { recursive: true });
  await writeFile(outputPath, normalizeMarkdown(run.text), "utf8");
  const metadata = ExperimentVariantMetadataSchema.parse({
    schemaVersion: "longgu.experiment-variant.v0.9",
    experimentId,
    variantId,
    modelProfile: run.modelProfile,
    sourceInput: path.relative(input.workspaceDir, promptPath),
    outputFile: "output.md",
    registeredAt: (input.now ?? new Date()).toISOString(),
    runId: run.runId,
    estimatedCost: run.metadata.estimatedCost
  });
  await writeJson(metadataPath, metadata);

  if (!manifest.variants.includes(variantId)) {
    manifest.variants.push(variantId);
    manifest.variants.sort();
    await writeJson(path.join(input.workspaceDir, "experiments", experimentId, "manifest.json"), manifest);
  }

  return { metadata, variantDir, outputPath, metadataPath, runDir: run.runDir };
}

export async function scoreExperimentVariant(input: {
  workspaceDir: string;
  experimentId: string;
  variantId: string;
  payoff: number;
  hook: number;
  aiFlavor: number;
  settingConflict?: number;
  note?: string;
  now?: Date;
}): Promise<{ score: ExperimentScore; scorePath: string }> {
  const experimentId = normalizeExperimentId(input.experimentId);
  const variantId = normalizeExperimentId(input.variantId);
  const variantDir = path.join(input.workspaceDir, "experiments", experimentId, "variants", variantId);
  if (!(await pathExists(path.join(variantDir, "metadata.json")))) {
    throw new Error(`Experiment variant metadata not found: experiments/${experimentId}/variants/${variantId}/metadata.json`);
  }

  const score = ExperimentScoreSchema.parse({
    schemaVersion: "longgu.experiment-score.v0.9",
    payoff: input.payoff,
    hook: input.hook,
    aiFlavor: input.aiFlavor,
    settingConflict: input.settingConflict ?? 0,
    note: input.note ?? "",
    scoredAt: (input.now ?? new Date()).toISOString()
  });
  const scorePath = path.join(variantDir, "scores.json");
  await writeJson(scorePath, score);
  return { score, scorePath };
}

export async function compareExperiment(input: {
  workspaceDir: string;
  experimentId: string;
  sort?: ExperimentSortKey;
  now?: Date;
}): Promise<{ compare: ExperimentCompare; jsonPath: string; markdownPath: string }> {
  const experimentId = normalizeExperimentId(input.experimentId);
  const manifest = await loadManifest(input.workspaceDir, experimentId);
  const variants = await Promise.all(
    manifest.variants.map((variantId) => loadCompareItem(input.workspaceDir, experimentId, variantId))
  );
  const sort = input.sort ?? "hook";
  const compare = ExperimentCompareSchema.parse({
    schemaVersion: "longgu.experiment-compare.v0.9",
    experimentId,
    sort,
    generatedAt: (input.now ?? new Date()).toISOString(),
    variants: variants.sort((left, right) => compareItems(left, right, sort))
  });
  const experimentDir = path.join(input.workspaceDir, "experiments", experimentId);
  const jsonPath = path.join(experimentDir, "compare.json");
  const markdownPath = path.join(experimentDir, "compare.md");
  await writeJson(jsonPath, compare);
  await writeFile(markdownPath, renderCompareMarkdown(compare), "utf8");
  return { compare, jsonPath, markdownPath };
}

async function loadManifest(workspaceDir: string, experimentId: string): Promise<ExperimentManifest> {
  const manifestPath = path.join(workspaceDir, "experiments", experimentId, "manifest.json");
  const raw = await readFile(manifestPath, "utf8");
  return ExperimentManifestSchema.parse(JSON.parse(raw) as unknown);
}

async function loadCompareItem(
  workspaceDir: string,
  experimentId: string,
  variantId: string
): Promise<z.infer<typeof ExperimentCompareItemSchema>> {
  const variantDir = path.join(workspaceDir, "experiments", experimentId, "variants", variantId);
  const metadata = ExperimentVariantMetadataSchema.parse(
    JSON.parse(await readFile(path.join(variantDir, "metadata.json"), "utf8")) as unknown
  );
  const score = await readOptionalJson(path.join(variantDir, "scores.json"), ExperimentScoreSchema);
  const audit = metadata.auditFile
    ? await readOptionalJson(path.join(workspaceDir, metadata.auditFile), ChapterAuditSchema)
    : undefined;
  const run = metadata.runId ? await readRunMetadata(workspaceDir, metadata.runId) : undefined;
  return ExperimentCompareItemSchema.parse({
    variantId,
    modelProfile: metadata.modelProfile,
    outputFile: path.join("experiments", experimentId, "variants", variantId, metadata.outputFile),
    payoff: score?.payoff,
    hook: score?.hook,
    aiFlavor: score?.aiFlavor,
    settingConflict: score?.settingConflict,
    auditRetention: audit?.scores.retention,
    auditAiFlavor: audit?.scores.aiFlavor,
    issueCount: audit?.issues.length,
    criticalCount: audit?.issues.filter((issue) => issue.severity === "critical").length,
    estimatedCost: metadata.estimatedCost ?? run?.estimatedCost,
    note: score?.note
  });
}

async function readRunMetadata(workspaceDir: string, runId: string): Promise<RunMetadata | undefined> {
  return readOptionalJson(path.join(workspaceDir, "runs", runId, "metadata.json"), z.custom<RunMetadata>());
}

async function readOptionalJson<T extends z.ZodType>(filePath: string, schema: T): Promise<z.infer<T> | undefined> {
  if (!(await pathExists(filePath))) {
    return undefined;
  }
  const raw = await readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw) as unknown);
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function compareItems(
  left: z.infer<typeof ExperimentCompareItemSchema>,
  right: z.infer<typeof ExperimentCompareItemSchema>,
  sort: ExperimentSortKey
): number {
  const leftValue = sortValue(left, sort);
  const rightValue = sortValue(right, sort);
  if (leftValue !== rightValue) {
    return sort === "ai-flavor" || sort === "setting-conflict" || sort === "cost"
      ? leftValue - rightValue
      : rightValue - leftValue;
  }
  return left.variantId.localeCompare(right.variantId);
}

function sortValue(item: z.infer<typeof ExperimentCompareItemSchema>, sort: ExperimentSortKey): number {
  switch (sort) {
    case "payoff":
      return item.payoff ?? -1;
    case "hook":
      return item.hook ?? -1;
    case "ai-flavor":
      return item.aiFlavor ?? Number.POSITIVE_INFINITY;
    case "setting-conflict":
      return item.settingConflict ?? item.criticalCount ?? Number.POSITIVE_INFINITY;
    case "cost":
      return item.estimatedCost ?? Number.POSITIVE_INFINITY;
  }
}

function renderCompareMarkdown(compare: ExperimentCompare): string {
  const rows = compare.variants
    .map(
      (item) =>
        `| ${item.variantId} | ${item.modelProfile} | ${formatNumber(item.payoff)} | ${formatNumber(item.hook)} | ${formatNumber(item.aiFlavor)} | ${formatNumber(item.settingConflict)} | ${formatNumber(item.estimatedCost)} | ${item.note ?? ""} |`
    )
    .join("\n");
  return `# Experiment Compare ${compare.experimentId}

- Sort: ${compare.sort}
- Generated at: ${compare.generatedAt}

| Variant | Model | Payoff | Hook | AI Flavor | Setting Conflict | Cost | Note |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
${rows || "| n/a | n/a | n/a | n/a | n/a | n/a | n/a | |"}
`;
}

function normalizeExperimentId(value: string): string {
  const id = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) {
    throw new Error("Experiment id must contain only letters, numbers, underscores, or hyphens.");
  }
  return id;
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? "n/a" : String(value);
}

function normalizeMarkdown(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:md|markdown)?\s*([\s\S]*?)\s*```$/i);
  return `${(fenced?.[1] ?? trimmed).trim()}\n`;
}
