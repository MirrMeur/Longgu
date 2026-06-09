import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace } from "../test/testUtils.js";
import {
  HooksLedgerSchema,
  ReaderPromisesLedgerSchema,
  ResourcesLedgerSchema,
  StateDeltaSchema,
  TimelineLedgerSchema,
  TruthLedgerSchema,
  CharactersLedgerSchema,
  checkState,
  initStateLedgers,
  inspectState,
  loadStateLedger,
  settleChapterState,
  stateLedgerFiles
} from "./state.js";
import { latestRun } from "./runs.js";

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

describe("inspectState", () => {
  it("summarizes validated state ledgers", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-inspect-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });

    const entries = await inspectState(dir);

    expect(entries).toContainEqual({
      file: "truth.json",
      ledger: "truth",
      count: 0,
      updatedAt: "2026-06-09T09:00:00.000Z"
    });
    expect(entries).toHaveLength(6);
  });
});

describe("checkState", () => {
  it("writes a passing state consistency report", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-check-pass-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });

    const result = await checkState({
      workspaceDir: dir,
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(result.report.status).toBe("passed");
    expect(result.report.issues).toEqual([]);
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("Status: passed");
  });

  it("reports dangling resource owner references", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-check-warning-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(
      path.join(dir, "state", "resources.json"),
      `${JSON.stringify(
        ResourcesLedgerSchema.parse({
          schemaVersion: "longgu.story-state.v0.3",
          ledger: "resources",
          updatedAt: "2026-06-09T09:00:00.000Z",
          resources: [
            {
              id: "resource-001",
              name: "灵石",
              ownerCharacterId: "missing-character",
              quantity: "1",
              state: "随身"
            }
          ]
        }),
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await checkState({
      workspaceDir: dir,
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(result.report.status).toBe("needs-review");
    expect(result.report.issues[0]?.reason).toContain("missing-character");
  });

  it("reports overdue active reader promises when chapter context is provided", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-check-promise-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(
      path.join(dir, "state", "reader-promises.json"),
      `${JSON.stringify(
        ReaderPromisesLedgerSchema.parse({
          schemaVersion: "longgu.story-state.v0.3",
          ledger: "reader-promises",
          updatedAt: "2026-06-09T09:00:00.000Z",
          promises: [
            {
              id: "promise-001",
              text: "陆沉会查清灵石来历",
              status: "active",
              sourceChapterId: "001"
            }
          ]
        }),
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await checkState({
      workspaceDir: dir,
      chapterId: "008",
      promiseMaxAge: 5,
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(result.report.status).toBe("needs-review");
    expect(result.report.issues[0]).toMatchObject({
      id: "reader-promises-promise-001-overdue",
      severity: "warning",
      ledger: "reader-promises",
      itemId: "promise-001"
    });
    expect(result.report.issues[0]?.reason).toContain("7 chapter(s) old");
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain("reader-promises/promise-001");
  });

  it("does not report active reader promise age without chapter context", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-check-promise-no-chapter-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(
      path.join(dir, "state", "reader-promises.json"),
      `${JSON.stringify(
        ReaderPromisesLedgerSchema.parse({
          schemaVersion: "longgu.story-state.v0.3",
          ledger: "reader-promises",
          updatedAt: "2026-06-09T09:00:00.000Z",
          promises: [
            {
              id: "promise-001",
              text: "陆沉会查清灵石来历",
              status: "active",
              sourceChapterId: "001"
            }
          ]
        }),
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await checkState({
      workspaceDir: dir,
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(result.report.status).toBe("passed");
    expect(result.report.issues).toEqual([]);
  });
});

describe("settleChapterState", () => {
  it("applies a valid state delta and writes a settlement record", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-settle-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉得到一枚灵石。\n", "utf8");
    await mkdir(path.join(dir, "state", "deltas"), { recursive: true });
    const deltaPath = path.join(dir, "state", "deltas", "001.delta.json");
    await writeFile(
      deltaPath,
      `${JSON.stringify(
        StateDeltaSchema.parse({
          schemaVersion: "longgu.state-delta.v0.3",
          chapterId: "001",
          facts: [{ id: "fact-001", text: "陆沉得到一枚灵石。", sourceChapterId: "001" }],
          characters: [
            {
              id: "char-lu-chen",
              name: "陆沉",
              aliases: [],
              status: "得到一枚灵石",
              location: "宗门外院",
              goals: ["还债"],
              relationships: []
            }
          ],
          timelineEvents: [{ id: "event-001", chapterId: "001", order: 0, summary: "陆沉得到一枚灵石。" }],
          hooks: [{ id: "hook-001", text: "灵石来历可疑", status: "opened", openedInChapterId: "001" }],
          readerPromises: [{ id: "promise-001", text: "陆沉会查清灵石来历", status: "active", sourceChapterId: "001" }],
          resources: [
            {
              id: "resource-stone-001",
              name: "灵石",
              ownerCharacterId: "char-lu-chen",
              quantity: "1",
              state: "随身携带"
            }
          ]
        }),
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await settleChapterState({
      workspaceDir: dir,
      chapterId: "001",
      deltaPath,
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(result.diff).toContainEqual({
      ledger: "truth",
      added: ["fact-001"],
      updated: [],
      unchanged: []
    });
    expect(TruthLedgerSchema.parse(await loadStateLedger(dir, "truth.json")).facts).toHaveLength(1);
    expect(CharactersLedgerSchema.parse(await loadStateLedger(dir, "characters.json")).characters[0]?.name).toBe("陆沉");
    await expect(readFile(path.join(result.settlementDir, "metadata.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.state-settlement.v0.3\""
    );
    await expect(readFile(path.join(result.settlementDir, "diff.json"), "utf8")).resolves.toContain("\"fact-001\"");
  });

  it("extracts a model state delta when no delta file is provided", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-settle-model-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉得到一枚灵石。\n", "utf8");

    const result = await settleChapterState({
      workspaceDir: dir,
      chapterId: "001",
      config: {
        title: "测试小说",
        genre: "玄幻",
        language: "zh-CN",
        provider: {
          name: "openai-compatible",
          baseUrl: "https://api.example.com/v1",
          model: "test-model",
          apiKeyEnv: "TEST_API_KEY",
          temperature: 0.7,
          maxTokens: 1200
        }
      },
      apiKey: "secret",
      generate: async ({ prompt }) => {
        expect(prompt).toContain("chapters/001.md");
        return {
          text: JSON.stringify({
            schemaVersion: "longgu.state-delta.v0.3",
            chapterId: "001",
            facts: [{ id: "fact-001", text: "陆沉得到一枚灵石。", sourceChapterId: "001" }]
          })
        };
      },
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(result.metadata.deltaSource).toBe("model");
    expect(result.metadata.model).toBe("test-model");
    expect((await latestRun(dir))?.metadata.task).toBe("settle");
    await expect(readFile(path.join(result.settlementDir, "prompt.md"), "utf8")).resolves.toContain("状态沉淀器");
    await expect(readFile(path.join(result.settlementDir, "model-output.txt"), "utf8")).resolves.toContain("fact-001");
    expect(TruthLedgerSchema.parse(await loadStateLedger(dir, "truth.json")).facts).toHaveLength(1);
  });

  it("retries model extraction once after invalid output", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-settle-retry-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉得到一枚灵石。\n", "utf8");
    let calls = 0;

    const result = await settleChapterState({
      workspaceDir: dir,
      chapterId: "001",
      config: {
        title: "测试小说",
        genre: "玄幻",
        language: "zh-CN",
        provider: {
          name: "openai-compatible",
          baseUrl: "https://api.example.com/v1",
          model: "test-model",
          apiKeyEnv: "TEST_API_KEY",
          temperature: 0.7,
          maxTokens: 1200
        }
      },
      apiKey: "secret",
      generate: async ({ prompt }) => {
        calls += 1;
        if (calls === 1) {
          return { text: "not json" };
        }
        expect(prompt).toContain("上一次输出被拒绝");
        expect(prompt).toContain("provider response did not contain a JSON object");
        return {
          text: JSON.stringify({
            schemaVersion: "longgu.state-delta.v0.3",
            chapterId: "001",
            facts: [{ id: "fact-001", text: "陆沉得到一枚灵石。", sourceChapterId: "001" }]
          })
        };
      },
      now: new Date("2026-06-09T10:00:00.000Z")
    });

    expect(calls).toBe(2);
    await expect(readFile(path.join(result.settlementDir, "model-attempts.json"), "utf8")).resolves.toContain(
      "\"accepted\": false"
    );
    expect(TruthLedgerSchema.parse(await loadStateLedger(dir, "truth.json")).facts).toHaveLength(1);
  });

  it("fails model settlement after retry without mutating ledgers", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-settle-retry-fail-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n正文。\n", "utf8");
    const before = await readFile(path.join(dir, "state", "truth.json"), "utf8");
    let calls = 0;

    await expect(
      settleChapterState({
        workspaceDir: dir,
        chapterId: "001",
        config: {
          title: "测试小说",
          genre: "玄幻",
          language: "zh-CN",
          provider: {
            name: "openai-compatible",
            baseUrl: "https://api.example.com/v1",
            model: "test-model",
            apiKeyEnv: "TEST_API_KEY",
            temperature: 0.7,
            maxTokens: 1200
          }
        },
        apiKey: "secret",
        generate: async () => {
          calls += 1;
          return { text: "still not json" };
        },
        now: new Date("2026-06-09T10:00:00.000Z")
      })
    ).rejects.toThrow("State delta extraction failed after retry");

    expect(calls).toBe(2);
    await expect(readFile(path.join(dir, "state", "truth.json"), "utf8")).resolves.toBe(before);
    await expect(stat(path.join(dir, "state", "settlements"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects blocking conflicts before mutating ledgers", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-state-conflict-"));
    await createFixtureWorkspace(dir);
    await initStateLedgers({
      workspaceDir: dir,
      now: new Date("2026-06-09T09:00:00.000Z")
    });
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n正文。\n", "utf8");
    await writeFile(
      path.join(dir, "state", "truth.json"),
      `${JSON.stringify(
        TruthLedgerSchema.parse({
          schemaVersion: "longgu.story-state.v0.3",
          ledger: "truth",
          updatedAt: "2026-06-09T09:00:00.000Z",
          facts: [{ id: "fact-001", text: "旧事实", sourceChapterId: "001" }]
        }),
        null,
        2
      )}\n`,
      "utf8"
    );
    const before = await readFile(path.join(dir, "state", "truth.json"), "utf8");
    await mkdir(path.join(dir, "state", "deltas"), { recursive: true });
    const deltaPath = path.join(dir, "state", "deltas", "001-conflict.delta.json");
    await writeFile(
      deltaPath,
      `${JSON.stringify(
        StateDeltaSchema.parse({
          schemaVersion: "longgu.state-delta.v0.3",
          chapterId: "001",
          facts: [{ id: "fact-001", text: "新事实", sourceChapterId: "001" }]
        }),
        null,
        2
      )}\n`,
      "utf8"
    );

    await expect(
      settleChapterState({
        workspaceDir: dir,
        chapterId: "001",
        deltaPath,
        now: new Date("2026-06-09T10:00:00.000Z")
      })
    ).rejects.toThrow("fact fact-001 text is immutable");
    await expect(readFile(path.join(dir, "state", "truth.json"), "utf8")).resolves.toBe(before);
    await expect(stat(path.join(dir, "state", "settlements"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
