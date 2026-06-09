#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { ZodError } from "zod";
import { checkOpenAICompatible, generateWithOpenAICompatible } from "../adapters/openaiCompatible.js";
import { auditChapter } from "../core/audit.js";
import { auditChapterPlan, createBookPlanDraft, createChaptersPlanDraft, createVolumePlanDraft } from "../core/bookPlan.js";
import { loadLongguConfig, requireProviderBackedConfig, requireProviderConfig } from "../core/config.js";
import { buildChapterContext } from "../core/context.js";
import {
  compareExperiment,
  createExperiment,
  ExperimentSortKeySchema,
  generateExperimentVariant,
  registerExperimentVariant,
  scoreExperimentVariant
} from "../core/experiments.js";
import { recordChapterFeedback } from "../core/feedback.js";
import { exportHostChapterPrompt, importHostChapterDraft, writeChapter } from "../core/generation.js";
import { listGenreCards, resolveGenreCard } from "../core/genreCards.js";
import { listModelProfiles } from "../core/modelRouting.js";
import { reviseChapter, RevisionModeSchema } from "../core/revision.js";
import { buildCostReport, latestRun } from "../core/runs.js";
import { checkState, initStateLedgers, inspectState, settleChapterState } from "../core/state.js";
import { assertWorkspaceShape, initWorkspace } from "../core/workspace.js";

const program = new Command();

program
  .name("longgu")
  .description("龙骨 Longgu: 中文网文创作工程化 Harness")
  .version("1.0.0");

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
      console.log("Next: edit longgu.yaml and bible/*.md, then run longgu doctor.");
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
      const providerConfig = requireProviderBackedConfig(config);
      const provider = requireProviderConfig(providerConfig);
      const apiKey = readApiKey(provider.apiKeyEnv);
      await checkOpenAICompatible(providerConfig, apiKey);
      console.log("Doctor passed: structure, config, API key, and provider connectivity are ready.");
      console.log("Next: run longgu plan book, or continue with an existing outline.");
    });
  });

const write = program.command("write").description("Write Longgu artifacts");
write
  .command("chapter")
  .description("Generate a chapter")
  .requiredOption("--id <id>", "chapter id, e.g. 001")
  .option("--important", "use important drafting model route when configured")
  .option("--host-prompt", "write a prompt for a host LLM instead of calling a provider")
  .option("--input <path>", "import a host-generated Markdown chapter instead of calling a provider")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; important?: boolean; hostPrompt?: boolean; input?: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      if (options.hostPrompt && options.input) {
        throw new Error("--host-prompt cannot be used with --input.");
      }
      if (options.hostPrompt) {
        const result = await exportHostChapterPrompt({
          workspaceDir,
          chapterId: options.id
        });
        console.log(`Host prompt: ${result.promptPath}`);
        console.log(`Context JSON: ${result.contextJsonPath}`);
        console.log(`Context Markdown: ${result.contextMarkdownPath}`);
        console.log(`Next: ask the host LLM to write the chapter, save it as Markdown, then run longgu write chapter --id ${options.id} --input <path>.`);
        return;
      }
      if (options.input) {
        const result = await importHostChapterDraft({
          workspaceDir,
          chapterId: options.id,
          inputPath: options.input
        });
        console.log(`Imported chapter: ${result.chapterPath}`);
        console.log(`Run record: ${result.runDir}`);
        console.log(`Next: review chapters/${options.id}.md, then run longgu audit chapter --id ${options.id}.`);
        return;
      }
      const result = await writeChapter({
        workspaceDir,
        chapterId: options.id,
        important: options.important,
        readApiKey,
        generate: generateWithOpenAICompatible
      });
      console.log(`Generated chapter: ${result.chapterPath}`);
      console.log(`Run record: ${result.runDir}`);
      console.log(`Next: review chapters/${options.id}.md, then run longgu audit chapter --id ${options.id}.`);
    });
  });

