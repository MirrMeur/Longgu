import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createFixtureWorkspace(root: string): Promise<void> {
  await mkdir(path.join(root, "bible"), { recursive: true });
  await mkdir(path.join(root, "outlines"), { recursive: true });
  await mkdir(path.join(root, "state"), { recursive: true });
  await mkdir(path.join(root, "chapters"), { recursive: true });
  await mkdir(path.join(root, "runs"), { recursive: true });
  await writeFile(
    path.join(root, "longgu.yaml"),
    `title: 测试小说
genre: 玄幻
language: zh-CN
provider:
  name: openai-compatible
  baseUrl: https://api.example.com/v1
  model: test-model
  apiKeyEnv: TEST_NOVEL_API_KEY
  temperature: 0.7
  maxTokens: 1200
context:
  maxTokens: 16000
`,
    "utf8"
  );
  await writeFile(path.join(root, "bible", "premise.md"), "# Premise\n\n少年负债入宗门。\n", "utf8");
  await writeFile(path.join(root, "bible", "characters.md"), "# Characters\n\n主角：陆沉。\n", "utf8");
  await writeFile(path.join(root, "bible", "world.md"), "# World\n\n灵石是硬通货。\n", "utf8");
  await writeFile(path.join(root, "bible", "style.md"), "# Style\n\n节奏快，少解释。\n", "utf8");
}

export async function createHostOnlyFixtureWorkspace(root: string): Promise<void> {
  await createFixtureWorkspace(root);
  await writeFile(
    path.join(root, "longgu.yaml"),
    `title: 测试小说
genre: 玄幻
language: zh-CN
context:
  maxTokens: 16000
`,
    "utf8"
  );
}

export async function createPlanningStateFixture(root: string): Promise<void> {
  await createFixtureWorkspace(root);
  const now = "2026-06-09T12:00:00.000Z";
  await writeFile(
    path.join(root, "outlines", "volume-001.draft.json"),
    `${JSON.stringify(
      {
        schemaVersion: "longgu.volume-plan-draft.v0.2",
        status: "draft",
        volumeId: "001",
        title: "测试小说 第一卷",
        genre: "玄幻",
        bookPlanSource: "outlines/book.draft.json",
        volumeGoal: "陆沉进入宗门并拿到第一条资源链。",
        primaryAntagonist: "外门执事",
        conflictEscalation: [
          { step: "opening", pressure: "欠债入门", expectedPayoff: "得到测试资格" },
          { step: "middle", pressure: "资源被扣", expectedPayoff: "公开夺回灵石" },
          { step: "climax", pressure: "执事下场", expectedPayoff: "宗门高层注意" }
        ],
        resourceChanges: [{ resource: "灵石", from: "无", to: "三枚" }],
        keyPayoffs: ["第一次公开测试逆转"],
        endingHook: "高阶人物察觉灵根异常",
        chapterSeedCount: 3,
        sourceFiles: ["outlines/book.draft.json"],
        sourceDigest: [{ file: "outlines/book.draft.json", excerpt: "陆沉负债入宗门。" }],
        generatedAt: now
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await writeFile(
    path.join(root, "outlines", "chapters-001.draft.json"),
    `${JSON.stringify(
      {
        schemaVersion: "longgu.chapters-plan-draft.v0.2",
        status: "draft",
        volumeId: "001",
        title: "测试小说 第一卷 章节规划",
        genre: "玄幻",
        volumePlanSource: "outlines/volume-001.draft.json",
        chapterCount: 3,
        chapters: [
          {
            chapterId: "001",
            title: "第一章 入门",
            goal: "陆沉拿到入门测试资格。",
            conflict: "执事用欠债压他放弃。",
            payoff: "陆沉以灵根反应压住质疑。",
            informationGain: "宗门测试石会记录异常灵根。",
            endingHook: "测试石裂开一道黑纹。"
          },
          {
            chapterId: "002",
            title: "第二章 黑纹",
            goal: "解释测试石黑纹的危险。",
            conflict: "同门要求重测。",
            payoff: "陆沉拿到第一枚灵石。",
            informationGain: "黑纹与禁地有关。",
            endingHook: "禁地令牌亮起。"
          }
        ],
        sourceFiles: ["outlines/volume-001.draft.json"],
        sourceDigest: [{ file: "outlines/volume-001.draft.json", excerpt: "第一卷目标。" }],
        generatedAt: now
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await mkdir(path.join(root, "audits"), { recursive: true });
  await writeFile(
    path.join(root, "audits", "chapters-001.plan-audit.json"),
    `${JSON.stringify(
      {
        schemaVersion: "longgu.chapter-plan-audit.v0.2",
        volumeId: "001",
        status: "passed",
        blocked: false,
        summary: "Fixture chapter plan is ready for drafting.",
        issues: [],
        sourceFiles: ["outlines/chapters-001.draft.json"],
        generatedAt: now
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await writeFile(
    path.join(root, "state", "truth.json"),
    `${JSON.stringify(
      {
        schemaVersion: "longgu.story-state.v0.3",
        ledger: "truth",
        facts: [{ id: "fact-001", text: "陆沉背负三枚灵石债务。", sourceChapterId: "001" }],
        updatedAt: now
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await mkdir(path.join(root, "summaries"), { recursive: true });
  await writeFile(
    path.join(root, "summaries", "000.summary.json"),
    `${JSON.stringify(
      {
        schemaVersion: "longgu.chapter-summary.v0.7",
        chapterId: "000",
        title: "序章",
        summary: "陆沉为给母亲治病借下灵石债，答应入宗门做杂役。",
        generatedAt: "2026-06-09T11:00:00.000Z"
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

export async function createRoutingFixtureWorkspace(root: string): Promise<void> {
  await createFixtureWorkspace(root);
  await writeFile(
    path.join(root, "longgu.yaml"),
    `title: 测试小说
genre: 玄幻
language: zh-CN
provider:
  name: openai-compatible
  baseUrl: https://api.example.com/v1
  model: legacy-model
  apiKeyEnv: LEGACY_API_KEY
  temperature: 0.7
  maxTokens: 1200
context:
  maxTokens: 16000
models:
  fast:
    provider:
      name: openai-compatible
      baseUrl: https://api.example.com/v1
      model: fast-model
      apiKeyEnv: FAST_API_KEY
      temperature: 0.6
      maxTokens: 900
    cost:
      inputPer1K: 0.001
      outputPer1K: 0.002
  strong:
    provider:
      name: openai-compatible
      baseUrl: https://api.example.com/v1
      model: strong-model
      apiKeyEnv: STRONG_API_KEY
      temperature: 0.8
      maxTokens: 2000
    cost:
      inputPer1K: 0.01
      outputPer1K: 0.03
routes:
  drafting:
    model: fast
    fallback: strong
    importantModel: strong
`,
    "utf8"
  );
}
