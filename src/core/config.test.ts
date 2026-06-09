import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadLongguConfig } from "./config.js";

describe("loadLongguConfig", () => {
  it("loads a valid OpenAI-compatible provider config", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-config-"));
    await writeFile(
      path.join(dir, "longgu.yaml"),
      `title: 测试小说
genre: 玄幻
provider:
  baseUrl: https://api.example.com/v1
  model: test-model
  apiKeyEnv: TEST_API_KEY
`,
      "utf8"
    );

    const config = await loadLongguConfig(dir);

    expect(config.provider?.name).toBe("openai-compatible");
    expect(config.provider?.model).toBe("test-model");
    expect(config.language).toBe("zh-CN");
    expect(config.context!.maxTokens).toBe(16000);
  });

  it("loads configured context defaults", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-config-"));
    await writeFile(
      path.join(dir, "longgu.yaml"),
      `title: 测试小说
genre: 玄幻
context:
  maxTokens: 24000
provider:
  baseUrl: https://api.example.com/v1
  model: test-model
  apiKeyEnv: TEST_API_KEY
`,
      "utf8"
    );

    const config = await loadLongguConfig(dir);

    expect(config.context!.maxTokens).toBe(24000);
  });

  it("rejects missing provider fields", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-config-"));
    await writeFile(
      path.join(dir, "longgu.yaml"),
      `title: 测试小说
genre: 玄幻
provider:
  baseUrl: https://api.example.com/v1
`,
      "utf8"
    );

    await expect(loadLongguConfig(dir)).rejects.toThrow();
  });

  it("loads a host-only config without provider settings", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-config-host-"));
    await writeFile(
      path.join(dir, "longgu.yaml"),
      `title: 测试小说
genre: 玄幻
language: zh-CN
context:
  maxTokens: 12000
`,
      "utf8"
    );

    const config = await loadLongguConfig(dir);

    expect(config.provider).toBeUndefined();
    expect(config.genre).toBe("玄幻");
    expect(config.context!.maxTokens).toBe(12000);
  });
});
