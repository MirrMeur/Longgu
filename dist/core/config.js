import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";
export const defaultDraftingTargetWords = 2500;
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
export const ContextConfigSchema = z.object({
    maxTokens: z.number().int().positive().default(16000)
});
export const DraftingConfigSchema = z.object({
    targetWords: z.number().int().positive().default(defaultDraftingTargetWords)
});
export const MarketConfigSchema = z.object({
    platform: z.enum(["qidian", "fanqie", "feilu", "zongheng"]).optional(),
    targetAudience: z.string().min(1).optional(),
    updateCadence: z.enum(["daily", "twice-daily"]).optional()
});
export const LongguConfigSchema = z.object({
    title: z.string().min(1),
    genre: z.string().min(1),
    language: z.string().default("zh-CN"),
    provider: ProviderConfigSchema.optional(),
    context: ContextConfigSchema.default({ maxTokens: 16000 }),
    drafting: DraftingConfigSchema.default({ targetWords: defaultDraftingTargetWords }),
    market: MarketConfigSchema.optional(),
    models: z.record(z.string().min(1), ModelProfileSchema).optional(),
    routes: z.record(z.string().min(1), ModelRouteSchema).optional()
});
export async function loadLongguConfig(workspaceDir) {
    const configPath = path.join(workspaceDir, "longgu.yaml");
    const raw = await readFile(configPath, "utf8");
    const parsed = YAML.parse(raw);
    return LongguConfigSchema.parse(parsed);
}
export function requireProviderConfig(config) {
    if (!config?.provider) {
        throw new Error("Provider configuration is required for this command. Add provider settings to longgu.yaml or use a host-LLM workflow.");
    }
    return config.provider;
}
export function requireProviderBackedConfig(config) {
    requireProviderConfig(config);
    return config;
}
