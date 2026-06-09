#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { ZodError } from "zod";
import { checkOpenAICompatible, generateWithOpenAICompatible } from "../adapters/openaiCompatible.js";
import { createBookPlanDraft } from "../core/bookPlan.js";
import { loadLongguConfig } from "../core/config.js";
import { writeChapter } from "../core/generation.js";
import { latestRun } from "../core/runs.js";
import { assertWorkspaceShape, initWorkspace } from "../core/workspace.js";

const program = new Command();

program
  .name("longgu")
  .description("龙骨 Longgu: 中文网文创作工程化 Harness")
  .version("0.2.0");

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
