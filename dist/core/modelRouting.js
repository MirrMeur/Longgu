import { requireProviderConfig } from "./config.js";
export { estimateTokens } from "./tokenEstimate.js";
export const modelTasks = ["planning", "drafting", "audit", "revise", "settle", "experiment", "summarize"];
export function listModelProfiles(config) {
    return Object.entries(getModelProfiles(config))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([id, profile]) => ({
        id,
        provider: profile.provider.name,
        model: profile.provider.model,
        apiKeyEnv: profile.provider.apiKeyEnv,
        inputPer1K: profile.cost.inputPer1K,
        outputPer1K: profile.cost.outputPer1K
    }));
}
export function getModelProfiles(config) {
    return {
        default: { provider: requireProviderConfig(config), cost: { inputPer1K: 0, outputPer1K: 0 } },
        ...(config.models ?? {})
    };
}
export function resolveModelRoute(config, task, options = {}) {
    const profiles = getModelProfiles(config);
    const route = config.routes?.[task];
    const primaryId = options.important && route?.importantModel ? route.importantModel : route?.model ?? "default";
    const primary = resolveProfile(profiles, primaryId);
    const fallback = route?.fallback ? resolveProfile(profiles, route.fallback) : undefined;
    return { task, primary, fallback };
}
export function estimateCost(inputTokens, outputTokens, cost) {
    const estimated = (inputTokens / 1000) * cost.inputPer1K + (outputTokens / 1000) * cost.outputPer1K;
    return Number(estimated.toFixed(6));
}
function resolveProfile(profiles, id) {
    const profile = profiles[id];
    if (!profile) {
        throw new Error(`Model profile not found: ${id}`);
    }
    return { id, profile };
}
