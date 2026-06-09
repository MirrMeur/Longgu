import { describe, expect, it } from "vitest";
import { listGenreCards, renderGenrePromptHints, resolveGenreCard } from "./genreCards.js";

describe("genre cards", () => {
  it("contains the eight V0.6 built-in genre cards", () => {
    expect(listGenreCards().map((card) => card.id).sort()).toEqual([
      "game-system",
      "historical",
      "sci-fi",
      "supernatural-mystery",
      "urban",
      "urban-system",
      "xianxia",
      "xuanhuan"
    ]);
  });

  it("resolves Chinese aliases", () => {
    expect(resolveGenreCard("玄幻").id).toBe("xuanhuan");
    expect(resolveGenreCard("悬疑灵异").id).toBe("supernatural-mystery");
    expect(resolveGenreCard("都市系统").id).toBe("urban-system");
  });

  it("falls back to generic for unknown genres", () => {
    const card = resolveGenreCard("未知题材");
    expect(card.id).toBe("generic");
    expect(card.generic).toBe(true);
  });

  it("projects genre-specific prompt hints", () => {
    expect(renderGenrePromptHints(resolveGenreCard("玄幻"))).toContain("境界");
    expect(renderGenrePromptHints(resolveGenreCard("悬疑灵异"))).toContain("线索");
  });
});
