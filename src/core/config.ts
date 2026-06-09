import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

export const LongguConfigSchema = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  language: z.string().default("zh-CN"),
  provider: z.object({
    name: z.string().min(1).default("openai-compatible"),
    baseUrl: z.string().url(),
    model: z.string().min(1),
    apiKeyEnv: z.string().min(1),
    temperature: z.number().min(0).max(2).default(0.8),
    maxTokens: z.number().int().positive().default(3000)
  })
});

export type LongguConfig = z.infer<typeof LongguConfigSchema>;

export async function loadLongguConfig(workspaceDir: string): Promise<LongguConfig> {
  const configPath = path.join(workspaceDir, "longgu.yaml");
  const raw = await readFile(configPath, "utf8");
  const parsed = YAML.parse(raw) as unknown;
  return LongguConfigSchema.parse(parsed);
}
