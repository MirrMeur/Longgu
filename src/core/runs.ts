import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type RunStatus = "success" | "failed";

export interface RunMetadata {
  id: string;
  status: RunStatus;
  chapterId: string;
  provider: string;
  model: string;
  startedAt: string;
  finishedAt?: string;
  inputFiles: string[];
  promptFile: string;
  outputFile?: string;
  errorFile?: string;
}

export interface RunRecordInput {
  workspaceDir: string;
  chapterId: string;
  provider: string;
  model: string;
  startedAt: Date;
  prompt: string;
  context: { file: string; content: string }[];
}

export function createRunId(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export async function createRunRecord(input: RunRecordInput): Promise<{ id: string; dir: string }> {
  const id = createRunId(input.startedAt);
  const dir = path.join(input.workspaceDir, "runs", id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "prompt.md"), input.prompt, "utf8");
  await writeFile(path.join(dir, "context.json"), JSON.stringify(input.context, null, 2), "utf8");
  return { id, dir };
}

export async function finishRunRecord(input: {
  dir: string;
  metadata: RunMetadata;
  output?: string;
  error?: string;
}): Promise<void> {
  if (input.output !== undefined) {
    await writeFile(path.join(input.dir, "output.md"), input.output, "utf8");
  }
  if (input.error !== undefined) {
    await writeFile(path.join(input.dir, "error.txt"), input.error, "utf8");
  }
  await writeFile(path.join(input.dir, "metadata.json"), JSON.stringify(input.metadata, null, 2), "utf8");
}

export async function latestRun(workspaceDir: string): Promise<{ id: string; dir: string; metadata: RunMetadata } | null> {
  const runsDir = path.join(workspaceDir, "runs");
  const entries = await readdir(runsDir, { withFileTypes: true }).catch(() => []);
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const id of dirs) {
    const dir = path.join(runsDir, id);
    try {
      const raw = await readFile(path.join(dir, "metadata.json"), "utf8");
      return { id, dir, metadata: JSON.parse(raw) as RunMetadata };
    } catch {
      continue;
    }
  }

  return null;
}
