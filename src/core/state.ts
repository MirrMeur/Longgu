import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { LongguConfig } from "./config.js";
import { pathExists } from "./workspace.js";

const schemaVersion = z.literal("longgu.story-state.v0.3");
const stateDeltaSchemaVersion = z.literal("longgu.state-delta.v0.3");

const datedLedger = {
  schemaVersion,
  updatedAt: z.string().datetime()
};

const FactSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  sourceChapterId: z.string().optional()
});

const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()),
  status: z.string(),
  location: z.string(),
  goals: z.array(z.string()),
  relationships: z.array(
    z.object({
      targetId: z.string().min(1),
      relation: z.string().min(1)
    })
  )
});

const TimelineEventSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  order: z.number().int().nonnegative(),
  summary: z.string().min(1)
});

const HookSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  status: z.enum(["opened", "mentioned", "delayed", "resolved"]),
  openedInChapterId: z.string().optional(),
  resolvedInChapterId: z.string().optional()
});

const ReaderPromiseSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  status: z.enum(["active", "paid-off", "broken"]),
  sourceChapterId: z.string().optional()
});

const ResourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ownerCharacterId: z.string().optional(),
  quantity: z.string(),
  state: z.string()
});

export const TruthLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("truth"),
  facts: z.array(FactSchema)
});

export const CharactersLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("characters"),
  characters: z.array(CharacterSchema)
});

export const TimelineLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("timeline"),
  events: z.array(TimelineEventSchema)
});

export const HooksLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("hooks"),
  hooks: z.array(HookSchema)
});

export const ReaderPromisesLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("reader-promises"),
  promises: z.array(ReaderPromiseSchema)
});

export const ResourcesLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("resources"),
  resources: z.array(ResourceSchema)
});

export const StateDeltaSchema = z
  .object({
    schemaVersion: stateDeltaSchemaVersion,
    chapterId: z.string().min(1),
    facts: z.array(FactSchema).default([]),
    characters: z.array(CharacterSchema).default([]),
    timelineEvents: z.array(TimelineEventSchema).default([]),
    hooks: z.array(HookSchema).default([]),
    readerPromises: z.array(ReaderPromiseSchema).default([]),
    resources: z.array(ResourceSchema).default([])
  })
  .superRefine((delta, ctx) => {
    rejectDuplicateIds(delta.facts, "facts", ctx);
    rejectDuplicateIds(delta.characters, "characters", ctx);
    rejectDuplicateIds(delta.timelineEvents, "timelineEvents", ctx);
    rejectDuplicateIds(delta.hooks, "hooks", ctx);
    rejectDuplicateIds(delta.readerPromises, "readerPromises", ctx);
    rejectDuplicateIds(delta.resources, "resources", ctx);
  });

export type TruthLedger = z.infer<typeof TruthLedgerSchema>;
export type CharactersLedger = z.infer<typeof CharactersLedgerSchema>;
export type TimelineLedger = z.infer<typeof TimelineLedgerSchema>;
export type HooksLedger = z.infer<typeof HooksLedgerSchema>;
export type ReaderPromisesLedger = z.infer<typeof ReaderPromisesLedgerSchema>;
export type ResourcesLedger = z.infer<typeof ResourcesLedgerSchema>;
export type StateDelta = z.infer<typeof StateDeltaSchema>;

export type StateLedger =
  | TruthLedger
  | CharactersLedger
  | TimelineLedger
  | HooksLedger
  | ReaderPromisesLedger
  | ResourcesLedger;

export const stateLedgerFiles = [
  "truth.json",
  "characters.json",
  "timeline.json",
  "hooks.json",
  "reader-promises.json",
  "resources.json"
] as const;

export interface StateInspectionEntry {
  file: (typeof stateLedgerFiles)[number];
  ledger: StateLedger["ledger"];
  count: number;
  updatedAt: string;
}

export interface LedgerDiff {
  ledger: StateLedger["ledger"];
  added: string[];
  updated: string[];
  unchanged: string[];
}

export interface StateSettlementMetadata {
  schemaVersion: "longgu.state-settlement.v0.3";
  chapterId: string;
  settledAt: string;
  deltaSource: "file" | "model";
  deltaFile?: string;
  provider?: string;
  model?: string;
  settlementDir: string;
}

