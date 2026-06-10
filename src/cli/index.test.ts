import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  createFixtureWorkspace,
  createHostOnlyFixtureWorkspace,
  createPlanningStateFixture,
  createRoutingFixtureWorkspace
} from "../test/testUtils.js";

const execFileAsync = promisify(execFile);
const cliPath = path.resolve("src", "cli", "index.ts");

describe("longgu stable CLI discovery", () => {
  it("reports V1.0 version and stable command groups", async () => {
    const versionResult = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "--version"], {
      cwd: path.resolve(".")
    });
    expect(versionResult.stdout.trim()).toBe("1.0.0");

    const helpResult = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "--help"], {
      cwd: path.resolve(".")
    });
    for (const command of [
      "init",
      "doctor",
      "write",
      "plan",
      "model",
      "cost",
      "feedback",
      "genre",
      "context",
      "experiment",
      "run",
      "state",
      "settle",
      "audit",
      "revise"
    ]) {
      expect(helpResult.stdout).toContain(command);
    }
  });
});

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
      ["--import", "tsx", cliPath, "plan", "chapters", "--volume", "001", "--skip-volume-audit", dir],
      { cwd: path.resolve(".") }
    );

    expect(volumeResult.stdout).toContain("Volume plan draft:");
    expect(volumeResult.stdout).toContain("Status: created");
    expect(volumeResult.stdout).toContain("Next: review outlines/volume-001.draft.json");
    await expect(readFile(path.join(dir, "outlines", "volume-001.draft.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.volume-plan-draft.v0.2\""
    );
    expect(chaptersResult.stdout).toContain("Chapters plan draft:");
    expect(chaptersResult.stdout).toContain("Status: created");
    expect(chaptersResult.stdout).toContain("Next: review chapter cards");
    await expect(readFile(path.join(dir, "outlines", "chapters-001.draft.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.chapters-plan-draft.v0.2\""
    );
  });

  it("blocks chapter planning without a passed volume audit by default", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-plan-chapters-audit-gate-"));
    await createFixtureWorkspace(dir);

    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "book", dir], {
      cwd: path.resolve(".")
    });
    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "volume", "--id", "001", dir], {
      cwd: path.resolve(".")
    });

    await expect(
      execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "chapters", "--volume", "001", dir], {
        cwd: path.resolve(".")
      })
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("Volume plan audit is required before chapter planning for volume 001")
    });
  });
});

describe("longgu plan audit CLI", () => {
  it("audits a generated volume plan draft", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-audit-volume-plan-"));
    await createFixtureWorkspace(dir);

    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "book", dir], {
      cwd: path.resolve(".")
    });
    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "volume", "--id", "001", dir], {
      cwd: path.resolve(".")
    });

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "audit", "volume-plan", "--id", "001", dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Volume plan audit JSON:");
    expect(result.stdout).toContain("Status: needs-revision");
    expect(result.stdout).toContain("Warning:");
    await expect(readFile(path.join(dir, "audits", "volume-001.plan-audit.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.volume-plan-audit.v0.2\""
    );
    await expect(readFile(path.join(dir, "audits", "volume-001.plan-audit.md"), "utf8")).resolves.toContain(
      "Volume Plan Audit 001"
    );
  });

  it("audits a generated chapter plan draft", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-audit-chapter-plan-"));
    await createFixtureWorkspace(dir);

    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "book", dir], {
      cwd: path.resolve(".")
    });
    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "plan", "volume", "--id", "001", dir], {
      cwd: path.resolve(".")
    });
    await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "plan", "chapters", "--volume", "001", "--skip-volume-audit", dir],
      {
        cwd: path.resolve(".")
      }
    );

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "audit", "chapter-plan", "--volume", "001", dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Chapter plan audit JSON:");
    expect(result.stdout).toContain("Status: needs-revision");
    expect(result.stdout).toContain("Warning:");
    await expect(readFile(path.join(dir, "audits", "chapters-001.plan-audit.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.chapter-plan-audit.v0.2\""
    );
    await expect(readFile(path.join(dir, "audits", "chapters-001.plan-audit.md"), "utf8")).resolves.toContain(
      "Chapter Plan Audit 001"
    );
  });
});

