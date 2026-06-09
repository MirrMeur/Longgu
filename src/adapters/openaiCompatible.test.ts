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

  it("checks model connectivity", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await checkOpenAICompatible(config, "secret");

    expect(fetchMock).toHaveBeenCalledWith(new URL("https://api.example.com/v1/models"), {
      headers: { Authorization: "Bearer secret" }
    });
  });

  it("generates text from chat completions response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: "第一章正文" } }] }), { status: 200 })
      )
    );

    const result = await generateWithOpenAICompatible({ config, apiKey: "secret", prompt: "write" });

    expect(result.text).toBe("第一章正文");
  });

  it("reports provider generation errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502, statusText: "Bad Gateway" })));

    await expect(generateWithOpenAICompatible({ config, apiKey: "secret", prompt: "write" })).rejects.toThrow(
      "Provider generation failed"
    );
  });
});
