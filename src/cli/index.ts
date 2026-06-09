#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { ZodError } from "zod";
import { checkOpenAICompatible, generateWithOpenAICompatible } from "../adapters/openaiCompatible.js";
import { auditChapter } from "../core/audit.js";
import { createBookPlanDraft, createChaptersPlanDraft, createVolumePlanDraft } from "../core/bookPlan.js";
import { loadLongguConfig } from "../core/config.js";
import { writeChapter } from "../core/generation.js";
import { listGenreCards, resolveGenreCard } from "../core/genreCards.js";
import { reviseChapter, RevisionModeSchema } from "../core/revision.js";
import { latestRun } from "../core/runs.js";
import { initStateLedgers, inspectState, settleChapterState } from "../core/state.js";
import { assertWorkspaceShape, initWorkspace } from "../core/workspace.js";

const program = new Command();

program
  .name("longgu")
  .description("龙骨 Longgu: 中文网文创作工程化 Harness")
  .version("0.6.0");

program
  .command("init")
  .description("Initialize a V0.1 Longgu workspace")
  .argument("[dir]", "target directory", ".")
  .action(async (dir: string) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      const result = await initWorkspace(workspaceDir);
      console.log(`Initialized workspace: ${workspaceDir}`);
      if (result.created.length > 0) {
        console.log(`Created: ${result.created.join(", ")}`);
      }
      if (result.existing.length > 0) {
        console.log(`Existing files kept: ${result.existing.join(", ")}`);
      }
    });
  });

program
  .command("doctor")
  .description("Check workspace, config, API key, and provider connectivity")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = await loadConfigWithFriendlyErrors(workspaceDir);
      const apiKey = readApiKey(config.provider.apiKeyEnv);
      await checkOpenAICompatible(config, apiKey);
      console.log("Doctor passed: structure, config, API key, and provider connectivity are ready.");
    });
  });

const write = program.command("write").description("Write Longgu artifacts");
write
  .command("chapter")
  .description("Generate a chapter")
  .requiredOption("--id <id>", "chapter id, e.g. 001")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = await loadConfigWithFriendlyErrors(workspaceDir);
      const apiKey = readApiKey(config.provider.apiKeyEnv);
      const result = await writeChapter({
        workspaceDir,
        chapterId: options.id,
        apiKey,
        generate: generateWithOpenAICompatible
      });
      console.log(`Generated chapter: ${result.chapterPath}`);
      console.log(`Run record: ${result.runDir}`);
    });
  });

const plan = program.command("plan").description("Plan Longgu story artifacts");
plan
  .command("book")
  .description("Create a structured book specification draft")
  .option("--force", "replace existing outlines/book.draft.json")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { force?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createBookPlanDraft({ workspaceDir, force: options.force });
      console.log(`Book plan draft: ${result.outputPath}`);
      console.log(`Status: ${result.overwritten ? "replaced" : "created"}`);
    });
  });

plan
  .command("volume")
  .description("Create a structured volume plan draft")
  .requiredOption("--id <id>", "volume id, e.g. 001")
  .option("--force", "replace existing outlines/volume-<id>.draft.json")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; force?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createVolumePlanDraft({
        workspaceDir,
        volumeId: options.id,
        force: options.force
      });
      console.log(`Volume plan draft: ${result.outputPath}`);
      console.log(`Status: ${result.overwritten ? "replaced" : "created"}`);
    });
  });

plan
  .command("chapters")
  .description("Create structured chapter card drafts for a volume")
  .requiredOption("--volume <id>", "volume id, e.g. 001")
  .option("--force", "replace existing outlines/chapters-<volume>.draft.json")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { volume: string; force?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createChaptersPlanDraft({
        workspaceDir,
        volumeId: options.volume,
        force: options.force
      });
      console.log(`Chapters plan draft: ${result.outputPath}`);
      console.log(`Status: ${result.overwritten ? "replaced" : "created"}`);
    });
  });

const genre = program.command("genre").description("Inspect Longgu genre cards");
genre
  .command("list")
  .description("List built-in V0.6 genre cards")
  .action(() => {
    for (const card of listGenreCards()) {
      console.log(`${card.id}\t${card.name}`);
    }
  });

genre
  .command("show")
  .description("Show a resolved genre card as JSON")
  .argument("<id>", "genre id or alias")
  .action((id: string) => {
    console.log(JSON.stringify(resolveGenreCard(id), null, 2));
  });

const run = program.command("run").description("Inspect generation runs");
run
  .command("show")
  .description("Show latest run summary")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      const runRecord = await latestRun(workspaceDir);
      if (!runRecord) {
        console.log("No run records exist.");
        return;
      }
      const { metadata } = runRecord;
      console.log(`Run: ${metadata.id}`);
      console.log(`Status: ${metadata.status}`);
      console.log(`Chapter: ${metadata.chapterId}`);
      console.log(`Provider: ${metadata.provider}`);
      console.log(`Model: ${metadata.model}`);
      console.log(`Started: ${metadata.startedAt}`);
      console.log(`Finished: ${metadata.finishedAt ?? "n/a"}`);
      console.log(`Input files: ${metadata.inputFiles.join(", ")}`);
      console.log(`Prompt: ${metadata.promptFile}`);
      console.log(`Output: ${metadata.outputFile ?? "n/a"}`);
      console.log(`Error: ${metadata.errorFile ?? "n/a"}`);
    });
  });

