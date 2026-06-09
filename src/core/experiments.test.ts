import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import {
  compareExperiment,
  createExperiment,
  ExperimentCompareSchema,
  generateExperimentVariant,
  registerExperimentVariant,
  scoreExperimentVariant
} from "./experiments.js";
import { latestRun } from "./runs.js";

describe("experiments", () => {
  it("creates, registers, scores, and compares variants", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-experiment-"));
    await createFixtureWorkspace(dir);
    await mkdir(path.join(dir, "drafts"), { recursive: true });
    await writeFile(path.join(dir, "drafts", "hook-a.md"), "# A\n\n测试石裂开。\n", "utf8");
    await writeFile(path.join(dir, "drafts", "hook-b.md"), "# B\n\n执事冷笑。\n", "utf8");

    const created = await createExperiment({
      workspaceDir: dir,
      id: "opening-ab",
      goal: "测试开篇钩子",
      now: new Date("2026-06-09T12:00:00.000Z")
    });
    expect(created.manifest.schemaVersion).toBe("longgu.experiment.v0.9");

    await registerExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-ab",
      variantId: "hook-a",
      inputPath: "drafts/hook-a.md",
      modelProfile: "fast",
      estimatedCost: 0.01,
      now: new Date("2026-06-09T12:01:00.000Z")
    });
    await registerExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-ab",
      variantId: "hook-b",
      inputPath: "drafts/hook-b.md",
      modelProfile: "strong",
      estimatedCost: 0.03,
      now: new Date("2026-06-09T12:02:00.000Z")
    });
    await scoreExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-ab",
      variantId: "hook-a",
      payoff: 7,
      hook: 9,
      aiFlavor: 2,
      note: "钩子强",
      now: new Date("2026-06-09T12:03:00.000Z")
    });
    await scoreExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-ab",
      variantId: "hook-b",
      payoff: 8,
      hook: 6,
      aiFlavor: 3,
      note: "爽点强",
      now: new Date("2026-06-09T12:04:00.000Z")
    });

    const compared = await compareExperiment({
      workspaceDir: dir,
      experimentId: "opening-ab",
      sort: "hook",
      now: new Date("2026-06-09T12:05:00.000Z")
    });

    expect(compared.compare.variants.map((variant) => variant.variantId)).toEqual(["hook-a", "hook-b"]);
    expect(compared.compare.variants[0]).toMatchObject({ hook: 9, estimatedCost: 0.01 });
    const written = ExperimentCompareSchema.parse(JSON.parse(await readFile(compared.jsonPath, "utf8")) as unknown);
    expect(written.schemaVersion).toBe("longgu.experiment-compare.v0.9");
    await expect(readFile(compared.markdownPath, "utf8")).resolves.toContain("| hook-a | fast |");
  });

  it("sorts variants by audited chapter contract strength", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-experiment-contract-"));
    await createFixtureWorkspace(dir);
    await mkdir(path.join(dir, "drafts"), { recursive: true });
    await mkdir(path.join(dir, "audits"), { recursive: true });
    await writeFile(path.join(dir, "drafts", "complete.md"), "# A\n\n完整契约候选。\n", "utf8");
    await writeFile(path.join(dir, "drafts", "incomplete.md"), "# B\n\n缺尾钩候选。\n", "utf8");
    await writeFile(path.join(dir, "audits", "complete.audit.json"), `${JSON.stringify(createAudit("complete"), null, 2)}\n`, "utf8");
    await writeFile(
      path.join(dir, "audits", "incomplete.audit.json"),
      `${JSON.stringify(createAudit("incomplete"), null, 2)}\n`,
      "utf8"
    );

    await createExperiment({
      workspaceDir: dir,
      id: "opening-contract",
      goal: "比较开篇章节契约",
      now: new Date("2026-06-09T12:00:00.000Z")
    });
    await registerExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-contract",
      variantId: "complete",
      inputPath: "drafts/complete.md",
      auditFile: "audits/complete.audit.json",
      now: new Date("2026-06-09T12:01:00.000Z")
    });
    await registerExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-contract",
      variantId: "incomplete",
      inputPath: "drafts/incomplete.md",
      auditFile: "audits/incomplete.audit.json",
      now: new Date("2026-06-09T12:02:00.000Z")
    });
    await scoreExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-contract",
      variantId: "complete",
      payoff: 7,
      hook: 6,
      aiFlavor: 2,
      now: new Date("2026-06-09T12:03:00.000Z")
    });
    await scoreExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-contract",
      variantId: "incomplete",
      payoff: 8,
      hook: 9,
      aiFlavor: 2,
      now: new Date("2026-06-09T12:04:00.000Z")
    });

    const compared = await compareExperiment({
      workspaceDir: dir,
      experimentId: "opening-contract",
      sort: "contract",
      now: new Date("2026-06-09T12:05:00.000Z")
    });

    expect(compared.compare.variants.map((variant) => variant.variantId)).toEqual(["complete", "incomplete"]);
    expect(compared.compare.variants[0]).toMatchObject({
      auditContractStatus: "complete",
      auditContractMissingCount: 0,
      auditContractDiagnosis: "章节契约完整。"
    });
    expect(compared.compare.variants[1]).toMatchObject({
      auditContractStatus: "incomplete",
      auditContractMissingCount: 2
    });
    const markdown = await readFile(compared.markdownPath, "utf8");
    expect(markdown).toContain("| Variant | Model | Payoff | Hook | AI Flavor | Contract | Missing | Setting Conflict | Cost | Note |");
    expect(markdown).toContain("| complete | manual | 7 | 6 | 2 | complete | 0 | 0 | n/a |  |");
  });

  it("generates a model-backed variant and includes it in comparison", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-experiment-generate-"));
    await createFixtureWorkspace(dir);
    await mkdir(path.join(dir, "prompts"), { recursive: true });
    await writeFile(path.join(dir, "prompts", "hook-a.md"), "写一个强章尾钩子的候选稿。", "utf8");
    await createExperiment({
      workspaceDir: dir,
      id: "opening-ab",
      goal: "测试开篇钩子",
      now: new Date("2026-06-09T12:00:00.000Z")
    });

    const generated = await generateExperimentVariant({
      workspaceDir: dir,
      experimentId: "opening-ab",
      variantId: "hook-a",
      promptPath: "prompts/hook-a.md",
      apiKey: "secret",
      generate: async ({ prompt }) => ({ text: `# A\n\n${prompt.includes("章尾钩子") ? "测试石裂开。" : "正文"}` }),
      now: new Date("2026-06-09T12:01:00.000Z")
    });

    await expect(readFile(generated.outputPath, "utf8")).resolves.toContain("测试石裂开");
    expect(generated.metadata.runId).toBeDefined();
    expect(generated.metadata.modelProfile).toBe("default");
    expect((await latestRun(dir))?.metadata.task).toBe("experiment");

    const compared = await compareExperiment({
      workspaceDir: dir,
      experimentId: "opening-ab",
      now: new Date("2026-06-09T12:02:00.000Z")
    });
    expect(compared.compare.variants.map((variant) => variant.variantId)).toEqual(["hook-a"]);
  });
});

