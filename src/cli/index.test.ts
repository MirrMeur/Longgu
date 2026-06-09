import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";

const execFileAsync = promisify(execFile);
const cliPath = path.resolve("src", "cli", "index.ts");

describe("longgu plan volume CLI", () => {
  it("creates a volume draft after book planning", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-plan-volume-"));
    await createFixtureWorkspace(dir);

    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "book", dir], {
      cwd: path.resolve(".")
    });
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "plan", "volume", "--id", "001", dir],
      { cwd: path.resolve(".") }
    );

    expect(stdout).toContain("Volume plan draft:");
    expect(stdout).toContain("Status: created");
    await expect(readFile(path.join(dir, "outlines", "volume-001.draft.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.volume-plan-draft.v0.2\""
    );
  });
});
