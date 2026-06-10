import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFixtureWorkspace, createRoutingFixtureWorkspace } from "../test/testUtils.js";
import { loadLongguConfig } from "./config.js";
import { runRoutedTextGeneration } from "./modelExecution.js";

describe("routed model execution retry policy", () => {
  it("retries transient provider failures before fallback", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-model-retry-transient-"));
    await createRoutingFixtureWorkspace(dir);
    const config = await loadLongguConfig(dir);
    const models: string[] = [];

    const result = await runRoutedTextGeneration({
      workspaceDir: dir,
      task: "drafting",
      subjectId: "001",
      config,
      prompt: "write",
      context: [],
      readApiKey: (envName) => `${envName}-secret`,
      retryBackoffMs: 0,
      generate: async ({ config: routedConfig }) => {
        models.push(routedConfig.provider.model);
        if (models.length === 1) {
          throw new Error("Provider generation failed: HTTP 502 Bad Gateway");
        }
        return { text: "retry recovered" };
      }
    });

    expect(models).toEqual(["fast-model", "fast-model"]);
    expect(result.modelProfile).toBe("fast");
    expect(result.metadata.fallbackAttempts).toBe(0);
    expect(result.metadata.attempts?.map((attempt) => attempt.status)).toEqual(["failed", "success"]);
  });

  it("does not retry hard provider failures before fallback", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-model-retry-hard-"));
    await createRoutingFixtureWorkspace(dir);
    const config = await loadLongguConfig(dir);
    const models: string[] = [];

    const result = await runRoutedTextGeneration({
      workspaceDir: dir,
      task: "drafting",
      subjectId: "001",
      config,
      prompt: "write",
      context: [],
      readApiKey: (envName) => `${envName}-secret`,
      retryBackoffMs: 0,
      generate: async ({ config: routedConfig }) => {
        models.push(routedConfig.provider.model);
        if (routedConfig.provider.model === "fast-model") {
          throw new Error("Provider generation failed: HTTP 401 Unauthorized");
        }
        return { text: "fallback recovered" };
      }
    });

    expect(models).toEqual(["fast-model", "strong-model"]);
    expect(result.modelProfile).toBe("strong");
    expect(result.metadata.fallbackAttempts).toBe(1);
  });

  it("aborts generation calls that exceed the per-call timeout", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "longgu-model-retry-timeout-"));
    await createFixtureWorkspace(dir);
    const config = await loadLongguConfig(dir);
    let aborted = false;

    await expect(
      runRoutedTextGeneration({
        workspaceDir: dir,
        task: "drafting",
        subjectId: "001",
        config,
        prompt: "write",
        context: [],
        apiKey: "secret",
        generationTimeoutMs: 5,
        retryBackoffMs: 0,
        generate: ({ signal }) =>
          new Promise<{ text: string }>((_, reject) => {
            signal?.addEventListener("abort", () => {
              aborted = true;
              reject(new Error("aborted"));
            });
          })
      })
    ).rejects.toThrow("timed out");
    expect(aborted).toBe(true);
  });
});
