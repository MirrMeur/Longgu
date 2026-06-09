import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

export const ProviderConfigSchema = z.object({
  name: z.string().min(1).default("openai-compatible"),
  baseUrl: z.string().url(),
  model: z.string().min(1),
  apiKeyEnv: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.8),
  maxTokens: z.number().int().positive().default(3000)
});

export const ModelCostSchema = z.object({
  inputPer1K: z.number().min(0).default(0),
  outputPer1K: z.number().min(0).default(0)
});

export const ModelProfileSchema = z.object({
  provider: ProviderConfigSchema,
  cost: ModelCostSchema.default({ inputPer1K: 0, outputPer1K: 0 })
});

export const ModelRouteSchema = z.object({
  model: z.string().min(1),
  fallback: z.string().min(1).optional(),
  importantModel: z.string().min(1).optional()
});

export const LongguConfigSchema = z.object({
  title: z.string().min(1),
  genre: z.string().min(1),
  language: z.string().default("zh-CN"),
  provider: ProviderConfigSchema,
  models: z.record(z.string().min(1), ModelProfileSchema).optional(),
  routes: z.record(z.string().min(1), ModelRouteSchema).optional()
});

export type LongguConfig = z.infer<typeof LongguConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ModelCost = z.infer<typeof ModelCostSchema>;
export type ModelProfile = z.infer<typeof ModelProfileSchema>;
export type ModelRoute = z.infer<typeof ModelRouteSchema>;

export async function loadLongguConfig(workspaceDir: string): Promise<LongguConfig> {
  const configPath = path.join(workspaceDir, "longgu.yaml");
  const raw = await readFile(configPath, "utf8");
  const parsed = YAML.parse(raw) as unknown;
  return LongguConfigSchema.parse(parsed);
}