describe("longgu genre CLI", () => {
  it("lists and shows genre cards", async () => {
    const listResult = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "genre", "list"], {
      cwd: path.resolve(".")
    });
    expect(listResult.stdout).toContain("xuanhuan");
    expect(listResult.stdout).toContain("supernatural-mystery");

    const showResult = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "genre", "show", "玄幻"], {
      cwd: path.resolve(".")
    });
    expect(JSON.parse(showResult.stdout)).toMatchObject({ id: "xuanhuan", name: "玄幻" });
  });
});

describe("longgu model and cost CLI", () => {
  it("lists configured model profiles and routes", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-model-list-"));
    await createRoutingFixtureWorkspace(dir);

    const result = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "model", "list", dir], {
      cwd: path.resolve(".")
    });

    expect(result.stdout).toContain("Models:");
    expect(result.stdout).toContain("fast\topenai-compatible\tfast-model");
    expect(result.stdout).toContain("strong\topenai-compatible\tstrong-model");
    expect(result.stdout).toContain("drafting -> fast fallback=strong important=strong");
  });

  it("reports aggregated run costs", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-cost-report-"));
    await createFixtureWorkspace(dir);
    const runDir = path.join(dir, "runs", "2026-06-09T12-00-00-000Z");
    await mkdir(runDir, { recursive: true });
    await writeFile(
      path.join(runDir, "metadata.json"),
      `${JSON.stringify(
        {
          id: "2026-06-09T12-00-00-000Z",
          status: "success",
          chapterId: "001",
          task: "drafting",
          provider: "openai-compatible",
          model: "strong-model",
          modelProfile: "strong",
          startedAt: "2026-06-09T12:00:00.000Z",
          finishedAt: "2026-06-09T12:00:01.000Z",
          durationMs: 1000,
          inputFiles: ["bible/premise.md"],
          promptFile: "prompt.md",
          outputFile: "output.md",
          fallbackAttempts: 1,
          inputTokens: 1000,
          outputTokens: 500,
          estimatedCost: 0.025
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "cost", "report", dir], {
      cwd: path.resolve(".")
    });

    expect(result.stdout).toContain("Runs: 1");
    expect(result.stdout).toContain("Input tokens: 1000");
    expect(result.stdout).toContain("Estimated cost: 0.025");
    expect(result.stdout).toContain("drafting\t1 run(s)");
    expect(result.stdout).toContain("strong\t1 run(s)");
  });
});

describe("longgu feedback CLI", () => {
  it("records chapter feedback", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-feedback-"));
    await createFixtureWorkspace(dir);

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "feedback", "chapter", "--id", "001", "--score", "6", "--comment", "情节推进太慢", dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Feedback file:");
    expect(result.stdout).toContain("Entries: 1");
    expect(result.stdout).toContain("Next: run longgu context build --chapter 001");
    await expect(readFile(path.join(dir, "feedback", "001.feedback.json"), "utf8")).resolves.toContain("情节推进太慢");
  });
});

describe("longgu host LLM write CLI", () => {
  it("exports a host prompt and imports a host generated chapter", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-host-write-"));
    await createHostOnlyFixtureWorkspace(dir);
    await mkdir(path.join(dir, "drafts"), { recursive: true });

    const promptResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "write", "chapter", "--id", "001", "--host-prompt", dir],
      { cwd: path.resolve(".") }
    );
    expect(promptResult.stdout).toContain("Host prompt:");
    await expect(readFile(path.join(dir, "host-prompts", "001.prompt.md"), "utf8")).resolves.toContain(
      "请开始写第 001 章"
    );

    await writeFile(path.join(dir, "drafts", "001.md"), "# 第一章\n\n宿主模型写出的正文。", "utf8");
    const importResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "write", "chapter", "--id", "001", "--input", "drafts/001.md", dir],
      { cwd: path.resolve(".") }
    );

    expect(importResult.stdout).toContain("Imported chapter:");
    await expect(readFile(path.join(dir, "chapters", "001.md"), "utf8")).resolves.toContain("宿主模型写出的正文");
  });

  it("requires passed chapter-plan audit for planned host prompt unless skipped", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-host-write-plan-audit-"));
    await createPlanningStateFixture(dir);
    await rm(path.join(dir, "audits", "chapters-001.plan-audit.json"));

    await expect(
      execFileAsync(process.execPath, ["--import", "tsx", cliPath, "write", "chapter", "--id", "001", "--host-prompt", dir], {
        cwd: path.resolve(".")
      })
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("Chapter plan audit is required before drafting")
    });

    const skipped = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "write", "chapter", "--id", "001", "--host-prompt", "--skip-plan-audit", dir],
      { cwd: path.resolve(".") }
    );
    expect(skipped.stdout).toContain("Host prompt:");
  });
});

describe("longgu experiment CLI", () => {
  it("creates, registers, scores, and compares experiment variants", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-experiment-"));
    await createFixtureWorkspace(dir);
    await mkdir(path.join(dir, "drafts"), { recursive: true });
    await writeFile(path.join(dir, "drafts", "hook-a.md"), "# A\n\n测试石裂开。\n", "utf8");
    await writeFile(path.join(dir, "drafts", "hook-b.md"), "# B\n\n执事冷笑。\n", "utf8");

    const createResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "experiment", "create", "--id", "opening-ab", "--goal", "测试开篇钩子", dir],
      { cwd: path.resolve(".") }
    );
    expect(createResult.stdout).toContain("Experiment manifest:");

    await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        "experiment",
        "run",
        "--id",
        "opening-ab",
        "--variant",
        "hook-a",
        "--input",
        "drafts/hook-a.md",
        "--model",
        "fast",
        "--cost",
        "0.01",
        dir
      ],
      { cwd: path.resolve(".") }
    );
    await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        "experiment",
        "run",
        "--id",
        "opening-ab",
        "--variant",
        "hook-b",
        "--input",
        "drafts/hook-b.md",
        "--model",
        "strong",
        "--cost",
        "0.03",
        dir
      ],
      { cwd: path.resolve(".") }
    );
    await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        "experiment",
        "score",
        "--id",
        "opening-ab",
        "--variant",
        "hook-a",
        "--payoff",
        "7",
        "--hook",
        "9",
        "--ai-flavor",
        "2",
        dir
      ],
      { cwd: path.resolve(".") }
    );
    await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        "experiment",
        "score",
        "--id",
        "opening-ab",
        "--variant",
        "hook-b",
        "--payoff",
        "8",
        "--hook",
        "6",
        "--ai-flavor",
        "3",
        dir
      ],
      { cwd: path.resolve(".") }
    );
    const compareResult = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "experiment", "compare", "--id", "opening-ab", "--sort", "hook", dir],
      { cwd: path.resolve(".") }
    );

    expect(compareResult.stdout).toContain("Compare JSON:");
    await expect(readFile(path.join(dir, "experiments", "opening-ab", "compare.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.experiment-compare.v0.9\""
    );
    const compare = JSON.parse(await readFile(path.join(dir, "experiments", "opening-ab", "compare.json"), "utf8")) as {
      variants: Array<{ variantId: string }>;
    };
    expect(compare.variants.map((variant) => variant.variantId)).toEqual(["hook-a", "hook-b"]);
  });
});

describe("longgu context CLI", () => {
  it("builds a chapter context pack", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-context-"));
    await createPlanningStateFixture(dir);

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "context", "build", "--chapter", "001", "--max-tokens", "200", dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Context JSON:");
    expect(result.stdout).toContain("Context Markdown:");
    expect(result.stdout).toContain("Included sections:");
    expect(result.stdout).toContain("Next: inspect context/001.context.md");
    await expect(readFile(path.join(dir, "context", "001.context.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.context-pack.v0.7\""
    );
    await expect(readFile(path.join(dir, "context", "001.context.md"), "utf8")).resolves.toContain("Context Pack 001");
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

  it("checks reader promise debt with chapter context", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-state-check-promise-"));
    await createFixtureWorkspace(dir);
    await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "state", "init", "--force", dir], {
      cwd: path.resolve(".")
    });
    await writeFile(
      path.join(dir, "state", "reader-promises.json"),
      `${JSON.stringify(
        {
          schemaVersion: "longgu.story-state.v0.3",
          ledger: "reader-promises",
          updatedAt: "2026-06-09T09:00:00.000Z",
          promises: [
            {
              id: "promise-v1-001",
              text: "陆沉会查清灵石来历",
              status: "active",
              sourceChapterId: "v1-001"
            }
          ]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "state", "check", "--chapter", "v1-050", "--promise-max-age", "5", dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Status: needs-review");
    expect(result.stdout).toContain("Issues: 1");
    const checksDir = path.join(dir, "state", "checks");
    const entries = await readdir(checksDir);
    const markdownFile = entries.find((entry) => entry.endsWith(".md"));
    expect(markdownFile).toBeDefined();
    await expect(readFile(path.join(checksDir, markdownFile ?? ""), "utf8")).resolves.toContain(
      "reader-promises/promise-v1-001"
    );
  });
});

describe("longgu audit CLI", () => {
  it("audits a chapter from provided raw audit input", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-audit-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉站在宗门门口。\n", "utf8");
    await mkdir(path.join(dir, "audits"), { recursive: true });
    const inputPath = path.join(dir, "audits", "001.raw-audit.json");
    await writeFile(
      inputPath,
      `${JSON.stringify(
        {
          schemaVersion: "longgu.chapter-audit.v0.4",
          chapterId: "001",
          genre: "玄幻",
          summary: "章节可读，但尾钩偏弱。",
          scores: {
            retention: 6,
            readability: 7,
            aiFlavor: 4,
            scenePressure: 5,
            characterVoice: 6
          },
          issues: [
            {
              id: "issue-001",
              checkerPriority: "P1",
              source: "chapter-plan",
              dimension: "weak-ending-hook",
              location: "结尾",
              reason: "结尾没有形成明确下一章问题。",
              fix: "加入具体威胁或选择。"
            }
          ]
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "audit", "chapter", "--id", "001", "--input", inputPath, dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Audit JSON:");
    expect(result.stdout).toContain("Status: needs-revision");
    expect(result.stdout).toContain("Contract: incomplete");
    expect(result.stdout).toContain("Warning: 1");
    await expect(readFile(path.join(dir, "audits", "001.audit.json"), "utf8")).resolves.toContain(
      "\"schemaVersion\": \"longgu.chapter-audit.v0.4\""
    );
    await expect(readFile(path.join(dir, "audits", "001.audit.md"), "utf8")).resolves.toContain("Chapter Audit 001");
  });
});

describe("longgu revise CLI", () => {
  it("revises a chapter from provided Markdown input", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-cli-revise-"));
    await createFixtureWorkspace(dir);
    await writeFile(path.join(dir, "chapters", "001.md"), "# 第一章\n\n陆沉站在门口。\n", "utf8");
    await mkdir(path.join(dir, "audits"), { recursive: true });
    await writeFile(
      path.join(dir, "audits", "001.audit.json"),
      `${JSON.stringify(
        {
          schemaVersion: "longgu.chapter-audit.v0.4",
          chapterId: "001",
          genre: "玄幻",
          status: "needs-revision",
          summary: "需要定点修复。",
          scores: {
            retention: 6,
            readability: 7,
            aiFlavor: 4,
            scenePressure: 5,
            characterVoice: 6
          },
          contract: {
            status: "complete",
            missing: [],
            startHook: "陆沉被外部压力推到宗门门口。",
            protagonistGoal: "他要进入宗门并保住机会。",
            obstacle: "旁人质疑他的资格。",
            turn: "他发现旧问题必须当场解决。",
            payoff: "章节给出可见状态变化。",
            tailHook: "新的考验即将出现。",
            diagnosis: "测试夹具提供完整章节契约。"
          },
          issues: [
            {
              id: "issue-001",
              severity: "warning",
              source: "prose",
              dimension: "ai-explanatory-tone",
              location: "第二段",
              reason: "解释感过重。",
              fix: "改成可观察动作。"
            }
          ],
          reviseQueue: ["issue-001"],
          blocked: false,
          sourceFiles: ["chapters/001.md"],
          generatedAt: "2026-06-09T12:00:00.000Z"
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    const revisionInput = path.join(dir, "revisions", "001.candidate.md");
    await mkdir(path.dirname(revisionInput), { recursive: true });
    await writeFile(revisionInput, "# 第一章\n\n陆沉扣紧袖口，站在门口。\n", "utf8");

    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", cliPath, "revise", "chapter", "--id", "001", "--input", revisionInput, dir],
      { cwd: path.resolve(".") }
    );

    expect(result.stdout).toContain("Revision record:");
    expect(result.stdout).toContain("Mode: spot-fix");
    await expect(readFile(path.join(dir, "chapters", "001.md"), "utf8")).resolves.toContain("扣紧袖口");
  });
});