const model = program.command("model").description("Inspect Longgu model routing");
model
  .command("list")
  .description("List configured V0.8 model profiles and routes")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = await loadConfigWithFriendlyErrors(workspaceDir);
      console.log("Models:");
      for (const profile of listModelProfiles(config)) {
        console.log(
          `${profile.id}\t${profile.provider}\t${profile.model}\t${profile.apiKeyEnv}\tinput/1K=${profile.inputPer1K}\toutput/1K=${profile.outputPer1K}`
        );
      }
      console.log("Routes:");
      const routes = config.routes ?? {};
      if (Object.keys(routes).length === 0) {
        console.log("default -> default");
      } else {
        for (const [task, route] of Object.entries(routes).sort(([left], [right]) => left.localeCompare(right))) {
          const fallback = route.fallback ? ` fallback=${route.fallback}` : "";
          const important = route.importantModel ? ` important=${route.importantModel}` : "";
          console.log(`${task} -> ${route.model}${fallback}${important}`);
        }
      }
    });
  });

const cost = program.command("cost").description("Inspect Longgu run costs");
cost
  .command("report")
  .description("Aggregate V0.8 run token and cost estimates")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const report = await buildCostReport(workspaceDir);
      console.log(`Runs: ${report.totalRuns}`);
      console.log(`Input tokens: ${report.inputTokens}`);
      console.log(`Output tokens: ${report.outputTokens}`);
      console.log(`Estimated cost: ${report.estimatedCost}`);
      console.log("By task:");
      for (const item of report.byTask) {
        console.log(`${item.id}\t${item.runs} run(s)\tinput=${item.inputTokens}\toutput=${item.outputTokens}\tcost=${item.estimatedCost}`);
      }
      console.log("By model:");
      for (const item of report.byModel) {
        console.log(`${item.id}\t${item.runs} run(s)\tinput=${item.inputTokens}\toutput=${item.outputTokens}\tcost=${item.estimatedCost}`);
      }
    });
  });

const feedback = program.command("feedback").description("Record human feedback for Longgu artifacts");
feedback
  .command("chapter")
  .description("Record human feedback for a chapter")
  .requiredOption("--id <id>", "chapter id, e.g. 001")
  .requiredOption("--score <number>", "human score 0-10", parseScore)
  .requiredOption("--comment <text>", "human feedback comment")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; score: number; comment: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await recordChapterFeedback({
        workspaceDir,
        chapterId: options.id,
        score: options.score,
        comment: options.comment
      });
      console.log(`Feedback file: ${result.outputPath}`);
      console.log(`Entries: ${result.feedback.entries.length}`);
      console.log(`Next: run longgu context build --chapter ${options.id} to include feedback in future generation context.`);
    });
  });

const experiment = program.command("experiment").description("Manage Longgu experiments");
experiment
  .command("create")
  .description("Create a V0.9 experiment manifest")
  .requiredOption("--id <id>", "experiment id, e.g. opening-ab")
  .requiredOption("--goal <goal>", "experiment goal")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; goal: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createExperiment({ workspaceDir, id: options.id, goal: options.goal });
      console.log(`Experiment manifest: ${result.manifestPath}`);
      console.log(`Goal: ${result.manifest.goal}`);
    });
  });

experiment
  .command("run")
  .description("Register a local Markdown candidate as an experiment variant")
  .requiredOption("--id <id>", "experiment id")
  .requiredOption("--variant <id>", "variant id")
  .requiredOption("--input <path>", "candidate Markdown input path")
  .option("--model <profile>", "model profile label", "manual")
  .option("--run-id <id>", "optional run id to link")
  .option("--audit <path>", "optional audit JSON path to link")
  .option("--cost <number>", "estimated cost override", parseNonNegativeNumber)
  .argument("[dir]", "workspace directory", ".")
  .action(
    async (
      dir: string,
      options: { id: string; variant: string; input: string; model: string; runId?: string; audit?: string; cost?: number }
    ) => {
      await runCli(async () => {
        const workspaceDir = path.resolve(dir);
        await checkWorkspace(workspaceDir);
        const result = await registerExperimentVariant({
          workspaceDir,
          experimentId: options.id,
          variantId: options.variant,
          inputPath: options.input,
          modelProfile: options.model,
          runId: options.runId,
          auditFile: options.audit,
          estimatedCost: options.cost
        });
        console.log(`Variant output: ${result.outputPath}`);
        console.log(`Variant metadata: ${result.metadataPath}`);
      });
    }
  );

