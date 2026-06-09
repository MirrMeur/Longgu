import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
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
});
