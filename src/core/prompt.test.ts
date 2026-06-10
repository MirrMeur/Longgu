import { describe, expect, it } from "vitest";
import { renderChapterPrompt } from "./prompt.js";

describe("renderChapterPrompt", () => {
  it("renders chapter id and context files", () => {
    const prompt = renderChapterPrompt({
      chapterId: "001",
      config: {
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
        },
        drafting: {
          targetWords: 1800
        }
      },
      context: [{ file: "bible/premise.md", content: "主角入局" }]
    });

    expect(prompt).toContain("第 001 章");
    expect(prompt).toContain("目标字数：约 1800 字");
    expect(prompt).toContain("bible/premise.md");
    expect(prompt).toContain("主角入局");
  });

  it("allows chapter cards to override the global target word count", () => {
    const prompt = renderChapterPrompt({
      chapterId: "001",
      targetWords: 3200,
      config: {
        title: "测试小说",
        genre: "玄幻",
        language: "zh-CN",
        drafting: { targetWords: 1800 }
      },
      context: []
    });

    expect(prompt).toContain("目标字数：约 3200 字");
  });
});
