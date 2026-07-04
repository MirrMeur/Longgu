import { estimateCost, estimateTokens, resolveModelRoute } from "./modelRouting.js";
import { createRunRecord, finishRunRecord } from "./runs.js";
const defaultGenerationTimeoutMs = 60_000;
const transientRetryCount = 1;
const defaultRetryBackoffMs = 100;
export async function runRoutedTextGeneration(input) {
    const route = resolveModelRoute(input.config, input.task, { important: input.important });
    const startedAt = input.startedAt ?? new Date();
    const run = await createRunRecord({
        workspaceDir: input.workspaceDir,
        chapterId: input.subjectId,
        provider: route.primary.profile.provider.name,
        model: route.primary.profile.provider.model,
        startedAt,
        prompt: input.prompt,
        context: input.context
    });
    const inputTokens = estimateTokens(input.prompt);
    try {
        const routed = await generateWithProfiles({
            prompt: input.prompt,
            config: input.config,
            profiles: [route.primary, ...(route.fallback ? [route.fallback] : [])],
            apiKey: input.apiKey,
            readApiKey: input.readApiKey,
            generate: input.generate,
            generationTimeoutMs: input.generationTimeoutMs ?? defaultGenerationTimeoutMs,
            retryBackoffMs: input.retryBackoffMs ?? defaultRetryBackoffMs
        });
        const outputTokens = estimateTokens(routed.result.text);
        const finishedAt = new Date();
        const metadata = {
            id: run.id,
            status: "success",
            chapterId: input.subjectId,
            task: input.task,
            provider: routed.profile.profile.provider.name,
            model: routed.profile.profile.provider.model,
            modelProfile: routed.profile.id,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            inputFiles: input.context.map((item) => item.file),
            promptFile: "prompt.md",
            outputFile: "output.md",
            fallbackAttempts: inputFallbackAttempts([route.primary, ...(route.fallback ? [route.fallback] : [])], routed.profile),
            inputTokens,
            outputTokens,
            estimatedCost: estimateCost(inputTokens, outputTokens, routed.profile.profile.cost),
            attempts: routed.attempts
        };
        await finishRunRecord({ dir: run.dir, metadata, output: routed.result.text });
        return {
            text: routed.result.text,
            runId: run.id,
            runDir: run.dir,
            modelProfile: routed.profile.id,
            attempts: routed.attempts,
            metadata
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const finishedAt = new Date();
        const metadata = {
            id: run.id,
            status: "failed",
            chapterId: input.subjectId,
            task: input.task,
            provider: route.primary.profile.provider.name,
            model: route.primary.profile.provider.model,
            modelProfile: route.primary.id,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString(),
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            inputFiles: input.context.map((item) => item.file),
            promptFile: "prompt.md",
            errorFile: "error.txt",
            fallbackAttempts: route.fallback ? 1 : 0,
            inputTokens,
            outputTokens: 0,
            estimatedCost: 0
        };
        await finishRunRecord({ dir: run.dir, metadata, error: message });
        throw new Error(message);
    }
}
async function generateWithProfiles(input) {
    const attempts = [];
    let lastError = "";
    for (const profile of input.profiles) {
        const routedConfig = { ...input.config, provider: profile.profile.provider };
        const apiKey = input.readApiKey ? input.readApiKey(profile.profile.provider.apiKeyEnv) : input.apiKey;
        if (!apiKey) {
            throw new Error(`API key check failed. Environment variable ${profile.profile.provider.apiKeyEnv} is not set.`);
        }
        for (let attemptIndex = 0; attemptIndex <= transientRetryCount; attemptIndex += 1) {
            try {
                const result = await generateWithTimeout({
                    prompt: input.prompt,
                    config: routedConfig,
                    apiKey,
                    timeoutMs: input.generationTimeoutMs,
                    generate: input.generate
                });
                attempts.push({
                    modelProfile: profile.id,
                    provider: profile.profile.provider.name,
                    model: profile.profile.provider.model,
                    status: "success"
                });
                return { result, profile, attempts };
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : String(error);
                attempts.push({
                    modelProfile: profile.id,
                    provider: profile.profile.provider.name,
                    model: profile.profile.provider.model,
                    status: "failed",
                    error: lastError
                });
                if (!isTransientProviderError(lastError) || attemptIndex === transientRetryCount) {
                    break;
                }
                await wait(input.retryBackoffMs * 2 ** attemptIndex);
            }
        }
    }
    throw new Error(lastError || "Provider generation failed.");
}
async function generateWithTimeout(input) {
    const controller = new AbortController();
    let timeout;
    const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => {
            reject(new Error(`Provider generation timed out after ${input.timeoutMs}ms.`));
            controller.abort();
        }, input.timeoutMs);
    });
    try {
        return await Promise.race([
            input.generate({ prompt: input.prompt, config: input.config, apiKey: input.apiKey, signal: controller.signal }),
            timeoutPromise
        ]);
    }
    finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
}
function isTransientProviderError(message) {
    return (/timed out|timeout|aborted|network|fetch|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(message) ||
        /HTTP (408|409|425|429|5\d\d)\b/i.test(message));
}
function inputFallbackAttempts(profiles, selectedProfile) {
    return Math.max(0, profiles.findIndex((profile) => profile.id === selectedProfile.id));
}
async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
