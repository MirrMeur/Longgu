import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import {
  compareExperiment,
  createExperiment,
  ExperimentCompareSchema,
  registerExperimentVariant,
  scoreExperimentVariant
} from "./experiments.js";

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
});
