import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import { analyzePacing } from "./pacing.js";

describe("pacing analysis", () => {
  it("writes deterministic cross-chapter pacing reports", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-pacing-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉被逼上台。「跪下！」他夺回灵石，测试石忽然裂开？\n", "utf8");
    await writeFile(path.join(dir, "chapters", "002.md"), "# 第二章\n\n陆沉转身追上执事，公开翻盘，门外黑影亮起。\n", "utf8");

    const result = await analyzePacing({
      workspaceDir: dir,
      from: "001",
      to: "002",
      now: new Date("2026-06-10T12:00:00.000Z")
    });

    expect(result.report.chapterIds).toEqual(["001", "002"]);
    expect(result.report.cliffhangerDensity).toBeGreaterThan(0);
    expect(result.report.emotionalCurve).toHaveLength(2);
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("Pacing Report");
  });
});