const state = program.command("state").description("Manage Longgu story state ledgers");
state
  .command("init")
  .description("Initialize V0.3 story state ledgers")
  .option("--force", "replace existing state ledger files")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { force?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await initStateLedgers({ workspaceDir, force: options.force });
      console.log(`State ledgers: ${result.outputDir}`);
      if (result.created.length > 0) {
        console.log(`Created: ${result.created.join(", ")}`);
      }
      if (result.overwritten.length > 0) {
        console.log(`Overwritten: ${result.overwritten.join(", ")}`);
      }
    });
  });

state
  .command("inspect")
  .description("Inspect V0.3 story state ledgers")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const entries = await inspectState(workspaceDir);
      console.log("State ledgers:");
      for (const entry of entries) {
        console.log(`${entry.ledger}: ${entry.count} item(s), updated ${entry.updatedAt} (${entry.file})`);
      }
    });
  });

const settle = program.command("settle").description("Settle Longgu artifacts into story state");
settle
  .command("chapter")
  .description("Apply a chapter state delta to V0.3 ledgers")
  .requiredOption("--id <id>", "chapter id, e.g. 001")
  .option("--delta <path>", "state delta JSON path; skips provider extraction when provided")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; delta?: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = options.delta ? undefined : await loadConfigWithFriendlyErrors(workspaceDir);
      const apiKey = config ? readApiKey(config.provider.apiKeyEnv) : undefined;
      const result = await settleChapterState({
        workspaceDir,
        chapterId: options.id,
        deltaPath: options.delta,
        config,
        apiKey,
        generate: config ? generateWithOpenAICompatible : undefined
      });
      console.log(`Settlement record: ${result.settlementDir}`);
      for (const diff of result.diff) {
        const changed = diff.added.length + diff.updated.length + diff.unchanged.length;
        console.log(
          `${diff.ledger}: ${changed} touched, ${diff.added.length} added, ${diff.updated.length} updated, ${diff.unchanged.length} unchanged`
        );
      }
    });
  });

const audit = program.command("audit").description("Audit Longgu artifacts");
audit
  .command("chapter")
  .description("Audit a chapter and write V0.4 audit artifacts")
  .requiredOption("--id <id>", "chapter id, e.g. 001")
  .option("--input <path>", "raw audit JSON path; skips provider extraction when provided")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; input?: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = await loadConfigWithFriendlyErrors(workspaceDir);
      const apiKey = options.input ? undefined : readApiKey(config.provider.apiKeyEnv);
      const result = await auditChapter({
        workspaceDir,
        chapterId: options.id,
        inputPath: options.input,
        config,
        apiKey,
        generate: options.input ? undefined : generateWithOpenAICompatible
      });
      const criticalCount = result.audit.issues.filter((issue) => issue.severity === "critical").length;
      const warningCount = result.audit.issues.filter((issue) => issue.severity === "warning").length;
      console.log(`Audit JSON: ${result.jsonPath}`);
      console.log(`Audit Markdown: ${result.markdownPath}`);
      console.log(`Status: ${result.audit.status}`);
      console.log(`Blocked: ${result.audit.blocked}`);
      console.log(`Critical: ${criticalCount}`);
      console.log(`Warning: ${warningCount}`);
    });
  });

const revise = program.command("revise").description("Revise Longgu artifacts");
revise
  .command("chapter")
  .description("Revise a chapter using its V0.5 audit result")
  .requiredOption("--id <id>", "chapter id, e.g. 001")
  .option("--mode <mode>", "revision mode: spot-fix, polish, rewrite-scene, rewrite-chapter")
  .option("--input <path>", "revised chapter Markdown path; skips provider revision when provided")
  .option("--post-audit <path>", "optional post-revision audit JSON for critical-count comparison")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; mode?: string; input?: string; postAudit?: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = await loadConfigWithFriendlyErrors(workspaceDir);
      const apiKey = options.input ? undefined : readApiKey(config.provider.apiKeyEnv);
      const mode = options.mode ? RevisionModeSchema.parse(options.mode) : undefined;
      const result = await reviseChapter({
        workspaceDir,
        chapterId: options.id,
        mode,
        inputPath: options.input,
        postAuditPath: options.postAudit,
        config,
        apiKey,
        generate: options.input ? undefined : generateWithOpenAICompatible
      });
      console.log(`Revision record: ${result.revisionDir}`);
      console.log(`Mode: ${result.metadata.mode}`);
      console.log(`Selected issues: ${result.metadata.selectedIssueIds.length}`);
      console.log(`Diff: ${result.diffPath}`);
    });
  });

await program.parseAsync();

async function runCli(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

async function checkWorkspace(workspaceDir: string): Promise<void> {
  const missing = await assertWorkspaceShape(workspaceDir);
  if (missing.length > 0) {
    throw new Error(`Workspace structure check failed. Missing: ${missing.join(", ")}`);
  }
}

async function loadConfigWithFriendlyErrors(workspaceDir: string) {
  try {
    return await loadLongguConfig(workspaceDir);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      throw new Error(`longgu.yaml validation failed: ${details}`);
    }
    throw error;
  }
}

function readApiKey(envName: string): string {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`API key check failed. Environment variable ${envName} is not set.`);
  }
  return value;
}
