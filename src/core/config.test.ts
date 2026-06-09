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

    expect(config.provider.name).toBe("openai-compatible");
    expect(config.provider.model).toBe("test-model");
    expect(config.language).toBe("zh-CN");
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
});
