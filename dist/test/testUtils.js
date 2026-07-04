import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GUIDED_DIRECTORIES, GUIDED_ROOT_FILES } from "../core/workspace.js";
export async function createFixtureWorkspace(root) {
    await mkdir(path.join(root, "bible"), { recursive: true });
    await mkdir(path.join(root, "outlines"), { recursive: true });
    await mkdir(path.join(root, "state"), { recursive: true });
    await mkdir(path.join(root, "chapters"), { recursive: true });
    await mkdir(path.join(root, "runs"), { recursive: true });
    for (const dir of GUIDED_DIRECTORIES) {
        await mkdir(path.join(root, dir), { recursive: true });
        await mkdir(path.join(root, dir, "角色设定"), { recursive: true });
        await mkdir(path.join(root, dir, "章节摘要"), { recursive: true });
    }
    for (const file of GUIDED_ROOT_FILES) {
        await writeFile(path.join(root, file), "", "utf8");
    }
    await writeFile(path.join(root, "longgu.yaml"), `title: 测试小说
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
`, "utf8");
    await writeFile(path.join(root, "bible", "premise.md"), "# Premise\n\n少年负债入宗门。\n", "utf8");
    await writeFile(path.join(root, "bible", "characters.md"), "# Characters\n\n主角：陆沉。\n", "utf8");
    await writeFile(path.join(root, "bible", "world.md"), "# World\n\n灵石是硬通货。\n", "utf8");
    await writeFile(path.join(root, "bible", "style.md"), "# Style\n\n节奏快，少解释。\n", "utf8");
    await writeFile(path.join(root, "当前步骤.md"), "# 当前步骤\n\n阶段：1. 立项设定\n", "utf8");
    await writeFile(path.join(root, "创作流程.md"), "# 创作流程\n", "utf8");
    await writeFile(path.join(root, "已确认决定.md"), "# 已确认决定\n", "utf8");
    await writeFile(path.join(root, "项目说明.md"), "# 项目说明\n", "utf8");
    await writeFile(path.join(root, "01_立项设定", "_说明.md"), "# 01_立项设定\n", "utf8");
    await writeFile(path.join(root, "01_立项设定", "创作目标.md"), "# 创作目标\n", "utf8");
    await writeFile(path.join(root, "01_立项设定", "故事卖点.md"), "# 故事卖点\n", "utf8");
    await writeFile(path.join(root, "01_立项设定", "读者承诺.md"), "# 读者承诺\n", "utf8");
    await writeFile(path.join(root, "01_立项设定", "不写什么.md"), "# 不写什么\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "_说明.md"), "# 02_设定圣经\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "故事核心.md"), "# 故事核心\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "世界设定.md"), "# 世界设定\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "风格要求.md"), "# 风格要求\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "势力设定.md"), "# 势力设定\n", "utf8");
    await mkdir(path.join(root, "02_设定圣经", "角色设定"), { recursive: true });
    await writeFile(path.join(root, "02_设定圣经", "角色设定", "主角.md"), "# 主角\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "角色设定", "重要配角.md"), "# 重要配角\n", "utf8");
    await writeFile(path.join(root, "02_设定圣经", "角色设定", "反派.md"), "# 反派\n", "utf8");
    await writeFile(path.join(root, "03_大纲", "_说明.md"), "# 03_大纲\n", "utf8");
    await writeFile(path.join(root, "03_大纲", "全书大纲.md"), "# 全书大纲\n", "utf8");
    await writeFile(path.join(root, "03_大纲", "分卷大纲.md"), "# 分卷大纲\n", "utf8");
    await writeFile(path.join(root, "03_大纲", "章节列表.md"), "# 章节列表\n", "utf8");
    await writeFile(path.join(root, "04_伏笔与期待", "_说明.md"), "# 04_伏笔与期待\n", "utf8");
    await writeFile(path.join(root, "04_伏笔与期待", "伏笔账本.md"), "# 伏笔账本\n", "utf8");
    await writeFile(path.join(root, "04_伏笔与期待", "章尾钩子.md"), "# 章尾钩子\n", "utf8");
    await writeFile(path.join(root, "04_伏笔与期待", "读者期待.md"), "# 读者期待\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "_说明.md"), "# 05_前情与状态\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "总前情.md"), "# 总前情\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "当前卷前情.md"), "# 当前卷前情\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "近期前情.md"), "# 近期前情\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "角色状态.md"), "# 角色状态\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "世界状态.md"), "# 世界状态\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "关系状态.md"), "# 关系状态\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "未解决问题.md"), "# 未解决问题\n", "utf8");
    await writeFile(path.join(root, "05_前情与状态", "连续性风险.md"), "# 连续性风险\n", "utf8");
    await writeFile(path.join(root, "06_章节规划", "_说明.md"), "# 06_章节规划\n", "utf8");
    await writeFile(path.join(root, "06_章节规划", "第001章_规划.md"), "# 第001章_规划\n", "utf8");
    await writeFile(path.join(root, "07_正文", "_说明.md"), "# 07_正文\n", "utf8");
    await writeFile(path.join(root, "07_正文", "第001章.md"), "# 第001章\n", "utf8");
    await writeFile(path.join(root, "08_AI审稿", "_说明.md"), "# 08_AI审稿\n", "utf8");
    await writeFile(path.join(root, "08_AI审稿", "第001章_审稿.md"), "# 第001章_审稿\n", "utf8");
}
export async function createHostOnlyFixtureWorkspace(root) {
    await createFixtureWorkspace(root);
    await writeFile(path.join(root, "longgu.yaml"), `title: 测试小说
genre: 玄幻
language: zh-CN
context:
  maxTokens: 16000
`, "utf8");
}
export async function createPlanningStateFixture(root) {
    await createFixtureWorkspace(root);
    const now = "2026-06-09T12:00:00.000Z";
    await writeFile(path.join(root, "outlines", "volume-001.draft.json"), `${JSON.stringify({
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
    }, null, 2)}\n`, "utf8");
    await writeFile(path.join(root, "outlines", "chapters-001.draft.json"), `${JSON.stringify({
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
    }, null, 2)}\n`, "utf8");
    await mkdir(path.join(root, "audits"), { recursive: true });
    await writeFile(path.join(root, "audits", "chapters-001.plan-audit.json"), `${JSON.stringify({
        schemaVersion: "longgu.chapter-plan-audit.v0.2",
        volumeId: "001",
        status: "passed",
        blocked: false,
        summary: "Fixture chapter plan is ready for drafting.",
        issues: [],
        sourceFiles: ["outlines/chapters-001.draft.json"],
        generatedAt: now
    }, null, 2)}\n`, "utf8");
    await writeFile(path.join(root, "state", "truth.json"), `${JSON.stringify({
        schemaVersion: "longgu.story-state.v0.3",
        ledger: "truth",
        facts: [{ id: "fact-001", text: "陆沉背负三枚灵石债务。", sourceChapterId: "001" }],
        updatedAt: now
    }, null, 2)}\n`, "utf8");
    await mkdir(path.join(root, "summaries"), { recursive: true });
    await writeFile(path.join(root, "summaries", "000.summary.json"), `${JSON.stringify({
        schemaVersion: "longgu.chapter-summary.v0.7",
        chapterId: "000",
        title: "序章",
        summary: "陆沉为给母亲治病借下灵石债，答应入宗门做杂役。",
        generatedAt: "2026-06-09T11:00:00.000Z"
    }, null, 2)}\n`, "utf8");
}
export async function createRoutingFixtureWorkspace(root) {
    await createFixtureWorkspace(root);
    await writeFile(path.join(root, "longgu.yaml"), `title: 测试小说
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
`, "utf8");
}
