import type { ProviderBackedLongguConfig } from "../core/config.js";

export interface GenerateRequest {
  prompt: string;
  config: ProviderBackedLongguConfig;
  apiKey: string;
}

export interface GenerateResult {
  text: string;
}

export async function checkOpenAICompatible(config: ProviderBackedLongguConfig, apiKey: string): Promise<void> {
  const endpoint = new URL("chat/completions", ensureTrailingSlash(config.provider.baseUrl));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.provider.model,
      messages: [{ role: "user", content: "Reply with OK." }],
      temperature: 0,
      max_tokens: 1
    })
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Provider connectivity check failed: ${message}`);
  });

  if (!response.ok) {
    throw new Error(`Provider connectivity check failed: HTTP ${response.status} ${response.statusText}`);
  }
}

export async function generateWithOpenAICompatible(request: GenerateRequest): Promise<GenerateResult> {
  const endpoint = new URL("chat/completions", ensureTrailingSlash(request.config.provider.baseUrl));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: request.config.provider.model,
      messages: [{ role: "user", content: request.prompt }],
      temperature: request.config.provider.temperature,
      max_tokens: resolveRequestMaxTokens(request.config.provider.model, request.config.provider.maxTokens)
    })
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Provider generation failed: ${message}`);
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Provider generation failed: HTTP ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };
  const message = data.choices?.[0]?.message;
  const text = message?.content;
  if (!text) {
    if (message?.reasoning_content) {
      throw new Error(
        `Provider generation failed: empty response content after reasoning output. This looks like a reasoning model exhausted its output budget; increase provider.maxTokens above ${request.config.provider.maxTokens}.`
      );
    }
    throw new Error("Provider generation failed: empty response content");
  }
  return { text };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveRequestMaxTokens(model: string, configuredMaxTokens: number): number {
  return isLikelyReasoningModel(model) ? Math.ceil(configuredMaxTokens * 1.5) : configuredMaxTokens;
}

function isLikelyReasoningModel(model: string): boolean {
  const normalized = model.toLowerCase();
  return ["reasoning", "thinking", "deepseek-r", "deepseek-v4", "r1", "kimi-k2", "o1", "o3", "o4"].some((marker) =>
    normalized.includes(marker)
  );
}
