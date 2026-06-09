import type { LongguConfig } from "../core/config.js";

export interface GenerateRequest {
  prompt: string;
  config: LongguConfig;
  apiKey: string;
}

export interface GenerateResult {
  text: string;
}

export async function checkOpenAICompatible(config: LongguConfig, apiKey: string): Promise<void> {
  const endpoint = new URL("models", ensureTrailingSlash(config.provider.baseUrl));
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
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
      max_tokens: request.config.provider.maxTokens
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
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Provider generation failed: empty response content");
  }
  return { text };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