export interface StateSettlementResult {
  settlementDir: string;
  diff: LedgerDiff[];
  metadata: StateSettlementMetadata;
}

export type GenerateStateDeltaFn = (request: {
  prompt: string;
  config: LongguConfig;
  apiKey: string;
}) => Promise<{ text: string }>;

export async function initStateLedgers(input: {
  workspaceDir: string;
  force?: boolean;
  now?: Date;
}): Promise<{ created: string[]; overwritten: string[]; outputDir: string }> {
  const outputDir = path.join(input.workspaceDir, "state");
  const existing = await existingLedgerFiles(outputDir);
  if (existing.length > 0 && !input.force) {
    throw new Error(`State ledgers already exist. Re-run with --force to replace: ${existing.join(", ")}.`);
  }

  const ledgers = createBaselineLedgers(input.now ?? new Date());
  await mkdir(outputDir, { recursive: true });

  const created: string[] = [];
  const overwritten: string[] = [];
  for (const [file, ledger] of ledgers) {
    const targetPath = path.join(outputDir, file);
    const existed = await pathExists(targetPath);
    await writeFile(targetPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
    if (existed) {
      overwritten.push(path.join("state", file));
    } else {
      created.push(path.join("state", file));
    }
  }

  return { created, overwritten, outputDir };
}

export async function inspectState(workspaceDir: string): Promise<StateInspectionEntry[]> {
  const entries: StateInspectionEntry[] = [];
  for (const file of stateLedgerFiles) {
    const ledger = await loadStateLedger(workspaceDir, file);
    entries.push({
      file,
      ledger: ledger.ledger,
      count: ledgerItemCount(ledger),
      updatedAt: ledger.updatedAt
    });
  }
  return entries;
}

export async function loadStateLedger(workspaceDir: string, file: (typeof stateLedgerFiles)[number]): Promise<StateLedger> {
  const raw = await readFile(path.join(workspaceDir, "state", file), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  switch (file) {
    case "truth.json":
      return TruthLedgerSchema.parse(parsed);
    case "characters.json":
      return CharactersLedgerSchema.parse(parsed);
    case "timeline.json":
      return TimelineLedgerSchema.parse(parsed);
    case "hooks.json":
      return HooksLedgerSchema.parse(parsed);
    case "reader-promises.json":
      return ReaderPromisesLedgerSchema.parse(parsed);
    case "resources.json":
      return ResourcesLedgerSchema.parse(parsed);
  }
}

export async function loadStateDelta(deltaPath: string): Promise<StateDelta> {
  const raw = await readFile(deltaPath, "utf8");
  return StateDeltaSchema.parse(JSON.parse(raw) as unknown);
}

export async function settleChapterState(input: {
  workspaceDir: string;
  chapterId: string;
  deltaPath?: string;
  config?: LongguConfig;
  apiKey?: string;
  generate?: GenerateStateDeltaFn;
  now?: Date;
}): Promise<StateSettlementResult> {
  const chapterPath = path.join(input.workspaceDir, "chapters", `${input.chapterId}.md`);
  if (!(await pathExists(chapterPath))) {
    throw new Error(`Chapter body is required before settlement: chapters/${input.chapterId}.md`);
  }

  const before = await loadAllStateLedgers(input.workspaceDir);
  const chapterText = await readFile(chapterPath, "utf8");
  const deltaInput = await resolveSettlementDelta({
    workspaceDir: input.workspaceDir,
    chapterId: input.chapterId,
    chapterText,
    ledgers: before,
    deltaPath: input.deltaPath,
    config: input.config,
    apiKey: input.apiKey,
    generate: input.generate
  });
  const delta = deltaInput.delta;
  if (delta.chapterId !== input.chapterId) {
    throw new Error(`State delta chapterId mismatch: expected ${input.chapterId}, received ${delta.chapterId}.`);
  }

  const conflicts = detectStateConflicts(before, delta);
  if (conflicts.length > 0) {
    throw new Error(`State settlement conflict: ${conflicts.join("; ")}`);
  }

  const settledAt = input.now ?? new Date();
  const { after, diff } = mergeStateDelta(before, delta, settledAt);
  const settlementDir = path.join(
    input.workspaceDir,
    "state",
    "settlements",
    `${input.chapterId}-${settledAt.toISOString().replace(/[:.]/g, "-")}`
  );
  const metadata: StateSettlementMetadata = {
    schemaVersion: "longgu.state-settlement.v0.3",
    chapterId: input.chapterId,
    settledAt: settledAt.toISOString(),
    deltaSource: deltaInput.source,
    deltaFile: deltaInput.deltaPath ? path.relative(input.workspaceDir, deltaInput.deltaPath) : undefined,
    provider: deltaInput.config?.provider.name,
    model: deltaInput.config?.provider.model,
    settlementDir: path.relative(input.workspaceDir, settlementDir)
  };

  await writeAllStateLedgers(input.workspaceDir, after);
  await writeSettlementRecord({
    settlementDir,
    delta,
    before,
    after,
    diff,
    metadata,
    prompt: deltaInput.prompt,
    modelOutput: deltaInput.modelOutput
  });

  return { settlementDir, diff, metadata };
}

function createBaselineLedgers(now: Date): [string, StateLedger][] {
  const updatedAt = now.toISOString();
  return [
    ["truth.json", TruthLedgerSchema.parse({ schemaVersion: "longgu.story-state.v0.3", ledger: "truth", facts: [], updatedAt })],
    [
      "characters.json",
      CharactersLedgerSchema.parse({
        schemaVersion: "longgu.story-state.v0.3",
        ledger: "characters",
        characters: [],
        updatedAt
      })
    ],
    [
      "timeline.json",
      TimelineLedgerSchema.parse({
        schemaVersion: "longgu.story-state.v0.3",
        ledger: "timeline",
        events: [],
        updatedAt
      })
    ],
    ["hooks.json", HooksLedgerSchema.parse({ schemaVersion: "longgu.story-state.v0.3", ledger: "hooks", hooks: [], updatedAt })],
    [
      "reader-promises.json",
      ReaderPromisesLedgerSchema.parse({
        schemaVersion: "longgu.story-state.v0.3",
        ledger: "reader-promises",
        promises: [],
        updatedAt
      })
    ],
    [
      "resources.json",
      ResourcesLedgerSchema.parse({
        schemaVersion: "longgu.story-state.v0.3",
        ledger: "resources",
        resources: [],
        updatedAt
      })
    ]
  ];
}

function rejectDuplicateIds(
  items: { id: string }[],
  field: string,
  ctx: z.RefinementCtx
): void {
  const seen = new Set<string>();
  for (const [index, item] of items.entries()) {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        path: [field, index, "id"],
        message: `Duplicate id in ${field}: ${item.id}`
      });
    }
    seen.add(item.id);
  }
}

