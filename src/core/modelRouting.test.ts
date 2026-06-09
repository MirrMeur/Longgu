import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace, createRoutingFixtureWorkspace } from "../test/testUtils.js";
import { loadLongguConfig } from "./config.js";
import { estimateCost, estimateTokens, listModelProfiles, resolveModelRoute } from "./modelRouting.js";

describe("model routing", () => {
  it("exposes legacy provider as default model profile", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-routing-default-"));
    await createFixtureWorkspace(dir);
    const config = await loadLongguConfig(dir);

    expect(listModelProfiles(config)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "default",
          model: "test-model",
          inputPer1K: 0,
          outputPer1K: 0
        })
      ])
    );
    expect(resolveModelRoute(config, "drafting").primary.id).toBe("default");
  });

  it("resolves task route, fallback, and important model", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-routing-"));
    await createRoutingFixtureWorkspace(dir);
    const config = await loadLongguConfig(dir);

    const route = resolveModelRoute(config, "drafting");
    expect(route.primary.id).toBe("fast");
    expect(route.primary.profile.provider.model).toBe("fast-model");
    expect(route.fallback?.id).toBe("strong");

    const importantRoute = resolveModelRoute(config, "drafting", { important: true });
    expect(importantRoute.primary.id).toBe("strong");
  });

  it("estimates tokens and costs deterministically", () => {
    expect(estimateTokens("一二三四五")).toBe(3);
    expect(estimateCost(1000, 500, { inputPer1K: 0.01, outputPer1K: 0.03 })).toBe(0.025);
  });
});