experiment
  .command("generate")
  .description("Generate and register an experiment variant through the experiment model route")
  .requiredOption("--id <id>", "experiment id")
  .requiredOption("--variant <id>", "variant id")
  .requiredOption("--prompt <path>", "prompt Markdown path")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; variant: string; prompt: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const config = await loadConfigWithFriendlyErrors(workspaceDir);
      const result = await generateExperimentVariant({
        workspaceDir,
        experimentId: options.id,
        variantId: options.variant,
        promptPath: options.prompt,
        config,
        readApiKey,
        generate: generateWithOpenAICompatible
      });
      console.log(`Variant output: ${result.outputPath}`);
      console.log(`Variant metadata: ${result.metadataPath}`);
      console.log(`Run record: ${result.runDir}`);
    });
  });

experiment
  .command("score")
  .description("Write human scores for an experiment variant")
  .requiredOption("--id <id>", "experiment id")
  .requiredOption("--variant <id>", "variant id")
  .requiredOption("--payoff <number>", "payoff score 0-10", parseScore)
  .requiredOption("--hook <number>", "hook score 0-10", parseScore)
  .requiredOption("--ai-flavor <number>", "AI flavor score 0-10; lower is better", parseScore)
  .option("--setting-conflict <number>", "setting conflict score 0-10; lower is better", parseScore)
  .option("--note <text>", "human note", "")
  .argument("[dir]", "workspace directory", ".")
  .action(
    async (
      dir: string,
      options: { id: string; variant: string; payoff: number; hook: number; aiFlavor: number; settingConflict?: number; note: string }
    ) => {
      await runCli(async () => {
        const workspaceDir = path.resolve(dir);
        await checkWorkspace(workspaceDir);
        const result = await scoreExperimentVariant({
          workspaceDir,
          experimentId: options.id,
          variantId: options.variant,
          payoff: options.payoff,
          hook: options.hook,
          aiFlavor: options.aiFlavor,
          settingConflict: options.settingConflict,
          note: options.note
        });
        console.log(`Variant scores: ${result.scorePath}`);
      });
    }
  );

experiment
  .command("compare")
  .description("Compare experiment variants")
  .requiredOption("--id <id>", "experiment id")
  .option("--sort <key>", "sort key: payoff, hook, ai-flavor, setting-conflict, contract, cost", parseExperimentSortKey)
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; sort?: ReturnType<typeof parseExperimentSortKey> }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await compareExperiment({ workspaceDir, experimentId: options.id, sort: options.sort });
      console.log(`Compare JSON: ${result.jsonPath}`);
      console.log(`Compare Markdown: ${result.markdownPath}`);
      console.log(`Variants: ${result.compare.variants.length}`);
    });
  });

const plan = program.command("plan").description("Plan Longgu story artifacts");
plan
  .command("book")
  .description("Create a structured book specification draft")
  .option("--force", "replace existing outlines/book.draft.json")
  .option("--model", "use the planning model route instead of deterministic draft generation")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { force?: boolean; model?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createBookPlanDraft({
        workspaceDir,
        force: options.force,
        model: options.model,
        readApiKey: options.model ? readApiKey : undefined,
        generate: options.model ? generateWithOpenAICompatible : undefined
      });
      console.log(`Book plan draft: ${result.outputPath}`);
      console.log(`Status: ${result.overwritten ? "replaced" : "created"}`);
      if (result.runDir) {
        console.log(`Run record: ${result.runDir}`);
      }
      console.log("Next: review outlines/book.draft.json, then run longgu plan volume --id 001.");
    });
  });