async function loadAllStateLedgers(workspaceDir: string): Promise<Record<(typeof stateLedgerFiles)[number], StateLedger>> {
  return {
    "truth.json": await loadStateLedger(workspaceDir, "truth.json"),
    "characters.json": await loadStateLedger(workspaceDir, "characters.json"),
    "timeline.json": await loadStateLedger(workspaceDir, "timeline.json"),
    "hooks.json": await loadStateLedger(workspaceDir, "hooks.json"),
    "reader-promises.json": await loadStateLedger(workspaceDir, "reader-promises.json"),
    "resources.json": await loadStateLedger(workspaceDir, "resources.json")
  };
}

async function resolveSettlementDelta(input: {
  workspaceDir: string;
  chapterId: string;
  chapterText: string;
  ledgers: Record<(typeof stateLedgerFiles)[number], StateLedger>;
  deltaPath?: string;
  config?: LongguConfig;
  apiKey?: string;
  generate?: GenerateStateDeltaFn;
}): Promise<{
  source: "file" | "model";
  delta: StateDelta;
  deltaPath?: string;
  config?: LongguConfig;
  prompt?: string;
  modelOutput?: string;
}> {
  if (input.deltaPath) {
    const deltaPath = path.isAbsolute(input.deltaPath) ? input.deltaPath : path.join(input.workspaceDir, input.deltaPath);
    return { source: "file", delta: await loadStateDelta(deltaPath), deltaPath };
  }

  if (!input.config || !input.apiKey || !input.generate) {
    throw new Error("State delta extraction requires provider config and API key when --delta is not provided.");
  }

  const prompt = renderStateDeltaPrompt({
    chapterId: input.chapterId,
    chapterText: input.chapterText,
    ledgers: input.ledgers
  });
  const result = await input.generate({ prompt, config: input.config, apiKey: input.apiKey });
  const delta = parseStateDeltaFromText(result.text);
  return {
    source: "model",
    delta,
    config: input.config,
    prompt,
    modelOutput: result.text
  };
}

