import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { pathExists } from "./workspace.js";

const schemaVersion = z.literal("longgu.story-state.v0.3");

const datedLedger = {
  schemaVersion,
  updatedAt: z.string().datetime()
};

export const TruthLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("truth"),
  facts: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      sourceChapterId: z.string().optional()
    })
  )
});

export const CharactersLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("characters"),
  characters: z.array(
    z.object({
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
    })
  )
});

export const TimelineLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("timeline"),
  events: z.array(
    z.object({
      id: z.string().min(1),
      chapterId: z.string().min(1),
      order: z.number().int().nonnegative(),
      summary: z.string().min(1)
    })
  )
});

export const HooksLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("hooks"),
  hooks: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      status: z.enum(["opened", "mentioned", "delayed", "resolved"]),
      openedInChapterId: z.string().optional(),
      resolvedInChapterId: z.string().optional()
    })
  )
});

export const ReaderPromisesLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("reader-promises"),
  promises: z.array(
    z.object({
      id: z.string().min(1),
      text: z.string().min(1),
      status: z.enum(["active", "paid-off", "broken"]),
      sourceChapterId: z.string().optional()
    })
  )
});

export const ResourcesLedgerSchema = z.object({
  ...datedLedger,
  ledger: z.literal("resources"),
  resources: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      ownerCharacterId: z.string().optional(),
      quantity: z.string(),
      state: z.string()
    })
  )
});

export type TruthLedger = z.infer<typeof TruthLedgerSchema>;
export type CharactersLedger = z.infer<typeof CharactersLedgerSchema>;
export type TimelineLedger = z.infer<typeof TimelineLedgerSchema>;
export type HooksLedger = z.infer<typeof HooksLedgerSchema>;
export type ReaderPromisesLedger = z.infer<typeof ReaderPromisesLedgerSchema>;
export type ResourcesLedger = z.infer<typeof ResourcesLedgerSchema>;

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

async function existingLedgerFiles(outputDir: string): Promise<string[]> {
  const existing: string[] = [];
  for (const file of stateLedgerFiles) {
    if (await pathExists(path.join(outputDir, file))) {
      existing.push(path.join("state", file));
    }
  }
  return existing;
}