plan
  .command("volume")
  .description("Create a structured volume plan draft")
  .requiredOption("--id <id>", "volume id, e.g. 001")
  .option("--force", "replace existing outlines/volume-<id>.draft.json")
  .option("--model", "use the planning model route instead of deterministic draft generation")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { id: string; force?: boolean; model?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createVolumePlanDraft({
        workspaceDir,
        volumeId: options.id,
        force: options.force,
        model: options.model,
        readApiKey: options.model ? readApiKey : undefined,
        generate: options.model ? generateWithOpenAICompatible : undefined
      });
      console.log(`Volume plan draft: ${result.outputPath}`);
      console.log(`Status: ${result.overwritten ? "replaced" : "created"}`);
      if (result.runDir) {
        console.log(`Run record: ${result.runDir}`);
      }
      console.log(`Next: review outlines/volume-${options.id}.draft.json, then run longgu plan chapters --volume ${options.id}.`);
    });
  });

plan
  .command("chapters")
  .description("Create structured chapter card drafts for a volume")
  .requiredOption("--volume <id>", "volume id, e.g. 001")
  .option("--force", "replace existing outlines/chapters-<volume>.draft.json")
  .option("--model", "use the planning model route instead of deterministic draft generation")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { volume: string; force?: boolean; model?: boolean }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await createChaptersPlanDraft({
        workspaceDir,
        volumeId: options.volume,
        force: options.force,
        model: options.model,
        readApiKey: options.model ? readApiKey : undefined,
        generate: options.model ? generateWithOpenAICompatible : undefined
      });
      console.log(`Chapters plan draft: ${result.outputPath}`);
      console.log(`Status: ${result.overwritten ? "replaced" : "created"}`);
      if (result.runDir) {
        console.log(`Run record: ${result.runDir}`);
      }
      console.log(`Next: review chapter cards, then run longgu context build --chapter ${options.volume}-001.`);
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

const context = program.command("context").description("Build Longgu review context packs");
context
  .command("build")
  .description("Build a V0.7 context pack for a chapter")
  .requiredOption("--chapter <id>", "chapter id, e.g. 001")
  .option("--max-tokens <number>", "estimated token budget", parsePositiveInteger)
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { chapter: string; maxTokens?: number }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await buildChapterContext({
        workspaceDir,
        chapterId: options.chapter,
        maxTokens: options.maxTokens
      });
      console.log(`Context JSON: ${result.jsonPath}`);
      console.log(`Context Markdown: ${result.markdownPath}`);
      console.log(`Included sections: ${result.pack.includedSectionCount}/${result.pack.sections.length}`);
      console.log(`Estimated tokens: ${result.pack.estimatedTokens}/${result.pack.tokenBudget}`);
      console.log(`Next: inspect ${path.relative(workspaceDir, result.markdownPath)}, then run longgu write chapter --id ${options.chapter}.`);
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
      console.log("Next: run longgu state inspect after chapters are settled.");
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

state
  .command("check")
  .description("Write a V0.3 state consistency check report")
  .option("--chapter <id>", "current chapter id for reader promise debt checks")
  .option("--promise-max-age <number>", "maximum active reader promise age in chapters", parsePositiveInteger)
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { chapter?: string; promiseMaxAge?: number }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await checkState({ workspaceDir, chapterId: options.chapter, promiseMaxAge: options.promiseMaxAge });
      console.log(`State check JSON: ${result.jsonPath}`);
      console.log(`State check Markdown: ${result.markdownPath}`);
      console.log(`Status: ${result.report.status}`);
      console.log(`Issues: ${result.report.issues.length}`);
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
      const result = await settleChapterState({
        workspaceDir,
        chapterId: options.id,
        deltaPath: options.delta,
        config,
        readApiKey,
        generate: config ? generateWithOpenAICompatible : undefined
      });
      console.log(`Settlement record: ${result.settlementDir}`);
      for (const diff of result.diff) {
        const changed = diff.added.length + diff.updated.length + diff.unchanged.length;
        console.log(
          `${diff.ledger}: ${changed} touched, ${diff.added.length} added, ${diff.updated.length} updated, ${diff.unchanged.length} unchanged`
        );
      }
      console.log("Next: run longgu state inspect to review updated ledgers.");
    });
  });

