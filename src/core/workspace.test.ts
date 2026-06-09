import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertWorkspaceShape, initWorkspace } from "./workspace.js";

describe("workspace", () => {
  it("initializes V0.1 workspace files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-init-"));

    const result = await initWorkspace(dir);

    expect(result.created).toContain("longgu.yaml");
    expect(result.created).toContain("outlines");
    expect(await assertWorkspaceShape(dir)).toEqual([]);
    await expect(readFile(path.join(dir, "bible", "premise.md"), "utf8")).resolves.toContain("Premise");
  });

  it("keeps existing starter files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-init-"));
    await initWorkspace(dir);

    const result = await initWorkspace(dir);

    expect(result.existing).toContain("longgu.yaml");
    expect(result.existing).toContain("bible/premise.md");
  });
});
