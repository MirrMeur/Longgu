import { afterEach, describe, expect, it, vi } from "vitest";
import { checkOpenAICompatible, generateWithOpenAICompatible } from "./openaiCompatible.js";
import type { LongguConfig } from "../core/config.js";

const config: LongguConfig = {
  title: "测试小说",
  genre: "玄幻",
  language: "zh-CN",
  provider: {
    name: "openai-compatible",
    baseUrl: "https://api.example.com/v1",
    model: "test-model",
    apiKeyEnv: "TEST_API_KEY",
    temperature: 0.8,
    maxTokens: 3000
  }
};

describe("openAICompatible adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checks provider connectivity through chat completions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await checkOpenAICompatible(config, "secret");

    expect(fetchMock).toHaveBeenCalledWith(new URL("https://api.example.com/v1/chat/completions"), {
      method: "POST",
      headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "test-model",
        messages: [{ role: "user", content: "Reply with OK." }],
        temperature: 0,
        max_tokens: 1
      })
    });
  });

  it("generates text from chat completions response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: "第一章正文" } }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateWithOpenAICompatible({ config, apiKey: "secret", prompt: "write" });

    expect(result.text).toBe("第一章正文");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ max_tokens: 3000 });
  });

  it("reserves extra request budget for likely reasoning models", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "第一章正文" } }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateWithOpenAICompatible({
      config: { ...config, provider: { ...config.provider, model: "deepseek-r1" } },
      apiKey: "secret",
      prompt: "write"
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ max_tokens: 4500 });
  });

  it("reports provider generation errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502, statusText: "Bad Gateway" })));

    await expect(generateWithOpenAICompatible({ config, apiKey: "secret", prompt: "write" })).rejects.toThrow(
      "Provider generation failed"
    );
  });

  it("reports reasoning-only empty responses with a max token hint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { reasoning_content: "思考过程", content: "" } }] }), {
          status: 200
        })
      )
    );

    await expect(generateWithOpenAICompatible({ config, apiKey: "secret", prompt: "write" })).rejects.toThrow(
      "increase provider.maxTokens above 3000"
    );
  });
});