const audit = program.command("audit").description("Audit Longgu artifacts");
audit
  .command("chapter-plan")
  .description("Audit a V0.2 chapter plan draft before drafting")
  .requiredOption("--volume <id>", "volume id, e.g. 001")
  .argument("[dir]", "workspace directory", ".")
  .action(async (dir: string, options: { volume: string }) => {
    await runCli(async () => {
      const workspaceDir = path.resolve(dir);
      await checkWorkspace(workspaceDir);
      const result = await auditChapterPlan({
        workspaceDir,
        volumeId: options.volume
      });
      const criticalCount = result.audit.issues.filter((issue) => issue.severity === "critical").length;
      const warningCount = result.audit.issues.filter((issue) => issue.severity === "warning").length;
      console.log(`Chapter plan audit JSON: ${result.jsonPath}`);
      console.log(`Chapter plan audit Markdown: ${result.markdownPath}`);
      console.log(`Status: ${result.audit.status}`);
      console.log(`Blocked: ${result.audit.blocked}`);
      console.log(`Critical: ${criticalCount}`);
      console.log(`Warning: ${warningCount}`);
      console.log(`Next: review ${path.relative(workspaceDir, result.markdownPath)}, then edit outlines/chapters-${options.volume}.draft.json or run longgu write chapter.`);
    });
  });

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
      const result = await auditChapter({
        workspaceDir,
        chapterId: options.id,
        inputPath: options.input,
        config,
        readApiKey,
        generate: options.input ? undefined : generateWithOpenAICompatible
      });
      const criticalCount = result.audit.issues.filter((issue) => issue.severity === "critical").length;
      const warningCount = result.audit.issues.filter((issue) => issue.severity === "warning").length;
      console.log(`Audit JSON: ${result.jsonPath}`);
      console.log(`Audit Markdown: ${result.markdownPath}`);
      console.log(`Status: ${result.audit.status}`);
      console.log(`Blocked: ${result.audit.blocked}`);
      console.log(`Contract: ${result.audit.contract.status}`);
      console.log(`Critical: ${criticalCount}`);
      console.log(`Warning: ${warningCount}`);
      console.log(`Next: review ${path.relative(workspaceDir, result.markdownPath)}, then run longgu revise chapter --id ${options.id}.`);
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
      const mode = options.mode ? RevisionModeSchema.parse(options.mode) : undefined;
      const result = await reviseChapter({
        workspaceDir,
        chapterId: options.id,
        mode,
        inputPath: options.input,
        postAuditPath: options.postAudit,
        config,
        readApiKey,
        generate: options.input ? undefined : generateWithOpenAICompatible
      });
      console.log(`Revision record: ${result.revisionDir}`);
      console.log(`Mode: ${result.metadata.mode}`);
      console.log(`Selected issues: ${result.metadata.selectedIssueIds.length}`);
      console.log(`Diff: ${result.diffPath}`);
      console.log(`Next: review ${path.relative(workspaceDir, result.diffPath)}, then run longgu audit chapter --id ${options.id}.`);
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

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("--max-tokens must be a positive integer.");
  }
  return parsed;
}

function parseNonNegativeNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Value must be a non-negative number.");
  }
  return parsed;
}

function parseScore(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
    throw new Error("Score must be a number from 0 to 10.");
  }
  return parsed;
}

function parseExperimentSortKey(value: string) {
  return ExperimentSortKeySchema.parse(value);
}
