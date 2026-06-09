import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createFixtureWorkspace(root: string): Promise<void> {
  await mkdir(path.join(root, "bible"), { recursive: true });
  await mkdir(path.join(root, "outlines"), { recursive: true });
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
`,
    "utf8"
  );
  await writeFile(path.join(root, "bible", "premise.md"), "# Premise\n\n少年负债入宗门。\n", "utf8");
  await writeFile(path.join(root, "bible", "characters.md"), "# Characters\n\n主角：陆沉。\n", "utf8");
  await writeFile(path.join(root, "bible", "world.md"), "# World\n\n灵石是硬通货。\n", "utf8");
  await writeFile(path.join(root, "bible", "style.md"), "# Style\n\n节奏快，少解释。\n", "utf8");
}