function createAudit(contractStatus: "complete" | "incomplete") {
  const missing = contractStatus === "complete" ? [] : ["payoff", "tailHook"];
  return {
    schemaVersion: "longgu.chapter-audit.v0.4",
    chapterId: contractStatus,
    genre: "玄幻",
    status: contractStatus === "complete" ? "passed" : "needs-revision",
    summary: contractStatus === "complete" ? "章节契约完整。" : "章节缺少兑现和尾钩。",
    scores: {
      retention: contractStatus === "complete" ? 8 : 7,
      readability: 8,
      aiFlavor: 2,
      scenePressure: 8,
      characterVoice: 7
    },
    issues:
      contractStatus === "complete"
        ? []
        : [
            {
              id: "contract-tail",
              severity: "warning",
              source: "prose",
              dimension: "weak-ending-hook",
              location: "结尾",
              reason: "章尾没有明确下一场问题。",
              fix: "补一个具体选择或威胁。"
            }
          ],
    contract: {
      status: contractStatus,
      missing,
      startHook: "主角被当众逼上测灵台。",
      protagonistGoal: "主角要证明自己没有废掉。",
      obstacle: "执事提高门槛。",
      turn: "灵碑出现旧骨纹。",
      payoff: contractStatus === "complete" ? "众人确认主角被封过异骨。" : "未评估",
      tailHook: contractStatus === "complete" ? "长老要求封场。" : "未评估",
      diagnosis: contractStatus === "complete" ? "章节契约完整。" : "章节契约缺少：可见兑现、章尾钩子。"
    },
    reviseQueue: contractStatus === "complete" ? [] : ["contract-tail"],
    blocked: false,
    sourceFiles: ["chapters/001.md"],
    generatedAt: "2026-06-09T12:00:00.000Z"
  };
}