function renderStateDeltaPrompt(input: {
  chapterId: string;
  chapterText: string;
  ledgers: Record<(typeof stateLedgerFiles)[number], StateLedger>;
}): string {
  return `你是龙骨 Longgu 的长篇网文状态沉淀器。请阅读章节正文和当前状态账本，只输出一个 JSON 对象，不要输出 Markdown，不要解释。

JSON 必须符合：
- schemaVersion 固定为 "longgu.state-delta.v0.3"
- chapterId 固定为 "${input.chapterId}"
- 可包含 facts, characters, timelineEvents, hooks, readerPromises, resources 六个数组
- 不确定的变化不要写入
- 不要整份重写账本，只输出本章新增或变化的条目
- 复用已有 id；新增条目使用稳定、可读的 id

当前状态账本：

${JSON.stringify(input.ledgers, null, 2)}

章节正文 chapters/${input.chapterId}.md：

${input.chapterText}

只输出 JSON：`;
}

function parseStateDeltaFromText(text: string): StateDelta {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced?.[1] ?? extractJsonObject(trimmed);
  return StateDeltaSchema.parse(JSON.parse(jsonText) as unknown);
}

function extractJsonObject(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("State delta extraction failed: provider response did not contain a JSON object.");
  }
  return text.slice(first, last + 1);
}

async function writeAllStateLedgers(
  workspaceDir: string,
  ledgers: Record<(typeof stateLedgerFiles)[number], StateLedger>
): Promise<void> {
  for (const file of stateLedgerFiles) {
    await writeFile(path.join(workspaceDir, "state", file), `${JSON.stringify(ledgers[file], null, 2)}\n`, "utf8");
  }
}

function detectStateConflicts(
  ledgers: Record<(typeof stateLedgerFiles)[number], StateLedger>,
  delta: StateDelta
): string[] {
  const conflicts: string[] = [];
  const truth = ledgers["truth.json"] as TruthLedger;
  const timeline = ledgers["timeline.json"] as TimelineLedger;
  const hooks = ledgers["hooks.json"] as HooksLedger;
  const promises = ledgers["reader-promises.json"] as ReaderPromisesLedger;

  for (const fact of delta.facts) {
    const existing = truth.facts.find((item) => item.id === fact.id);
    if (existing && existing.text !== fact.text) {
      conflicts.push(`fact ${fact.id} text is immutable`);
    }
  }

  for (const event of delta.timelineEvents) {
    const existing = timeline.events.find((item) => item.id === event.id);
    if (existing && existing.chapterId !== event.chapterId) {
      conflicts.push(`timeline event ${event.id} cannot move from chapter ${existing.chapterId} to ${event.chapterId}`);
    }
  }

  for (const hook of delta.hooks) {
    const existing = hooks.hooks.find((item) => item.id === hook.id);
    if (existing?.status === "resolved" && hook.status !== "resolved") {
      conflicts.push(`hook ${hook.id} cannot regress from resolved to ${hook.status}`);
    }
  }

  for (const promise of delta.readerPromises) {
    const existing = promises.promises.find((item) => item.id === promise.id);
    if ((existing?.status === "paid-off" || existing?.status === "broken") && promise.status === "active") {
      conflicts.push(`reader promise ${promise.id} cannot regress from ${existing.status} to active`);
    }
  }

  return conflicts;
}

