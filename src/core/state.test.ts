import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import {
  HooksLedgerSchema,
  ReaderPromisesLedgerSchema,
  ResourcesLedgerSchema,
  TimelineLedgerSchema,
  TruthLedgerSchema,
  CharactersLedgerSchema,
  initStateLedgers,
  loadStateLedger,
  stateLedgerFiles
} from "./state.js";

describe("initStateLedgers", () => {
  it("creates validated baseline ledgers", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-init-"));
    await createFixtureWorkspace(dir);

    const result = await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T07:00:00.000Z")
    });

    expect(result.outputDir).toBe(path.join(dir, "state"));
    expect(result.created).toEqual(stateLedgerFiles.map((file) => path.join("state", file)));
    expect(result.overwritten).toEqual([]);

    expect(TruthLedgerSchema.parse(await loadStateLedger(dir, "truth.json"))).toMatchObject({
      schemaVersion: "longgu.story-state.v0.3",
      ledger: "truth",
      facts: [],
      updatedAt: "2026-06-09T07:00:00.000Z"
    });
    expect(CharactersLedgerSchema.parse(await loadStateLedger(dir, "characters.json")).characters).toEqual([]);
    expect(TimelineLedgerSchema.parse(await loadStateLedger(dir, "timeline.json")).events).toEqual([]);
    expect(HooksLedgerSchema.parse(await loadStateLedger(dir, "hooks.json")).hooks).toEqual([]);
    expect(ReaderPromisesLedgerSchema.parse(await loadStateLedger(dir, "reader-promises.json")).promises).toEqual([]);
    expect(ResourcesLedgerSchema.parse(await loadStateLedger(dir, "resources.json")).resources).toEqual([]);
  });

  it("refuses to overwrite an existing ledger without force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-init-"));
    await createFixtureWorkspace(dir);
    const truthPath = path.join(dir, "state", "truth.json");
    await writeFile(truthPath, "{\"kept\":true}\n", "utf8");

    await expect(initStateLedgers({ workspaceDir: dir })).rejects.toThrow("State ledgers already exist");
    await expect(readFile(truthPath, "utf8")).resolves.toBe("{\"kept\":true}\n");
  });

  it("replaces existing ledgers with force", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-init-"));
    await createFixtureWorkspace(dir);
    const truthPath = path.join(dir, "state", "truth.json");
    await writeFile(truthPath, "{\"old\":true}\n", "utf8");

    const result = await initStateLedgers({
      workspaceDir: dir,
      force: true,
      now: new Date("2026-06-09T08:00:00.000Z")
    });

    expect(result.overwritten).toContain("state/truth.json");
    const saved = TruthLedgerSchema.parse(await loadStateLedger(dir, "truth.json"));
    expect(saved.updatedAt).toBe("2026-06-09T08:00:00.000Z");
  });
});
