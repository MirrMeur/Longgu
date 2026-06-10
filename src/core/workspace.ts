import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const BIBLE_FILES = [
  "premise.md",
  "characters.md",
  "world.md",
  "style.md"
] as const;

const starterFiles: Record<string, string> = {
  "longgu.yaml": `title: 未命名小说
genre: 玄幻
language: zh-CN
provider:
  name: openai-compatible
  baseUrl: https://api.example.com/v1
  model: example-model
  apiKeyEnv: OPENAI_API_KEY
  temperature: 0.8
  maxTokens: 3000
context:
  maxTokens: 16000
drafting:
  targetWords: 2500
`,
  "bible/premise.md": `# Premise

一句话卖点：

主线矛盾：

读者承诺：
`,
  "bible/characters.md": `# Characters

## 主角

- 姓名：
- 欲望：
- 弱点：
- 金手指：
`,
  "bible/world.md": `# World

世界基础规则：

核心资源：

主要势力：
`,
  "bible/style.md": `# Style

叙事视角：

文风约束：

禁用表达：
`,
  "bible/payoff-recipes.md": `# 爽点配方

## 核心爽点类型

- [ ] 反差打脸
- [ ] 降维打击
- [ ] 身份误会

## 节奏约束

- 最小爽点间隔：2500 字
- 章尾必须保留钩子型爽点
- CP 互动最低频率：每 3 章 1 场非任务互动

## 名场面设计提示

- 每卷至少设计 1 个读者会截图传播的场景
`
};

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function initWorkspace(workspaceDir: string): Promise<{ created: string[]; existing: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];

  for (const dir of ["bible", "outlines", "state", "chapters", "runs"]) {
    const dirPath = path.join(workspaceDir, dir);
    if (await pathExists(dirPath)) {
      existing.push(dir);
    } else {
      await mkdir(dirPath, { recursive: true });
      created.push(dir);
    }
  }

  for (const [relativePath, content] of Object.entries(starterFiles)) {
    const filePath = path.join(workspaceDir, relativePath);
    if (await pathExists(filePath)) {
      existing.push(relativePath);
      continue;
    }
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
    created.push(relativePath);
  }

  return { created, existing };
}

export async function assertWorkspaceShape(workspaceDir: string): Promise<string[]> {
  const missing: string[] = [];
  for (const relativePath of ["longgu.yaml", "bible", "outlines", "state", "chapters", "runs"]) {
    if (!(await pathExists(path.join(workspaceDir, relativePath)))) {
      missing.push(relativePath);
    }
  }
  for (const file of BIBLE_FILES) {
    const relativePath = path.join("bible", file);
    if (!(await pathExists(path.join(workspaceDir, relativePath)))) {
      missing.push(relativePath);
    }
  }
  return missing;
}

export async function loadBibleContext(workspaceDir: string): Promise<{ file: string; content: string }[]> {
  const bibleDir = path.join(workspaceDir, "bible");
  const entries = await readdir(bibleDir);
  const markdownFiles = entries.filter((entry) => entry.endsWith(".md")).sort();
  const context: { file: string; content: string }[] = [];

  for (const file of markdownFiles) {
    context.push({
      file: path.join("bible", file),
      content: await readFile(path.join(bibleDir, file), "utf8")
    });
  }

  return context;
}
