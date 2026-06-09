import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";

const execFileAsync = promisify(execFile);
const cliPath = path.resolve("src", "cli", "index.ts");

describe("longgu plan CLI", () => {
  it("creates planning drafts through chapters", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-plan-chapters-"));
    await createFixtureWorkspace(dir);

    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "book", dir], {
      cwd: path.resolve(".")
    });
    const volumeResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "plan", "volume", "--id", "001", dir],
      { cwd: path.resolve(".") }
    );
    const chaptersResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "plan", "chapters", "--volume", "001", dir],
      { cwd: path.resolve(".") }
    );

    expect(volumeResult.stdout).toContain("Volume plan draft:");
    expect(volumeResult.stdout).toContain("Status: created");
    await expect(readFile(path.join(dir, "outlines", "volume-001.draft.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.volume-plan-draft.v0.2\""
    );
    expect(chaptersResult.stdout).toContain("Chapters plan draft:");
    expect(chaptersResult.stdout).toContain("Status: created");
    await expect(readFile(path.join(dir, "outlines", "chapters-001.draft.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.chapters-plan-draft.v0.2\""
    );
  });
});

describe("longgu state CLI", () => {
  it("initializes baseline state ledgers", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-state-init-"));
    await createFixtureWorkspace(dir);

    const result = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "state", "init", dir], {
      cwd: path.resolve(".")
    });

    expect(result.stdout).toContain("State ledgers:");
    expect(result.stdout).toContain("state/truth.json");
    await expect(readFile(path.join(dir, "state", "truth.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.story-state.v0.3\""
    );
  });

  it("inspects and settles chapter state", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-state-settle-"));
    await createFixtureWorkspace(dir);
    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "state", "init", "--force", dir], {
      cwd: path.resolve(".")
    });
    const inspectResult = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "state", "inspect", dir], {
      cwd: path.resolve(".")
    });
    expect(inspectResult.stdout).toContain("truth: 0 item(s)");

    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉得到一枚灵石。\n", "utf8");
    await mkdir(path.join(dir, "state", "deltas"), { recursive: true });
    const deltaPath = path.join(dir, "state", "deltas", "001.delta.json");
    await writeFile(
      deltaPath,
      `${JSON.stringify(
        {
          schemaVersion: "longgu.state-delta.v0.3",
          chapterId: "001",
          facts: [{ id: "fact-001", text: "陆沉得到一枚灵石。", sourceChapterId: "001" }]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const settleResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "settle", "chapter", "--id", "001", "--delta", deltaPath, dir],
      { cwd: path.resolve(".") }
    );

    expect(settleResult.stdout).toContain("Settlement record:");
    expect(settleResult.stdout).toContain("truth: 1 touched, 1 added");
    await expect(readFile(path.join(dir, "state", "truth.json"), "utf8")).resolves.toContain("fact-001");
  });
});
