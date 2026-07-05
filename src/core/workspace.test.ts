import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertGuidedWorkspaceShape, assertWorkspaceShape, initWorkspace } from "./workspace.js";

describe("workspace", () => {
  it("initializes guided Chinese workspace files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-init-"));

    const result = await initWorkspace(dir);

    expect(result.created).toContain("当前步骤.md");
    expect(result.created).toContain("01_立项设定");
    expect(result.created).toContain("08_AI审稿");
    expect(result.created).toContain(path.join(".claude", "skills", "longgu-start", "SKILL.md"));
    expect(result.created).toContain(path.join(".claude", "skills", "longgu-help", "SKILL.md"));
    expect(await assertWorkspaceShape(dir)).toEqual([]);
    expect(await assertGuidedWorkspaceShape(dir)).toEqual([]);
    await expect(readFile(path.join(dir, "当前步骤.md"), "utf8")).resolves.toContain("你现在需要看");
    await expect(readFile(path.join(dir, "创作流程.md"), "utf8")).resolves.toContain("作者手改文件优先级最高");
    await expect(readFile(path.join(dir, "06_章节规划", "第001章_规划.md"), "utf8")).resolves.toContain("本章必须发生");
    await expect(readFile(path.join(dir, ".claude", "skills", "longgu-start", "SKILL.md"), "utf8")).resolves.toContain("立项/开书");
    await expect(readFile(path.join(dir, ".claude", "skills", "longgu-help", "SKILL.md"), "utf8")).resolves.toContain("解释当前项目结构");
  });

  it("keeps existing starter files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-init-"));
    await initWorkspace(dir);

    const result = await initWorkspace(dir);

    expect(result.existing).toContain("当前步骤.md");
    expect(result.existing).toContain("01_立项设定");
    expect(result.existing).toContain(path.join(".claude", "skills", "longgu-start", "SKILL.md"));
  });
});
