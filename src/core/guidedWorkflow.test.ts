import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initWorkspace } from "./workspace.js";
import { analyzeAuthorEditImpact, approveCurrentStep, loadCurrentStepContext, updateCurrentStep } from "./guidedWorkflow.js";

describe("guided workflow", () => {
  it("loads current step, workflow, and referenced files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-guided-load-"));
    await initWorkspace(dir);

    const context = await loadCurrentStepContext(dir);

    expect(context.currentStep).toContain("阶段：1. 立项设定");
    expect(context.workflow).toContain("作者手改文件优先级最高");
    expect(context.requiredFiles.map((item) => item.file)).toEqual(
      expect.arrayContaining([
        "01_立项设定/创作目标.md",
        "01_立项设定/故事卖点.md",
        "01_立项设定/读者承诺.md",
        "01_立项设定/不写什么.md"
      ])
    );
    expect(context.missingFiles).toEqual([]);
  });

  it("updates current step and records approval decisions", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-guided-approve-"));
    await initWorkspace(dir);
    const nextStep = {
      stage: "2. 设定圣经",
      status: "等待作者审核",
      progress: "2 / 9",
      goal: "确认故事核心、世界、角色和风格。",
      requiredFiles: ["02_设定圣经/故事核心.md"],
      editableFiles: ["02_设定圣经/故事核心.md"],
      impact: ["03_大纲", "06_章节规划"],
      nextOutputs: ["03_大纲/全书大纲.md"],
      allowedReplies: ["批准当前步骤，进入下一步"]
    };

    await updateCurrentStep(dir, nextStep);
    await approveCurrentStep({
      workspaceDir: dir,
      decision: "确认立项设定。",
      nextStep,
      now: new Date("2026-07-04T00:00:00.000Z")
    });

    await expect(readFile(path.join(dir, "当前步骤.md"), "utf8")).resolves.toContain("阶段：2. 设定圣经");
    await expect(readFile(path.join(dir, "已确认决定.md"), "utf8")).resolves.toContain("确认立项设定");
  });

  it("reports downstream impact for author edits", () => {
    const impact = analyzeAuthorEditImpact(["02_设定圣经/角色设定/主角.md", "07_正文/第001章.md"]);

    expect(impact.affectedArtifacts).toEqual(
      expect.arrayContaining(["03_大纲", "04_伏笔与期待", "05_前情与状态", "06_章节规划", "07_正文", "08_AI审稿"])
    );
  });
});