function mergeStateDelta(
  ledgers: Record<(typeof stateLedgerFiles)[number], StateLedger>,
  delta: StateDelta,
  now: Date
): { after: Record<(typeof stateLedgerFiles)[number], StateLedger>; diff: LedgerDiff[] } {
  const updatedAt = now.toISOString();
  const truth = ledgers["truth.json"] as TruthLedger;
  const characters = ledgers["characters.json"] as CharactersLedger;
  const timeline = ledgers["timeline.json"] as TimelineLedger;
  const hooks = ledgers["hooks.json"] as HooksLedger;
  const promises = ledgers["reader-promises.json"] as ReaderPromisesLedger;
  const resources = ledgers["resources.json"] as ResourcesLedger;

  const factMerge = mergeById(truth.facts, delta.facts);
  const characterMerge = mergeById(characters.characters, delta.characters);
  const timelineMerge = mergeById(timeline.events, delta.timelineEvents);
  const hookMerge = mergeById(hooks.hooks, delta.hooks);
  const promiseMerge = mergeById(promises.promises, delta.readerPromises);
  const resourceMerge = mergeById(resources.resources, delta.resources);

  const after = {
    "truth.json": TruthLedgerSchema.parse({ ...truth, facts: factMerge.items, updatedAt }),
    "characters.json": CharactersLedgerSchema.parse({ ...characters, characters: characterMerge.items, updatedAt }),
    "timeline.json": TimelineLedgerSchema.parse({ ...timeline, events: timelineMerge.items, updatedAt }),
    "hooks.json": HooksLedgerSchema.parse({ ...hooks, hooks: hookMerge.items, updatedAt }),
    "reader-promises.json": ReaderPromisesLedgerSchema.parse({ ...promises, promises: promiseMerge.items, updatedAt }),
    "resources.json": ResourcesLedgerSchema.parse({ ...resources, resources: resourceMerge.items, updatedAt })
  };

  return {
    after,
    diff: [
      { ledger: "truth", ...factMerge.diff },
      { ledger: "characters", ...characterMerge.diff },
      { ledger: "timeline", ...timelineMerge.diff },
      { ledger: "hooks", ...hookMerge.diff },
      { ledger: "reader-promises", ...promiseMerge.diff },
      { ledger: "resources", ...resourceMerge.diff }
    ]
  };
}

function mergeById<T extends { id: string }>(
  existingItems: T[],
  incomingItems: T[]
): { items: T[]; diff: Omit<LedgerDiff, "ledger"> } {
  const items = [...existingItems];
  const added: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];

  for (const incoming of incomingItems) {
    const existingIndex = items.findIndex((item) => item.id === incoming.id);
    if (existingIndex === -1) {
      items.push(incoming);
      added.push(incoming.id);
      continue;
    }

    if (stableJson(items[existingIndex]) === stableJson(incoming)) {
      unchanged.push(incoming.id);
      continue;
    }

    items[existingIndex] = incoming;
    updated.push(incoming.id);
  }

  return { items, diff: { added, updated, unchanged } };
}

async function writeSettlementRecord(input: {
  settlementDir: string;
  delta: StateDelta;
  before: Record<(typeof stateLedgerFiles)[number], StateLedger>;
  after: Record<(typeof stateLedgerFiles)[number], StateLedger>;
  diff: LedgerDiff[];
  metadata: StateSettlementMetadata;
  prompt?: string;
  modelOutput?: string;
}): Promise<void> {
  await mkdir(input.settlementDir, { recursive: true });
  await writeFile(path.join(input.settlementDir, "delta.json"), `${JSON.stringify(input.delta, null, 2)}\n`, "utf8");
  await writeFile(path.join(input.settlementDir, "before.json"), `${JSON.stringify(input.before, null, 2)}\n`, "utf8");
  await writeFile(path.join(input.settlementDir, "after.json"), `${JSON.stringify(input.after, null, 2)}\n`, "utf8");
  await writeFile(path.join(input.settlementDir, "diff.json"), `${JSON.stringify(input.diff, null, 2)}\n`, "utf8");
  await writeFile(path.join(input.settlementDir, "metadata.json"), `${JSON.stringify(input.metadata, null, 2)}\n`, "utf8");
  if (input.prompt !== undefined) {
    await writeFile(path.join(input.settlementDir, "prompt.md"), input.prompt, "utf8");
  }
  if (input.modelOutput !== undefined) {
    await writeFile(path.join(input.settlementDir, "model-output.txt"), input.modelOutput, "utf8");
  }
}

function ledgerItemCount(ledger: StateLedger): number {
  switch (ledger.ledger) {
    case "truth":
      return ledger.facts.length;
    case "characters":
      return ledger.characters.length;
    case "timeline":
      return ledger.events.length;
    case "hooks":
      return ledger.hooks.length;
    case "reader-promises":
      return ledger.promises.length;
    case "resources":
      return ledger.resources.length;
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

async function existingLedgerFiles(outputDir: string): Promise<string[]> {
  const existing: string[] = [];
  for (const file of stateLedgerFiles) {
    if (await pathExists(path.join(outputDir, file))) {
      existing.push(path.join("state", file));
    }
  }
  return existing;
}
